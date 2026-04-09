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
			model: "claude-sonnet-4-6",
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

	return `You are Ricardo's Telegram assistant for the exponencial web app (TanStack Start + React 19 + Cloudflare Workers + TypeScript + Tailwind + D1 SQLite). Domains are under src/{domain}/domain/, application/, infrastructure/, ui/.

Codebase structure:
src/auth/         — Google OAuth + D1 sessions
src/finance/      — transactions, categories, portfolio, charts
src/stories/      — story creation, scenes, image generation per scene
  domain/story.ts              — Story, Scene types
  application/story-server-fns.ts — server functions (get/create/delete)
  application/use-stories.ts   — React hooks
  infrastructure/d1-story-repository.ts — D1 queries
  ui/NewStoryPage.tsx, StoriesPage.tsx, StoryViewerPage.tsx
src/remotecontrol/ — this Telegram bot + GitHub Actions trigger
src/routes/       — file-based routes + API endpoints
src/components/   — shared UI (BottomNav, PortfolioHeader)

${stateContext}

Your role: take Ricardo's request and either answer it conversationally or produce a concrete plan that a Claude Code agent will execute. The agent has full repo access — it will read files, run commands, and open a PR. Your plan just needs to point it in the right direction.

Respond ONLY with valid JSON:
{
  "type": "chat" | "plan" | "build" | "ship" | "cancel",
  "message": "text to send Ricardo (Telegram Markdown ok)",
  "plan": "full plan text — ONLY when type=plan",
  "branch": "fix/{slug} or feat/{slug} — ONLY when type=plan"
}

Type rules:
- "chat": conversational reply or one focused clarifying question. Use sparingly — prefer acting over asking.
- "plan": produce actionable steps the agent will follow. For bugs, use the codebase structure above to name specific files/areas to investigate. Example: "Inspect src/stories/application/story-server-fns.ts to find where scenes are created, check if image generation is called for each scene or just the first, fix the loop." The agent fills in the exact code — your job is correct direction.
  Format:
  **Fix: {title}** or **Feature: {title}**
  Steps:
  1. …
  Effort: S | M | L
  Branch: fix/{slug} or feat/{slug}
  (max 8 steps; omit testing/deploy steps — always included automatically)
- "build": Ricardo approved the pending plan (yes / lgtm / go ahead / looks good)
- "ship": Ricardo wants to merge the PR — only when state is awaiting_ship
- "cancel": Ricardo explicitly cancels or aborts

Never ask Ricardo to share code or file paths. Never explain your own architecture or limitations. Never refuse — produce a plan or ask one question.
Never output "build" with no pending plan. Never output "plan" or "build" when state is implementing.`;
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
