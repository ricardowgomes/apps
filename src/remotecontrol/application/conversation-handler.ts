import { reportError } from "@/observability/error-reporter";
import type { Conversation } from "../domain/conversation";
import {
	isApproval,
	isCancellation,
	isShipCommand,
} from "../domain/conversation";
import {
	create,
	findActive,
	findById,
	updatePlan,
	updateState,
} from "../infrastructure/d1-conversation-repository";
import { closePr, mergePr } from "../infrastructure/github-actions-client";
import { runRemoteTrigger } from "../infrastructure/remote-trigger-client";
import { sendMessage } from "../infrastructure/telegram-client";
import { extractBranchSlug, generatePlan, revisePlan } from "./ai-planner";

interface Env {
	DB: D1Database;
	TELEGRAM_BOT_TOKEN: string;
	GITHUB_TOKEN: string;
	CLAUDE_AI_API_TOKEN: string;
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

function formatPlanMessage(plan: string): string {
	return `${plan}

─────────────────
Reply *YES* to start implementing, describe changes to revise, or *CANCEL* to abort.`;
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
): Promise<void> {
	// Authorization check
	if (env.ALLOWED_TELEGRAM_CHAT_IDS) {
		const allowed = env.ALLOWED_TELEGRAM_CHAT_IDS.split(",").map((n) =>
			n.trim(),
		);
		if (!allowed.includes(from)) {
			await reply(env, from, "Sorry, you are not authorized to use this bot.");
			return;
		}
	}

	const active = await findActive(env.DB, from);

	// ── No active conversation → new feature request ──────────────────────────
	if (!active) {
		await reply(env, from, "Got it! Generating a plan... ⏳");

		let plan: string;
		try {
			plan = await generatePlan(text, providerKeys(env));
		} catch (err) {
			await Promise.all([
				reply(env, from, `Failed to generate plan: ${err}. Please try again.`),
				reportError(env, err, { handler: "generatePlan" }),
			]);
			return;
		}

		const id = crypto.randomUUID();
		await create(env.DB, {
			id,
			phoneNumber: from,
			featureRequest: text,
			plan,
		});

		await reply(env, from, formatPlanMessage(plan));
		return;
	}

	// ── Active conversation — route by state ──────────────────────────────────
	switch (active.state) {
		case "awaiting_approval": {
			if (isCancellation(text)) {
				await updateState(env.DB, active.id, "done");
				await reply(
					env,
					from,
					"Cancelled. Send me your next feature request anytime! 👋",
				);
				return;
			}

			if (isApproval(text)) {
				const branch = extractBranchSlug(active.plan ?? "");
				await updateState(env.DB, active.id, "implementing", {
					branchName: branch,
				});

				const spec = buildImplementationSpec(active, env.WORKER_NOTIFY_SECRET);
				await runRemoteTrigger(env.CLAUDE_AI_API_TOKEN, spec);

				await reply(
					env,
					from,
					`Implementation started! 🚀\n\nClaude Code is working on it. I'll send you the PR link when it's ready (usually a few minutes).`,
				);
				return;
			}

			// Any other message is treated as feedback to revise the plan
			await reply(env, from, "Revising the plan... ⏳");
			let revised: string;
			try {
				revised = await revisePlan(
					active.featureRequest,
					active.plan ?? "",
					text,
					providerKeys(env),
				);
			} catch (err) {
				await Promise.all([
					reply(env, from, `Failed to revise plan: ${err}. Try again.`),
					reportError(env, err, { handler: "revisePlan" }),
				]);
				return;
			}
			await updatePlan(env.DB, active.id, revised);
			await reply(env, from, formatPlanMessage(revised));
			return;
		}

		case "implementing": {
			await reply(
				env,
				from,
				"Still implementing... I'll notify you when the PR is ready. Sit tight! ⏳",
			);
			return;
		}

		case "awaiting_ship": {
			if (isCancellation(text)) {
				if (active.prNumber) {
					await closePr(env.GITHUB_TOKEN, active.prNumber);
				}
				await updateState(env.DB, active.id, "done");
				await reply(
					env,
					from,
					"PR closed. Send me another feature request anytime! 👋",
				);
				return;
			}

			if (isShipCommand(text)) {
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
				await reply(
					env,
					from,
					`Merged! 🚢 CI is deploying now. I'll notify you when it's live.`,
				);
				return;
			}

			await reply(
				env,
				from,
				`Reply *SHIP* to merge and deploy, or *CANCEL* to close the PR.\n\n${active.prUrl ?? ""}`,
			);
			return;
		}

		case "done": {
			// Treat as a new feature request
			await handleMessage(env, from, text);
			return;
		}
	}
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
	await reply(env, conv.phoneNumber, formatPrReadyMessage(updated));
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

function buildImplementationSpec(
	conv: Conversation,
	notifySecret: string,
): string {
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
- Open a PR when done with:
    gh pr create --title "feat: ${conv.branchName ?? "remote-feature"}" --body "conversation_id: ${conv.id}"
- After the PR is open, notify the controller by running exactly this in Bash:
    PR_URL=$(gh pr view --json url -q .url)
    PR_NUMBER=$(gh pr view --json number -q .number)
    curl -s -X POST https://app.ricardowgomes.workers.dev/api/github/webhook \\
      -H "Authorization: Bearer ${notifySecret}" \\
      -H "Content-Type: application/json" \\
      -d "{\\"event\\":\\"pr_created\\",\\"conversation_id\\":\\"${conv.id}\\",\\"pr_url\\":\\"$PR_URL\\",\\"pr_number\\":$PR_NUMBER}"`;
}
