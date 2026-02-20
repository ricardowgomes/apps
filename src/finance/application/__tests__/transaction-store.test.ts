import { beforeEach, describe, expect, it } from "vitest";
import type { Transaction } from "../../domain/transaction";
import {
	addTransaction,
	removeTransaction,
	transactionStore,
} from "../transaction-store";

const makeTx = (
	id: string,
	overrides: Partial<Transaction> = {},
): Transaction => ({
	id,
	type: "expense",
	amount: 50,
	currency: "CAD",
	category: "Food & Dining",
	description: "Lunch",
	date: "2026-02-01",
	createdAt: new Date().toISOString(),
	...overrides,
});

describe("transactionStore", () => {
	beforeEach(() => {
		// Reset to empty for each test
		transactionStore.setState(() => ({ transactions: [] }));
	});

	it("starts empty after reset", () => {
		expect(transactionStore.state.transactions).toHaveLength(0);
	});

	it("adds a transaction to the front of the list", () => {
		const tx1 = makeTx("tx-1");
		const tx2 = makeTx("tx-2");
		addTransaction(tx1);
		addTransaction(tx2);
		expect(transactionStore.state.transactions[0].id).toBe("tx-2");
		expect(transactionStore.state.transactions[1].id).toBe("tx-1");
	});

	it("removes a transaction by id", () => {
		addTransaction(makeTx("tx-a"));
		addTransaction(makeTx("tx-b"));
		removeTransaction("tx-a");
		const ids = transactionStore.state.transactions.map((t) => t.id);
		expect(ids).not.toContain("tx-a");
		expect(ids).toContain("tx-b");
	});

	it("ignores remove for unknown id", () => {
		addTransaction(makeTx("tx-z"));
		removeTransaction("does-not-exist");
		expect(transactionStore.state.transactions).toHaveLength(1);
	});
});
