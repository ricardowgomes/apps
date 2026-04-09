import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("../infrastructure/telegram-client", () => ({
	sendMessage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../infrastructure/github-actions-client", () => ({
	triggerImplementation: vi.fn().mockResolvedValue(undefined),
	mergePr: vi.fn().mockResolvedValue(undefined),
	closePr: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./ai-planner", () => ({
	generatePlan: vi
		.fn()
		.mockResolvedValue(
			"**Feature: Test**\n\nSteps:\n1. Do thing\n\nEffort: S\nBranch: feat/test-feature",
		),
	revisePlan: vi
		.fn()
		.mockResolvedValue(
			"**Feature: Test (revised)**\n\nSteps:\n1. Do revised thing\n\nEffort: S\nBranch: feat/test-feature",
		),
	extractBranchSlug: vi.fn().mockReturnValue("feat/test-feature"),
}));

vi.mock("../infrastructure/d1-conversation-repository");

vi.mock("@/observability/error-reporter", () => ({
	reportError: vi.fn().mockResolvedValue(undefined),
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import * as repo from "../infrastructure/d1-conversation-repository";
import * as github from "../infrastructure/github-actions-client";
import * as telegram from "../infrastructure/telegram-client";
import * as planner from "./ai-planner";
import {
	handleDeployNotification,
	handleMessage,
	handlePrCreated,
} from "./conversation-handler";

beforeEach(() => {
	vi.clearAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConversation(
	overrides: Partial<{
		id: string;
		phoneNumber: string;
		state: string;
		featureRequest: string;
		plan: string | null;
		prUrl: string | null;
		prNumber: number | null;
		branchName: string | null;
	}> = {},
) {
	return {
		id: "conv-1",
		phoneNumber: "8637801816",
		state: "awaiting_approval",
		featureRequest: "Add dark mode",
		plan: "**Feature: Dark mode**\n\nBranch: feat/dark-mode",
		prUrl: null,
		prNumber: null,
		branchName: null,
		createdAt: "2026-01-01",
		updatedAt: "2026-01-01",
		...overrides,
	};
}

const mockDb = {} as D1Database;

const baseEnv = {
	DB: mockDb,
	TELEGRAM_BOT_TOKEN: "bot-token",
	GITHUB_TOKEN: "gh-token",
	WORKER_NOTIFY_SECRET: "notify-secret",
	ANTHROPIC_API_KEY: "ant-key",
	ALLOWED_TELEGRAM_CHAT_IDS: "8637801816",
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("handleMessage — new conversation", () => {
	beforeEach(() => {
		vi.mocked(repo.findActive).mockResolvedValue(null);
		vi.mocked(repo.create).mockResolvedValue(undefined);
	});

	it("generates a plan and sends it when no active conversation", async () => {
		await handleMessage(baseEnv, "8637801816", "Add dark mode");

		expect(planner.generatePlan).toHaveBeenCalledWith(
			"Add dark mode",
			expect.objectContaining({ ANTHROPIC_API_KEY: "ant-key" }),
		);
		expect(telegram.sendMessage).toHaveBeenCalledTimes(2); // "generating..." + plan
		expect(repo.create).toHaveBeenCalledWith(
			mockDb,
			expect.objectContaining({ featureRequest: "Add dark mode" }),
		);
	});

	it("sends error message when plan generation fails", async () => {
		vi.mocked(planner.generatePlan).mockRejectedValueOnce(
			new Error("All providers failed"),
		);

		await handleMessage(baseEnv, "8637801816", "Add dark mode");

		expect(telegram.sendMessage).toHaveBeenLastCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("Failed to generate plan"),
		);
		expect(repo.create).not.toHaveBeenCalled();
	});

	it("rejects unauthorized chat IDs", async () => {
		await handleMessage(baseEnv, "9999999", "Add dark mode");

		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"9999999",
			expect.stringContaining("not authorized"),
		);
		expect(repo.findActive).not.toHaveBeenCalled();
	});

	it("allows all IDs when ALLOWED_TELEGRAM_CHAT_IDS is not set", async () => {
		const env = { ...baseEnv, ALLOWED_TELEGRAM_CHAT_IDS: undefined };
		await handleMessage(env, "any-id", "Add dark mode");

		expect(repo.findActive).toHaveBeenCalled();
	});
});

describe("handleMessage — awaiting_approval state", () => {
	beforeEach(() => {
		vi.mocked(repo.findActive).mockResolvedValue(makeConversation() as never);
		vi.mocked(repo.updateState).mockResolvedValue(undefined);
		vi.mocked(repo.updatePlan).mockResolvedValue(undefined);
	});

	it("triggers implementation on YES", async () => {
		await handleMessage(baseEnv, "8637801816", "yes");

		expect(repo.updateState).toHaveBeenCalledWith(
			mockDb,
			"conv-1",
			"implementing",
			expect.objectContaining({ branchName: "feat/test-feature" }),
		);
		expect(github.triggerImplementation).toHaveBeenCalled();
	});

	it("marks done on CANCEL", async () => {
		await handleMessage(baseEnv, "8637801816", "cancel");

		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
		expect(github.triggerImplementation).not.toHaveBeenCalled();
	});

	it("revises the plan on feedback text", async () => {
		await handleMessage(baseEnv, "8637801816", "make it simpler");

		expect(planner.revisePlan).toHaveBeenCalled();
		expect(repo.updatePlan).toHaveBeenCalledWith(
			mockDb,
			"conv-1",
			expect.stringContaining("revised"),
		);
	});

	it("sends error message when plan revision fails", async () => {
		vi.mocked(planner.revisePlan).mockRejectedValueOnce(
			new Error("Gemini down"),
		);

		await handleMessage(baseEnv, "8637801816", "make it simpler");

		expect(telegram.sendMessage).toHaveBeenLastCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("Failed to revise plan"),
		);
		expect(repo.updatePlan).not.toHaveBeenCalled();
	});
});

describe("handleMessage — implementing state", () => {
	it("replies with waiting message", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(
			makeConversation({ state: "implementing" }) as never,
		);

		await handleMessage(baseEnv, "8637801816", "any");

		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("implementing"),
		);
	});
});

describe("handleMessage — awaiting_ship state", () => {
	beforeEach(() => {
		vi.mocked(repo.findActive).mockResolvedValue(
			makeConversation({
				state: "awaiting_ship",
				prUrl: "https://github.com/ricardowgomes/apps/pull/42",
				prNumber: 42,
			}) as never,
		);
		vi.mocked(repo.updateState).mockResolvedValue(undefined);
	});

	it("merges PR on SHIP", async () => {
		await handleMessage(baseEnv, "8637801816", "ship");

		expect(github.mergePr).toHaveBeenCalledWith("gh-token", 42);
		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
	});

	it("warns when SHIP is sent but no PR number exists", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(
			makeConversation({
				state: "awaiting_ship",
				prUrl: "https://url",
				prNumber: null,
			}) as never,
		);

		await handleMessage(baseEnv, "8637801816", "ship");

		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("No PR number"),
		);
		expect(github.mergePr).not.toHaveBeenCalled();
	});

	it("closes PR on CANCEL", async () => {
		await handleMessage(baseEnv, "8637801816", "cancel");

		expect(github.closePr).toHaveBeenCalledWith("gh-token", 42);
		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
	});

	it("reminds about options on unrecognized message", async () => {
		await handleMessage(baseEnv, "8637801816", "what?");

		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("SHIP"),
		);
		expect(github.mergePr).not.toHaveBeenCalled();
	});
});

describe("handleMessage — done state", () => {
	it("treats message as a new feature request when state is done", async () => {
		// First call returns "done" conversation, second call (recursive) returns null
		vi.mocked(repo.findActive)
			.mockResolvedValueOnce(makeConversation({ state: "done" }) as never)
			.mockResolvedValueOnce(null);
		vi.mocked(repo.create).mockResolvedValue(undefined);

		await handleMessage(baseEnv, "8637801816", "Add search");

		expect(planner.generatePlan).toHaveBeenCalledWith(
			"Add search",
			expect.any(Object),
		);
	});
});

describe("handlePrCreated", () => {
	it("updates state to awaiting_ship and notifies user", async () => {
		vi.mocked(repo.findById).mockResolvedValue(makeConversation() as never);
		vi.mocked(repo.updateState).mockResolvedValue(undefined);

		await handlePrCreated(
			baseEnv,
			"conv-1",
			"https://github.com/ricardowgomes/apps/pull/10",
			10,
		);

		expect(repo.updateState).toHaveBeenCalledWith(
			mockDb,
			"conv-1",
			"awaiting_ship",
			{ prUrl: "https://github.com/ricardowgomes/apps/pull/10", prNumber: 10 },
		);
		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("PR is ready"),
		);
	});

	it("does nothing if conversation not found", async () => {
		vi.mocked(repo.findById).mockResolvedValue(null);

		await handlePrCreated(baseEnv, "missing-id", "https://url", 1);

		expect(repo.updateState).not.toHaveBeenCalled();
		expect(telegram.sendMessage).not.toHaveBeenCalled();
	});
});

describe("handleDeployNotification", () => {
	it("sends success message to all allowed chat IDs", async () => {
		const env = {
			...baseEnv,
			ALLOWED_TELEGRAM_CHAT_IDS: "111,222",
		};

		await handleDeployNotification(
			env,
			"success",
			"https://app.example.dev",
			"feat: dark mode",
		);

		expect(telegram.sendMessage).toHaveBeenCalledTimes(2);
		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"111",
			expect.stringContaining("Deployed"),
		);
		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"222",
			expect.stringContaining("Deployed"),
		);
	});

	it("sends failure message", async () => {
		await handleDeployNotification(
			baseEnv,
			"failure",
			"https://app.example.dev",
			"feat: dark mode",
		);

		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("failed"),
		);
	});

	it("does nothing when ALLOWED_TELEGRAM_CHAT_IDS is not set", async () => {
		const env = { ...baseEnv, ALLOWED_TELEGRAM_CHAT_IDS: undefined };

		await handleDeployNotification(env, "success", "https://url", "msg");

		expect(telegram.sendMessage).not.toHaveBeenCalled();
	});
});
