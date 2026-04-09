import { reportError } from "@/observability/error-reporter";
import type { Conversation } from "../domain/conversation";
import { isCancelCommand, isShipCommand } from "../domain/conversation";
import {
	create,
	findActive,
	findById,
	findStuck,
	getLastUpdateId,
	getMessages,
	saveMessage,
	setLastUpdateId,
	updatePlan,
	updateState,
} from "../infrastructure/d1-conversation-repository";
import {
	closePr,
	mergePr,
	triggerImplementation,
} from "../infrastructure/github-actions-client";
import { sendMessage } from "../infrastructure/telegram-client";
import {
	type AssistantTurn,
	askAssistant,
	extractBranchSlug,
} from "./ai-assistant";

interface Env {
	DB: D1Database;
	TELEGRAM_BOT_TOKEN: string;
	GITHUB_TOKEN: string;
	WORKER_NOTIFY_SECRET: string;
	ANTHROPIC_API_KEY?: string;
	GEMINI_API_KEY?: string;
	GROK_API_KEY?: string;
	OPENAI_API_KEY?: string;
	ALLOWED_TELEGRAM_CHAT_IDS?: string;
}

function providerKeys(env: Env) {
	return {
		ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
		GEMINI_API_KEY: env.GEMINI_API_KEY,
		GROK_API_KEY: env.GROK_API_KEY,
		OPENAI_API_KEY: env.OPENAI_API_KEY,
	};
}

async function reply(env: Env, chatId: string, text: string) {
	await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, text);
}

function buildImplementationSpec(conv: Conversation): string {
	return `# Feature Request

${conv.featureRequest}

# Implementation Plan

${conv.plan ?? "Follow the feature request directly."}

# Instructions

- Read CLAUDE.md and docs/architecture.md before starting
- Follow DDD structure: new code in src/{domain}/domain/, application/, infrastructure/, ui/
- Write integration tests (co-located, .integration.test.ts suffix)
- Write at least one E2E test in tests/e2e/{domain}/
- Run npm run test and npm run check before committing
- Create branch: ${conv.branchName ?? "feat/remote-feature"}
- Commit frequently after each meaningful change
- Open a PR when done with: gh pr create --fill
- The PR body must include: "conversation_id: ${conv.id}"`;
}

function formatPrReadyMessage(conv: Conversation): string {
	return `PR is ready! 🎉

${conv.prUrl}

Reply *SHIP* to merge and deploy, or *CANCEL* to close the PR.`;
}

/** Main entry point — called from the Telegram webhook for every incoming message */
export async function handleMessage(
	env: Env,
	from: string,
	text: string,
	updateId?: number,
): Promise<void> {
	// ── Authorization ─────────────────────────────────────────────────────
	if (env.ALLOWED_TELEGRAM_CHAT_IDS) {
		const allowed = env.ALLOWED_TELEGRAM_CHAT_IDS.split(",").map((n) =>
			n.trim(),
		);
		if (!allowed.includes(from)) {
			await reply(env, from, "Sorry, you are not authorized to use this bot.");
			return;
		}
	}

	// ── Deduplication — skip Telegram webhook retries ─────────────────────
	if (updateId !== undefined) {
		const lastSeen = await getLastUpdateId(env.DB, from);
		if (updateId <= lastSeen) return;
		await setLastUpdateId(env.DB, from, updateId);
	}

	// ── Universal cancel — works from any state ───────────────────────────
	const active = await findActive(env.DB, from);

	if (active && isCancelCommand(text)) {
		if (active.prNumber) {
			try {
				await closePr(env.GITHUB_TOKEN, active.prNumber);
			} catch {
				// Best-effort — don't block the cancel if GitHub is unavailable
			}
		}
		await updateState(env.DB, active.id, "done");
		await reply(env, from, "Cancelled. ✋ Send me a new request anytime.");
		return;
	}

	// ── SHIP keyword shortcut — high-stakes action, keep it explicit ──────
	if (active?.state === "awaiting_ship" && isShipCommand(text)) {
		if (!active.prNumber) {
			await reply(
				env,
				from,
				"No PR number found — please merge manually or send CANCEL.",
			);
			return;
		}
		await mergePr(env.GITHUB_TOKEN, active.prNumber);
		await updateState(env.DB, active.id, "done");
		await saveMessage(env.DB, active.id, "user", text);
		await saveMessage(
			env.DB,
			active.id,
			"assistant",
			"Merged! 🚢 CI is deploying now.",
		);
		await reply(env, from, "Merged! 🚢 CI is deploying now.");
		return;
	}

	// ── Resolve or create the active conversation ─────────────────────────
	let conversation = active;
	if (!conversation) {
		const id = crypto.randomUUID();
		await create(env.DB, {
			id,
			phoneNumber: from,
			featureRequest: text,
			plan: null,
		});
		conversation = {
			id,
			phoneNumber: from,
			state: "active",
			featureRequest: text,
			plan: null,
			prUrl: null,
			prNumber: null,
			branchName: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
	}

	// Save the user's message to history
	await saveMessage(env.DB, conversation.id, "user", text);

	// Load recent history for the LLM
	const history = await getMessages(env.DB, conversation.id, 20);

	// ── Ask the LLM what to do ────────────────────────────────────────────
	let turn: AssistantTurn;
	try {
		turn = await askAssistant({
			state: conversation.state,
			pendingPlan: conversation.plan,
			prUrl: conversation.prUrl,
			history,
			keys: providerKeys(env),
		});
	} catch (err) {
		await Promise.all([
			reply(
				env,
				from,
				`Something went wrong talking to the AI: ${err}. Try again.`,
			),
			reportError(env, err, { handler: "askAssistant" }),
		]);
		return;
	}

	// ── Handle each turn type ─────────────────────────────────────────────
	switch (turn.type) {
		case "plan": {
			// LLM has produced a plan — save it, state stays 'active'
			await updatePlan(env.DB, conversation.id, turn.plan);
			break;
		}

		case "build": {
			// User approved a pending plan — start implementation
			const planToRun = conversation.plan;
			if (!planToRun) {
				// LLM produced 'build' with no pending plan — treat as chat
				turn = {
					type: "chat",
					message:
						"I don't have a plan to build yet. Tell me what you'd like to implement.",
				};
				break;
			}
			const branch = extractBranchSlug(planToRun);
			await updateState(env.DB, conversation.id, "implementing", {
				branchName: branch,
			});

			// Refresh conversation with updated plan/branchName
			const specConv: Conversation = {
				...conversation,
				plan: planToRun,
				branchName: branch,
			};
			try {
				await triggerImplementation(
					env.GITHUB_TOKEN,
					conversation.id,
					buildImplementationSpec(specConv),
					branch.replace("feat/", ""),
				);
			} catch (err) {
				await updateState(env.DB, conversation.id, "done");
				turn = {
					type: "chat",
					message: `Failed to start implementation ❌\n\n${err}\n\nSend your request again to retry.`,
				};
				await reportError(env, err, { handler: "triggerImplementation" });
			}
			break;
		}

		case "ship": {
			// LLM recognized a ship intent (natural language, not keyword)
			if (!active?.prNumber) {
				turn = {
					type: "chat",
					message: "No PR number found — please merge manually or send CANCEL.",
				};
				break;
			}
			try {
				await mergePr(env.GITHUB_TOKEN, active.prNumber);
				await updateState(env.DB, conversation.id, "done");
			} catch (err) {
				turn = {
					type: "chat",
					message: `Failed to merge PR ❌\n\n${err}\n\nYou can merge manually or try again.`,
				};
			}
			break;
		}

		case "cancel": {
			// LLM recognized a cancel intent
			if (active?.prNumber) {
				try {
					await closePr(env.GITHUB_TOKEN, active.prNumber);
				} catch {
					// Best-effort
				}
			}
			await updateState(env.DB, conversation.id, "done");
			break;
		}

		case "chat": {
			// Nothing extra to do — just send the message below
			break;
		}
	}

	// Save and send the assistant's reply
	await saveMessage(env.DB, conversation.id, "assistant", turn.message);
	await reply(env, from, turn.message);
}

/** Called by the GitHub Actions notify webhook when a PR is created */
export async function handlePrCreated(
	env: Env,
	conversationId: string,
	prUrl: string,
	prNumber: number,
): Promise<void> {
	const conv = await findById(env.DB, conversationId);
	if (!conv) return;

	await updateState(env.DB, conversationId, "awaiting_ship", {
		prUrl,
		prNumber,
	});

	const updated: Conversation = {
		...conv,
		prUrl,
		prNumber,
		state: "awaiting_ship",
	};
	const message = formatPrReadyMessage(updated);
	await saveMessage(env.DB, conversationId, "assistant", message);
	await reply(env, conv.phoneNumber, message);
}

/** Called by the GitHub Actions notify webhook when implementation fails */
export async function handleImplementationFailed(
	env: Env,
	conversationId: string,
	runUrl: string,
): Promise<void> {
	const conv = await findById(env.DB, conversationId);
	if (!conv) return;

	await updateState(env.DB, conversationId, "done");
	const message = `Implementation failed ❌\n\nSee the logs: ${runUrl}\n\nSend your request again to retry.`;
	await saveMessage(env.DB, conversationId, "assistant", message);
	await reply(env, conv.phoneNumber, message);
}

/** Called by the GitHub Actions deploy job when deployment completes */
export async function handleDeployNotification(
	env: Env,
	status: "success" | "failure",
	deployUrl: string,
	commitMessage: string,
): Promise<void> {
	if (!env.ALLOWED_TELEGRAM_CHAT_IDS) return;

	const chatIds = env.ALLOWED_TELEGRAM_CHAT_IDS.split(",").map((n) => n.trim());
	const message =
		status === "success"
			? `Deployed! ✅\n\n${deployUrl}\n\n${commitMessage}`
			: `Deploy failed ❌\n\nCheck GitHub Actions for details.`;

	for (const chatId of chatIds) {
		await reply(env, chatId, message);
	}
}

/**
 * Called by the Cloudflare cron trigger every 10 minutes.
 * Finds conversations stuck in 'implementing' for > 20 minutes and auto-cancels them.
 */
export async function checkStuckConversations(env: Env): Promise<void> {
	const stuck = await findStuck(env.DB, 20);
	for (const conv of stuck) {
		await updateState(env.DB, conv.id, "done");
		const message =
			`Implementation timed out ⏱️ after 20 minutes.\n\n` +
			`The GitHub Actions run may have failed or hung.\n` +
			`Check: https://github.com/ricardowgomes/apps/actions\n\n` +
			`Send your request again to retry.`;
		await saveMessage(env.DB, conv.id, "assistant", message);
		await reply(env, conv.phoneNumber, message);
	}
}
