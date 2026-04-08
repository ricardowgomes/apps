import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractBranchSlug, generatePlan, revisePlan } from "./ai-planner";

// ── fetch mock ────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
beforeEach(() => {
	vi.stubGlobal("fetch", mockFetch);
});
afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

function mockAnthropicSuccess(text: string) {
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

function mockGeminiSuccess(text: string) {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: async () => ({
			candidates: [{ content: { parts: [{ text }] } }],
		}),
	});
}

function mockOpenAICompatSuccess(text: string) {
	mockFetch.mockResolvedValueOnce({
		ok: true,
		json: async () => ({ choices: [{ message: { content: text } }] }),
	});
}

const SAMPLE_PLAN =
	"**Feature: Dark mode**\n\nSteps:\n1. Add toggle\n\nEffort: S\nBranch: feat/dark-mode";

// ── extractBranchSlug ─────────────────────────────────────────────────────────

describe("extractBranchSlug", () => {
	it("extracts branch from plan text", () => {
		expect(extractBranchSlug(SAMPLE_PLAN)).toBe("feat/dark-mode");
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

// ── generatePlan ──────────────────────────────────────────────────────────────

describe("generatePlan", () => {
	it("calls Anthropic when key is present and returns plan", async () => {
		mockAnthropicSuccess(SAMPLE_PLAN);

		const result = await generatePlan("Add dark mode", {
			ANTHROPIC_API_KEY: "key-ant",
		});

		expect(result).toBe(SAMPLE_PLAN);
		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.anthropic.com/v1/messages",
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("falls back to Gemini when Anthropic fails", async () => {
		mockAnthropicFailure();
		mockGeminiSuccess(SAMPLE_PLAN);

		const result = await generatePlan("Add dark mode", {
			ANTHROPIC_API_KEY: "key-ant",
			GEMINI_API_KEY: "key-gem",
		});

		expect(result).toBe(SAMPLE_PLAN);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it("skips providers with no key and uses the next available", async () => {
		mockGeminiSuccess(SAMPLE_PLAN);

		const result = await generatePlan("Add dark mode", {
			GEMINI_API_KEY: "key-gem",
		});

		expect(result).toBe(SAMPLE_PLAN);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("falls back to OpenAI-compat (Grok) when earlier providers fail", async () => {
		mockAnthropicFailure();
		mockOpenAICompatSuccess(SAMPLE_PLAN);

		const result = await generatePlan("Add dark mode", {
			ANTHROPIC_API_KEY: "key-ant",
			GROK_API_KEY: "key-grok",
		});

		expect(result).toBe(SAMPLE_PLAN);
	});

	it("throws when all providers fail or no keys are set", async () => {
		await expect(generatePlan("Add dark mode", {})).rejects.toThrow(
			"All AI providers failed",
		);
	});

	it("throws when all configured providers fail", async () => {
		mockAnthropicFailure();

		await expect(
			generatePlan("Add dark mode", { ANTHROPIC_API_KEY: "key" }),
		).rejects.toThrow("All AI providers failed");
	});
});

// ── revisePlan ────────────────────────────────────────────────────────────────

describe("revisePlan", () => {
	it("includes original request, current plan, and feedback in the prompt", async () => {
		mockAnthropicSuccess(SAMPLE_PLAN);

		await revisePlan("Add dark mode", SAMPLE_PLAN, "make it simpler", {
			ANTHROPIC_API_KEY: "key-ant",
		});

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.messages[0].content).toContain("Add dark mode");
		expect(body.messages[0].content).toContain("make it simpler");
	});
});
