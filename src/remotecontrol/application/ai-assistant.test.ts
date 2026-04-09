import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { askAssistant, extractBranchSlug } from "./ai-assistant";

// ── fetch mock ────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
beforeEach(() => {
	vi.stubGlobal("fetch", mockFetch);
});
afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

function mockAnthropicJson(json: object) {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: async () => ({ content: [{ text: JSON.stringify(json) }] }),
	});
}

function mockAnthropicText(text: string) {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: async () => ({ content: [{ text }] }),
	});
}

function mockAnthropicFailure(status = 429) {
	mockFetch.mockResolvedValueOnce({
		ok: false,
		status,
		text: async () => "Rate limited",
	});
}

function mockGeminiJson(json: object) {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: async () => ({
			candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }],
		}),
	});
}

function mockOpenAICompatJson(json: object) {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: async () => ({
			choices: [{ message: { content: JSON.stringify(json) } }],
		}),
	});
}

const KEYS = { ANTHROPIC_API_KEY: "ant-key" };

const baseHistory = [
	{
		id: "m1",
		conversationId: "c1",
		role: "user" as const,
		content: "hello",
		createdAt: "2026-01-01",
	},
];

// ── extractBranchSlug ─────────────────────────────────────────────────────────

describe("extractBranchSlug", () => {
	it("extracts branch from plan text", () => {
		expect(extractBranchSlug("Branch: feat/dark-mode")).toBe("feat/dark-mode");
	});

	it("returns default slug when no branch line present", () => {
		expect(extractBranchSlug("no branch here")).toBe("feat/remote-feature");
	});

	it("handles mixed-case Branch: label", () => {
		expect(extractBranchSlug("BRANCH: feat/my-feature")).toBe(
			"feat/my-feature",
		);
	});
});

// ── askAssistant ──────────────────────────────────────────────────────────────

describe("askAssistant — structured output", () => {
	it("returns a chat turn when LLM outputs valid JSON", async () => {
		mockAnthropicJson({ type: "chat", message: "Hello! How can I help?" });

		const result = await askAssistant({
			state: "active",
			pendingPlan: null,
			prUrl: null,
			history: baseHistory,
			keys: KEYS,
		});

		expect(result).toEqual({ type: "chat", message: "Hello! How can I help?" });
	});

	it("returns a plan turn with plan and branch", async () => {
		const plan =
			"**Feature: Dark mode**\n\nSteps:\n1. Add toggle\n\nEffort: S\nBranch: feat/dark-mode";
		mockAnthropicJson({
			type: "plan",
			message: "Here's the plan:",
			plan,
			branch: "feat/dark-mode",
		});

		const result = await askAssistant({
			state: "active",
			pendingPlan: null,
			prUrl: null,
			history: baseHistory,
			keys: KEYS,
		});

		expect(result.type).toBe("plan");
		if (result.type === "plan") {
			expect(result.branch).toBe("feat/dark-mode");
		}
	});

	it("returns a build turn when user approves pending plan", async () => {
		mockAnthropicJson({ type: "build", message: "Starting implementation!" });

		const result = await askAssistant({
			state: "active",
			pendingPlan: "**Feature: Dark mode**\nBranch: feat/dark-mode",
			prUrl: null,
			history: baseHistory,
			keys: KEYS,
		});

		expect(result.type).toBe("build");
	});

	it("falls back to chat turn when LLM returns unparseable text", async () => {
		mockAnthropicText("Sorry, I couldn't understand that request.");

		const result = await askAssistant({
			state: "active",
			pendingPlan: null,
			prUrl: null,
			history: baseHistory,
			keys: KEYS,
		});

		expect(result).toEqual({
			type: "chat",
			message: "Sorry, I couldn't understand that request.",
		});
	});

	it("strips markdown code fences before parsing JSON", async () => {
		mockAnthropicText('```json\n{"type":"chat","message":"Hello"}\n```');

		const result = await askAssistant({
			state: "active",
			pendingPlan: null,
			prUrl: null,
			history: baseHistory,
			keys: KEYS,
		});

		expect(result).toEqual({ type: "chat", message: "Hello" });
	});
});

describe("askAssistant — provider fallback", () => {
	it("falls back to Gemini when Anthropic fails", async () => {
		mockAnthropicFailure();
		mockGeminiJson({ type: "chat", message: "From Gemini" });

		const result = await askAssistant({
			state: "active",
			pendingPlan: null,
			prUrl: null,
			history: baseHistory,
			keys: { ANTHROPIC_API_KEY: "ant-key", GEMINI_API_KEY: "gem-key" },
		});

		expect(result.message).toBe("From Gemini");
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it("falls back to OpenAI-compat (Grok) when Anthropic fails", async () => {
		mockAnthropicFailure();
		mockOpenAICompatJson({ type: "chat", message: "From Grok" });

		const result = await askAssistant({
			state: "active",
			pendingPlan: null,
			prUrl: null,
			history: baseHistory,
			keys: { ANTHROPIC_API_KEY: "ant-key", GROK_API_KEY: "grok-key" },
		});

		expect(result.message).toBe("From Grok");
	});

	it("throws when all providers fail or no keys are configured", async () => {
		await expect(
			askAssistant({
				state: "active",
				pendingPlan: null,
				prUrl: null,
				history: baseHistory,
				keys: {},
			}),
		).rejects.toThrow("All AI providers failed");
	});

	it("skips providers with no key", async () => {
		mockGeminiJson({ type: "chat", message: "Only Gemini" });

		const result = await askAssistant({
			state: "active",
			pendingPlan: null,
			prUrl: null,
			history: baseHistory,
			keys: { GEMINI_API_KEY: "gem-key" },
		});

		expect(result.message).toBe("Only Gemini");
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});
});

describe("askAssistant — system prompt includes state context", () => {
	it("includes pending plan in system prompt when one exists", async () => {
		mockAnthropicJson({ type: "build", message: "Building!" });

		await askAssistant({
			state: "active",
			pendingPlan: "**Feature: Test**\nBranch: feat/test",
			prUrl: null,
			history: baseHistory,
			keys: KEYS,
		});

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.system).toContain("Pending plan");
		expect(body.system).toContain("feat/test");
	});

	it("includes PR URL in system prompt when awaiting_ship", async () => {
		mockAnthropicJson({ type: "ship", message: "Merging!" });

		await askAssistant({
			state: "awaiting_ship",
			pendingPlan: null,
			prUrl: "https://github.com/ricardowgomes/apps/pull/42",
			history: baseHistory,
			keys: KEYS,
		});

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.system).toContain("pull/42");
	});

	it("warns about no new builds in implementing state", async () => {
		mockAnthropicJson({ type: "chat", message: "Still building..." });

		await askAssistant({
			state: "implementing",
			pendingPlan: null,
			prUrl: null,
			history: baseHistory,
			keys: KEYS,
		});

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.system).toContain("Do NOT propose or start new builds");
	});
});
