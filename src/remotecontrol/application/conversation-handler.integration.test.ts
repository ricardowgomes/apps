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

vi.mock("./ai-assistant", () => ({
	askAssistant: vi.fn().mockResolvedValue({ type: "chat", message: "Hello!" }),
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
import * as assistant from "./ai-assistant";
import {
	checkStuckConversations,
	handleDeployNotification,
	handleImplementationFailed,
	handleMessage,
	handlePrCreated,
} from "./conversation-handler";

beforeEach(() => {
	vi.clearAllMocks();
	// Default: no active conversation, dedup passes
	vi.mocked(repo.findActive).mockResolvedValue(null);
	vi.mocked(repo.getLastUpdateId).mockResolvedValue(0);
	vi.mocked(repo.setLastUpdateId).mockResolvedValue(undefined);
	vi.mocked(repo.create).mockResolvedValue(undefined);
	vi.mocked(repo.saveMessage).mockResolvedValue(undefined);
	vi.mocked(repo.getMessages).mockResolvedValue([]);
	vi.mocked(repo.updateState).mockResolvedValue(undefined);
	vi.mocked(repo.updatePlan).mockResolvedValue(undefined);
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
		state: "active",
		featureRequest: "Add dark mode",
		plan: null,
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

// ── Authorization ─────────────────────────────────────────────────────────────

describe("authorization", () => {
	it("rejects unauthorized chat IDs", async () => {
		await handleMessage(baseEnv, "9999999", "hello");

		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"9999999",
			expect.stringContaining("not authorized"),
		);
		expect(repo.findActive).not.toHaveBeenCalled();
	});

	it("allows all IDs when ALLOWED_TELEGRAM_CHAT_IDS is not set", async () => {
		const env = { ...baseEnv, ALLOWED_TELEGRAM_CHAT_IDS: undefined };
		await handleMessage(env, "any-id", "hello");

		expect(repo.findActive).toHaveBeenCalled();
	});
});

// ── Deduplication ─────────────────────────────────────────────────────────────

describe("deduplication", () => {
	it("skips processing when update_id was already seen", async () => {
		vi.mocked(repo.getLastUpdateId).mockResolvedValue(100);

		await handleMessage(baseEnv, "8637801816", "hello", 100);

		expect(repo.findActive).not.toHaveBeenCalled();
		expect(telegram.sendMessage).not.toHaveBeenCalled();
	});

	it("processes when update_id is newer than last seen", async () => {
		vi.mocked(repo.getLastUpdateId).mockResolvedValue(99);

		await handleMessage(baseEnv, "8637801816", "hello", 100);

		expect(repo.setLastUpdateId).toHaveBeenCalledWith(
			mockDb,
			"8637801816",
			100,
		);
		expect(repo.findActive).toHaveBeenCalled();
	});

	it("processes normally when no update_id provided", async () => {
		await handleMessage(baseEnv, "8637801816", "hello");

		expect(repo.getLastUpdateId).not.toHaveBeenCalled();
		expect(repo.findActive).toHaveBeenCalled();
	});
});

// ── Universal cancel ──────────────────────────────────────────────────────────

describe("universal cancel", () => {
	it("cancels active conversation on CANCEL", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(makeConversation() as never);

		await handleMessage(baseEnv, "8637801816", "cancel");

		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("Cancelled"),
		);
		expect(assistant.askAssistant).not.toHaveBeenCalled();
	});

	it("closes PR on cancel when PR exists", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(
			makeConversation({ state: "awaiting_ship", prNumber: 42 }) as never,
		);

		await handleMessage(baseEnv, "8637801816", "cancel");

		expect(github.closePr).toHaveBeenCalledWith("gh-token", 42);
		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
	});

	it("cancels with 'stop' keyword", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(makeConversation() as never);

		await handleMessage(baseEnv, "8637801816", "stop");

		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
	});
});

// ── SHIP shortcut ─────────────────────────────────────────────────────────────

describe("SHIP shortcut", () => {
	it("merges PR immediately on SHIP keyword", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(
			makeConversation({ state: "awaiting_ship", prNumber: 42 }) as never,
		);

		await handleMessage(baseEnv, "8637801816", "ship");

		expect(github.mergePr).toHaveBeenCalledWith("gh-token", 42);
		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
		expect(assistant.askAssistant).not.toHaveBeenCalled();
	});

	it("warns when SHIP sent but no PR number", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(
			makeConversation({ state: "awaiting_ship", prNumber: null }) as never,
		);

		await handleMessage(baseEnv, "8637801816", "ship");

		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("No PR number"),
		);
		expect(github.mergePr).not.toHaveBeenCalled();
	});
});

// ── LLM-driven responses ──────────────────────────────────────────────────────

describe("LLM chat response", () => {
	it("sends LLM chat reply and saves messages", async () => {
		vi.mocked(assistant.askAssistant).mockResolvedValue({
			type: "chat",
			message: "D1 is a relational SQLite database.",
		});

		await handleMessage(baseEnv, "8637801816", "what is D1?");

		expect(repo.saveMessage).toHaveBeenCalledWith(
			mockDb,
			expect.any(String),
			"user",
			"what is D1?",
		);
		expect(repo.saveMessage).toHaveBeenCalledWith(
			mockDb,
			expect.any(String),
			"assistant",
			"D1 is a relational SQLite database.",
		);
		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			"D1 is a relational SQLite database.",
		);
	});

	it("sends error message when askAssistant fails", async () => {
		vi.mocked(assistant.askAssistant).mockRejectedValue(
			new Error("All providers failed"),
		);

		await handleMessage(baseEnv, "8637801816", "hello");

		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("Something went wrong"),
		);
	});
});

describe("LLM plan response", () => {
	it("saves the plan and sends it to the user", async () => {
		const plan =
			"**Feature: Dark mode**\n\nSteps:\n1. Add toggle\n\nEffort: S\nBranch: feat/dark-mode";
		vi.mocked(assistant.askAssistant).mockResolvedValue({
			type: "plan",
			message: "Here's my plan:",
			plan,
			branch: "feat/dark-mode",
		});

		await handleMessage(baseEnv, "8637801816", "add dark mode");

		expect(repo.updatePlan).toHaveBeenCalledWith(
			mockDb,
			expect.any(String),
			plan,
		);
		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			"Here's my plan:",
		);
	});
});

describe("LLM build response", () => {
	it("triggers implementation when LLM approves build", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(
			makeConversation({
				plan: "**Feature: Dark mode**\nBranch: feat/dark-mode",
			}) as never,
		);
		vi.mocked(assistant.askAssistant).mockResolvedValue({
			type: "build",
			message: "Starting implementation! 🚀",
		});

		await handleMessage(baseEnv, "8637801816", "yes");

		expect(repo.updateState).toHaveBeenCalledWith(
			mockDb,
			"conv-1",
			"implementing",
			expect.objectContaining({ branchName: "feat/test-feature" }),
		);
		expect(github.triggerImplementation).toHaveBeenCalled();
	});

	it("falls back to chat when build triggered but no plan exists", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(
			makeConversation({ plan: null }) as never,
		);
		vi.mocked(assistant.askAssistant).mockResolvedValue({
			type: "build",
			message: "Building!",
		});

		await handleMessage(baseEnv, "8637801816", "yes");

		expect(github.triggerImplementation).not.toHaveBeenCalled();
		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("don't have a plan"),
		);
	});

	it("resets to done and sends error when triggerImplementation fails", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(
			makeConversation({ plan: "**Feature: X**\nBranch: feat/x" }) as never,
		);
		vi.mocked(assistant.askAssistant).mockResolvedValue({
			type: "build",
			message: "Starting!",
		});
		vi.mocked(github.triggerImplementation).mockRejectedValueOnce(
			new Error("GitHub Actions unavailable"),
		);

		await handleMessage(baseEnv, "8637801816", "yes");

		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("Failed to start implementation"),
		);
	});
});

describe("LLM ship response", () => {
	it("merges PR when LLM outputs ship type", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(
			makeConversation({ state: "awaiting_ship", prNumber: 42 }) as never,
		);
		vi.mocked(assistant.askAssistant).mockResolvedValue({
			type: "ship",
			message: "Merging now! 🚢",
		});

		await handleMessage(baseEnv, "8637801816", "let's go ahead and merge");

		expect(github.mergePr).toHaveBeenCalledWith("gh-token", 42);
		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
	});
});

describe("LLM cancel response", () => {
	it("marks done and closes PR when LLM outputs cancel type", async () => {
		vi.mocked(repo.findActive).mockResolvedValue(
			makeConversation({ state: "awaiting_ship", prNumber: 7 }) as never,
		);
		vi.mocked(assistant.askAssistant).mockResolvedValue({
			type: "cancel",
			message: "Alright, cancelling the PR.",
		});

		await handleMessage(baseEnv, "8637801816", "nevermind, close it");

		expect(github.closePr).toHaveBeenCalledWith("gh-token", 7);
		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
	});
});

// ── Notify webhooks ───────────────────────────────────────────────────────────

describe("handlePrCreated", () => {
	it("updates state to awaiting_ship and notifies user", async () => {
		vi.mocked(repo.findById).mockResolvedValue(makeConversation() as never);

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
	});
});

describe("handleImplementationFailed", () => {
	it("updates state to done and notifies user with run URL", async () => {
		vi.mocked(repo.findById).mockResolvedValue(makeConversation() as never);

		await handleImplementationFailed(
			baseEnv,
			"conv-1",
			"https://github.com/ricardowgomes/apps/actions/runs/99",
		);

		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("Implementation failed"),
		);
	});

	it("does nothing if conversation not found", async () => {
		vi.mocked(repo.findById).mockResolvedValue(null);

		await handleImplementationFailed(baseEnv, "missing-id", "https://url");

		expect(repo.updateState).not.toHaveBeenCalled();
	});
});

describe("handleDeployNotification", () => {
	it("sends success message to all allowed chat IDs", async () => {
		const env = { ...baseEnv, ALLOWED_TELEGRAM_CHAT_IDS: "111,222" };

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
	});

	it("sends failure message", async () => {
		await handleDeployNotification(baseEnv, "failure", "https://url", "msg");

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

// ── Cron: stuck conversation detector ────────────────────────────────────────

describe("checkStuckConversations", () => {
	it("cancels stuck implementing conversations and notifies user", async () => {
		vi.mocked(repo.findStuck).mockResolvedValue([
			makeConversation({ state: "implementing" }) as never,
		]);

		await checkStuckConversations(baseEnv);

		expect(repo.updateState).toHaveBeenCalledWith(mockDb, "conv-1", "done");
		expect(telegram.sendMessage).toHaveBeenCalledWith(
			"bot-token",
			"8637801816",
			expect.stringContaining("timed out"),
		);
	});

	it("does nothing when no stuck conversations", async () => {
		vi.mocked(repo.findStuck).mockResolvedValue([]);

		await checkStuckConversations(baseEnv);

		expect(repo.updateState).not.toHaveBeenCalled();
		expect(telegram.sendMessage).not.toHaveBeenCalled();
	});
});
