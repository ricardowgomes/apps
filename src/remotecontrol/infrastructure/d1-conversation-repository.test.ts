import { describe, expect, it, vi } from "vitest";
import {
	create,
	findActive,
	findById,
	updatePlan,
	updateState,
} from "./d1-conversation-repository";

// ── D1 mock helpers ───────────────────────────────────────────────────────────

function makeDb(firstResult: unknown = null) {
	const run = vi.fn().mockResolvedValue(undefined);
	const first = vi.fn().mockResolvedValue(firstResult);
	const bind = vi.fn().mockReturnValue({ run, first });
	const prepare = vi.fn().mockReturnValue({ bind });
	return { prepare, bind, run, first } as unknown as D1Database;
}

const baseRow = {
	id: "conv-1",
	phone_number: "8637801816",
	state: "awaiting_approval",
	feature_request: "Add dark mode",
	plan: "**Feature: Dark mode**",
	pr_url: null,
	pr_number: null,
	branch_name: null,
	created_at: "2026-01-01",
	updated_at: "2026-01-01",
};

// ── findActive ────────────────────────────────────────────────────────────────

describe("findActive", () => {
	it("returns mapped conversation when row found", async () => {
		const db = makeDb(baseRow);
		const result = await findActive(db, "8637801816");

		expect(result).toMatchObject({
			id: "conv-1",
			phoneNumber: "8637801816",
			state: "awaiting_approval",
			featureRequest: "Add dark mode",
		});
	});

	it("returns null when no row found", async () => {
		const db = makeDb(null);
		const result = await findActive(db, "8637801816");
		expect(result).toBeNull();
	});
});

// ── findById ──────────────────────────────────────────────────────────────────

describe("findById", () => {
	it("returns mapped conversation when row found", async () => {
		const db = makeDb(baseRow);
		const result = await findById(db, "conv-1");
		expect(result?.id).toBe("conv-1");
	});

	it("returns null when not found", async () => {
		const db = makeDb(null);
		expect(await findById(db, "missing")).toBeNull();
	});
});

// ── create ────────────────────────────────────────────────────────────────────

describe("create", () => {
	it("inserts a new conversation row", async () => {
		const db = makeDb();
		await create(db, {
			id: "conv-new",
			phoneNumber: "8637801816",
			featureRequest: "Add dark mode",
			plan: "**plan**",
		});

		expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT"));
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
