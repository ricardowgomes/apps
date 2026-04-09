import { describe, expect, it, vi } from "vitest";
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
} from "./d1-conversation-repository";

// ── D1 mock helpers ───────────────────────────────────────────────────────────

function makeDb(firstResult: unknown = null, allResults: unknown[] = []) {
	const run = vi.fn().mockResolvedValue(undefined);
	const first = vi.fn().mockResolvedValue(firstResult);
	const all = vi.fn().mockResolvedValue({ results: allResults });
	const bind = vi.fn().mockReturnValue({ run, first, all });
	const prepare = vi.fn().mockReturnValue({ bind });
	return { prepare, bind, run, first, all } as unknown as D1Database;
}

const baseRow = {
	id: "conv-1",
	phone_number: "8637801816",
	state: "active",
	feature_request: "Add dark mode",
	plan: "**Feature: Dark mode**",
	pr_url: null,
	pr_number: null,
	branch_name: null,
	created_at: "2026-01-01",
	updated_at: "2026-01-01",
};

const baseMessageRow = {
	id: "msg-1",
	conversation_id: "conv-1",
	role: "user",
	content: "Add dark mode",
	created_at: "2026-01-01",
};

// ── findActive ────────────────────────────────────────────────────────────────

describe("findActive", () => {
	it("returns mapped conversation when row found", async () => {
		const db = makeDb(baseRow);
		const result = await findActive(db, "8637801816");

		expect(result).toMatchObject({
			id: "conv-1",
			phoneNumber: "8637801816",
			state: "active",
			featureRequest: "Add dark mode",
		});
	});

	it("returns null when no row found", async () => {
		const db = makeDb(null);
		expect(await findActive(db, "8637801816")).toBeNull();
	});
});

// ── findById ──────────────────────────────────────────────────────────────────

describe("findById", () => {
	it("returns mapped conversation when row found", async () => {
		const db = makeDb(baseRow);
		expect((await findById(db, "conv-1"))?.id).toBe("conv-1");
	});

	it("returns null when not found", async () => {
		const db = makeDb(null);
		expect(await findById(db, "missing")).toBeNull();
	});
});

// ── findStuck ─────────────────────────────────────────────────────────────────

describe("findStuck", () => {
	it("returns conversations stuck in implementing state", async () => {
		const db = makeDb(null, [{ ...baseRow, state: "implementing" }]);
		const result = await findStuck(db, 20);

		expect(result).toHaveLength(1);
		expect(result[0].state).toBe("implementing");
	});

	it("returns empty array when none are stuck", async () => {
		const db = makeDb(null, []);
		const result = await findStuck(db, 20);
		expect(result).toHaveLength(0);
	});
});

// ── create ────────────────────────────────────────────────────────────────────

describe("create", () => {
	it("inserts a new conversation row in active state", async () => {
		const db = makeDb();
		await create(db, {
			id: "conv-new",
			phoneNumber: "8637801816",
			featureRequest: "Add dark mode",
			plan: "**plan**",
		});

		expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT"));
		expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("active"));
	});

	it("handles null plan", async () => {
		const db = makeDb();
		await expect(
			create(db, {
				id: "conv-new",
				phoneNumber: "8637801816",
				featureRequest: "feat",
				plan: null,
			}),
		).resolves.not.toThrow();
	});
});

// ── updatePlan ────────────────────────────────────────────────────────────────

describe("updatePlan", () => {
	it("executes an UPDATE query", async () => {
		const db = makeDb();
		await updatePlan(db, "conv-1", "revised plan");
		expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("UPDATE"));
	});
});

// ── updateState ───────────────────────────────────────────────────────────────

describe("updateState", () => {
	it("updates state without extras", async () => {
		const db = makeDb();
		await updateState(db, "conv-1", "done");
		expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("UPDATE"));
	});

	it("updates state with branchName, prUrl, prNumber", async () => {
		const db = makeDb();
		await updateState(db, "conv-1", "awaiting_ship", {
			branchName: "feat/dark-mode",
			prUrl: "https://github.com/r/a/pull/1",
			prNumber: 1,
		});
		expect(db.prepare).toHaveBeenCalled();
	});
});

// ── saveMessage ───────────────────────────────────────────────────────────────

describe("saveMessage", () => {
	it("inserts a message row", async () => {
		const db = makeDb();
		await saveMessage(db, "conv-1", "user", "hello");
		expect(db.prepare).toHaveBeenCalledWith(
			expect.stringContaining("INSERT INTO telegram_messages"),
		);
	});
});

// ── getMessages ───────────────────────────────────────────────────────────────

describe("getMessages", () => {
	it("returns mapped messages ordered oldest-first", async () => {
		const db = makeDb(null, [baseMessageRow]);
		const result = await getMessages(db, "conv-1", 20);

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			id: "msg-1",
			conversationId: "conv-1",
			role: "user",
			content: "Add dark mode",
		});
	});

	it("returns empty array when no messages", async () => {
		const db = makeDb(null, []);
		expect(await getMessages(db, "conv-1")).toHaveLength(0);
	});
});

// ── getLastUpdateId ───────────────────────────────────────────────────────────

describe("getLastUpdateId", () => {
	it("returns the stored update_id", async () => {
		const db = makeDb({ last_update_id: 42 });
		expect(await getLastUpdateId(db, "chat-1")).toBe(42);
	});

	it("returns 0 when no row exists", async () => {
		const db = makeDb(null);
		expect(await getLastUpdateId(db, "chat-1")).toBe(0);
	});
});

// ── setLastUpdateId ───────────────────────────────────────────────────────────

describe("setLastUpdateId", () => {
	it("upserts the update_id", async () => {
		const db = makeDb();
		await setLastUpdateId(db, "chat-1", 99);
		expect(db.prepare).toHaveBeenCalledWith(
			expect.stringContaining("ON CONFLICT"),
		);
	});
});
