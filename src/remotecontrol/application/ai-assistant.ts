/**
 * AI assistant for the Telegram bot.
 *
 * Replaces the old ai-planner.ts. The LLM now drives the full conversation:
 * it decides whether to chat, ask clarifying questions, propose a plan,
 * approve a build, or cancel — based on message history and current state.
 */

import type { ConversationState, Message } from "../domain/conversation";

// ── Turn types ─────────────────────────────────────────────────────────────

export type AssistantTurn =
	| { type: "chat"; message: string }
	| { type: "plan"; message: string; plan: string; branch: string }
	| { type: "build"; message: string }
	| { type: "ship"; message: string }
	| { type: "cancel"; message: string };

// ── Provider infrastructure ───────────────────────────────────────────────

interface ProviderKeys {
	ANTHROPIC_API_KEY?: string;
	GEMINI_API_KEY?: string;
	GROK_API_KEY?: string;
	OPENAI_API_KEY?: string;
}

interface Provider {
	name: string;
	keyEnv: keyof ProviderKeys;
	call: (
		messages: LLMMessage[],
		system: string,
		apiKey: string,
	) => Promise<string>;
}

interface LLMMessage {
	role: "user" | "assistant";
	content: string;
}

async function callAnthropic(
	messages: LLMMessage[],
	system: string,
	apiKey: string,
): Promise<string> {
	const res = await fetch("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01",
			"content-type": "application/json",
		},
		body: JSON.stringify({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 1024,
			system,
			messages,
		}),
	});
	if (!res.ok) throw new Error(`Anthropic ${res.status}`);
	const data = await res.json<{ content: Array<{ text: string }> }>();
	return data.content[0].text;
}

async function callGemini(
	messages: LLMMessage[],
	system: string,
	apiKey: string,
): Promise<string> {
	// Convert to Gemini's alternating turn format
	const contents = messages.map((m) => ({
		role: m.role === "assistant" ? "model" : "user",
		parts: [{ text: m.content }],
	}));
	const res = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				system_instruction: { parts: [{ text: system }] },
				contents,
				generationConfig: { responseMimeType: "application/json" },
			}),
		},
	);
	if (!res.ok) throw new Error(`Gemini ${res.status}`);
	const data = await res.json<{
		candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
	}>();
	return data.candidates[0].content.parts[0].text;
}

async function callOpenAICompat(
	messages: LLMMessage[],
	system: string,
	apiKey: string,
	baseUrl: string,
	model: string,
): Promise<string> {
	const res = await fetch(`${baseUrl}/chat/completions`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			model,
			response_format: { type: "json_object" },
			messages: [{ role: "system", content: system }, ...messages],
			max_tokens: 1024,
		}),
	});
	if (!res.ok) throw new Error(`${baseUrl} ${res.status}`);
	const data = await res.json<{
		choices: Array<{ message: { content: string } }>;
	}>();
	return data.choices[0].message.content;
}

const PROVIDERS: Provider[] = [
	{
		name: "anthropic",
		keyEnv: "ANTHROPIC_API_KEY",
		call: callAnthropic,
	},
	{
		name: "gemini",
		keyEnv: "GEMINI_API_KEY",
		call: callGemini,
	},
	{
		name: "grok",
		keyEnv: "GROK_API_KEY",
		call: (msgs, sys, key) =>
			callOpenAICompat(msgs, sys, key, "https://api.x.ai/v1", "grok-3-mini"),
	},
	{
		name: "openai",
		keyEnv: "OPENAI_API_KEY",
		call: (msgs, sys, key) =>
			callOpenAICompat(
				msgs,
				sys,
				key,
				"https://api.openai.com/v1",
				"gpt-4o-mini",
			),
	},
];

async function callWithFallback(
	messages: LLMMessage[],
	system: string,
	keys: ProviderKeys,
): Promise<string> {
	const errors: string[] = [];
	for (const provider of PROVIDERS) {
		const key = keys[provider.keyEnv];
		if (!key) continue;
		try {
			return await provider.call(messages, system, key);
		} catch (err) {
			errors.push(`${provider.name}: ${err}`);
		}
	}
	throw new Error(
		`All AI providers failed or no API keys configured. Errors: ${errors.join("; ")}`,
	);
}

// ── System prompt ─────────────────────────────────────────────────────────

function buildSystemPrompt(
	state: ConversationState,
	pendingPlan: string | null,
	prUrl: string | null,
): string {
	const stateContext = {
		active: pendingPlan
			? `State: ACTIVE — a plan has been proposed and is awaiting the user's decision.
Pending plan:
${pendingPlan}`
			: "State: ACTIVE — no pending plan yet. Conversation is open.",
		implementing:
			"State: IMPLEMENTING — a build is running. Do NOT propose or start new builds until it completes.",
		awaiting_ship: `State: AWAITING SHIP — implementation is done. PR is ready at: ${prUrl ?? "(no URL)"}. Guide the user to SHIP or CANCEL.`,
		done: "State: DONE — this conversation is complete. A new request is starting.",
	}[state];

	return `You are Ricardo's personal coding bot, embedded in his Telegram. You are his hands on the keyboard for the exponencial web app (TanStack Start + Cloudflare Workers + TypeScript).

You can do anything a developer would do: build features, fix bugs, investigate issues, answer questions about the codebase, review ideas. You work by generating an implementation plan, getting Ricardo's approval, then triggering a Claude Code agent that opens a PR.

${stateContext}

Respond ONLY with a valid JSON object in this exact format:
{
  "type": "chat" | "plan" | "build" | "ship" | "cancel",
  "message": "the text to send to the user (Telegram Markdown is fine)",
  "plan": "full plan text — ONLY when type=plan",
  "branch": "feat/slug — ONLY when type=plan"
}

Type rules:
- "chat": conversation, questions, status updates, clarifications. Use this when you need more info before planning, or when Ricardo just wants to talk through something. Do NOT say you can't access the codebase — you can build fixes for anything Ricardo describes.
- "plan": when you have enough information to propose a concrete implementation. Use for features AND bug fixes. If Ricardo describes a bug, treat it as a fix request and produce a plan.
  Plan format:
  **Feature: {title}** (or **Fix: {title}** for bugs)

  Steps:
  1. {step}
  ...

  Effort: S | M | L
  Branch: feat/{slug} (or fix/{slug} for bugs)

  Rules: max 8 steps, no test or deploy steps (always included), S=<2h M=half-day L=full-day+
- "build": ONLY when Ricardo clearly approves a pending plan (yes, go ahead, lgtm, looks good, etc.)
- "ship": ONLY when Ricardo wants to merge a ready PR (ship, merge, deploy) and state is awaiting_ship
- "cancel": ONLY when Ricardo explicitly cancels or aborts

When Ricardo describes a bug or unexpected behavior:
- Ask 1-2 focused clarifying questions if needed (use "chat")
- OR go straight to a fix plan if the issue is clear enough (use "plan")
- Never say "I don't have access" — you don't need access to respond; the Claude Code agent that runs the PR has full repo access

If you are uncertain whether Ricardo is approving a plan or raising something new, use "chat" to clarify.
Never output "build" if there is no pending plan.
Never output "plan" or "build" when state is implementing.`;
}

// ── Public API ────────────────────────────────────────────────────────────

interface AskAssistantOptions {
	state: ConversationState;
	pendingPlan: string | null;
	prUrl: string | null;
	history: Message[];
	keys: ProviderKeys;
}

/**
 * Ask the LLM what to do next, given the conversation state and full message history.
 * Falls back to { type: "chat", message: rawText } if JSON parsing fails.
 */
export async function askAssistant(
	options: AskAssistantOptions,
): Promise<AssistantTurn> {
	const { state, pendingPlan, prUrl, history, keys } = options;

	const system = buildSystemPrompt(state, pendingPlan, prUrl);
	const messages: LLMMessage[] = history.map((m) => ({
		role: m.role,
		content: m.content,
	}));

	const raw = await callWithFallback(messages, system, keys);

	try {
		// Strip markdown code fences if present (some models wrap JSON in ```)
		const cleaned = raw
			.replace(/^```(?:json)?\s*/i, "")
			.replace(/\s*```$/, "")
			.trim();
		const parsed = JSON.parse(cleaned) as AssistantTurn;
		if (!parsed.type || !parsed.message) throw new Error("missing fields");
		return parsed;
	} catch {
		// Graceful fallback: treat unparseable response as plain chat
		return { type: "chat", message: raw };
	}
}

/** Extract a branch slug from a plan string */
export function extractBranchSlug(plan: string): string {
	const match = plan.match(/Branch:\s*(feat\/[\w-]+)/i);
	return match?.[1] ?? "feat/remote-feature";
}
