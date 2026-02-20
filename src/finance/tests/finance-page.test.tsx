/**
 * Finance application-layer integration tests.
 *
 * These tests verify the application logic (store + filtering + UI state) that
 * powers the finance page. They run without DOM so they are not affected by
 * the jsdom 27 / Node 20 ESM compatibility issue.
 *
 * TODO: Add React component render tests once the project runs on Node 22+
 * (which supports require()-ing ESM modules natively).
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
	closeAddTransaction,
	financeUiStore,
	openAddTransaction,
} from "../application/finance-ui-store";
import {
	addTransaction,
	transactionStore,
} from "../application/transaction-store";
import type { Transaction } from "../domain/transaction";

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
	return {
		id: crypto.randomUUID(),
		type: "expense",
		amount: 50,
		currency: "CAD",
		category: "Food & Dining",
		description: "Lunch",
		date: "2026-02-15",
		createdAt: new Date().toISOString(),
		...overrides,
	};
}

beforeEach(() => {
	transactionStore.setState(() => ({ transactions: [] }));
	closeAddTransaction();
});

describe("transaction store filtering", () => {
	it("stores and retrieves added transactions", () => {
		const tx = makeTx({ description: "Grocery run", type: "expense" });
		addTransaction(tx);
		expect(transactionStore.state.transactions).toContainEqual(tx);
	});

	it("filters income only", () => {
		addTransaction(makeTx({ type: "income", description: "Salary" }));
		addTransaction(makeTx({ type: "expense", description: "Rent" }));

		const incomeOnly = transactionStore.state.transactions.filter(
			(t) => t.type === "income",
		);
		expect(incomeOnly).toHaveLength(1);
		expect(incomeOnly[0].description).toBe("Salary");
	});

	it("filters expenses only", () => {
		addTransaction(makeTx({ type: "income", description: "Bonus" }));
		addTransaction(makeTx({ type: "expense", description: "Groceries" }));
		addTransaction(makeTx({ type: "expense", description: "Rent" }));

		const expenseOnly = transactionStore.state.transactions.filter(
			(t) => t.type === "expense",
		);
		expect(expenseOnly).toHaveLength(2);
	});

	it("searches by description (case-insensitive)", () => {
		addTransaction(makeTx({ description: "Grocery run" }));
		addTransaction(makeTx({ description: "Transit pass" }));

		const query = "grocery";
		const results = transactionStore.state.transactions.filter((t) =>
			t.description.toLowerCase().includes(query),
		);
		expect(results).toHaveLength(1);
		expect(results[0].description).toBe("Grocery run");
	});

	it("searches by category (case-insensitive)", () => {
		addTransaction(makeTx({ category: "Transport", description: "Bus" }));
		addTransaction(makeTx({ category: "Food & Dining", description: "Sushi" }));

		const results = transactionStore.state.transactions.filter((t) =>
			t.category.toLowerCase().includes("transport"),
		);
		expect(results).toHaveLength(1);
		expect(results[0].description).toBe("Bus");
	});

	it("sorts transactions by date descending", () => {
		addTransaction(makeTx({ date: "2026-02-01" }));
		addTransaction(makeTx({ date: "2026-02-15" }));
		addTransaction(makeTx({ date: "2026-02-10" }));

		const sorted = [...transactionStore.state.transactions].sort((a, b) =>
			b.date.localeCompare(a.date),
		);
		expect(sorted[0].date).toBe("2026-02-15");
		expect(sorted[1].date).toBe("2026-02-10");
		expect(sorted[2].date).toBe("2026-02-01");
	});
});

describe("summary calculations", () => {
	it("sums income correctly", () => {
		addTransaction(makeTx({ type: "income", amount: 1000 }));
		addTransaction(makeTx({ type: "income", amount: 500 }));
		addTransaction(makeTx({ type: "expense", amount: 200 }));

		const income = transactionStore.state.transactions
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);
		expect(income).toBe(1500);
	});

	it("sums expenses correctly", () => {
		addTransaction(makeTx({ type: "income", amount: 1000 }));
		addTransaction(makeTx({ type: "expense", amount: 200 }));
		addTransaction(makeTx({ type: "expense", amount: 75.5 }));

		const expenses = transactionStore.state.transactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);
		expect(expenses).toBeCloseTo(275.5);
	});

	it("computes balance as income minus expenses", () => {
		addTransaction(makeTx({ type: "income", amount: 2000 }));
		addTransaction(makeTx({ type: "expense", amount: 800 }));

		const txs = transactionStore.state.transactions;
		const income = txs
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);
		const expenses = txs
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);
		expect(income - expenses).toBe(1200);
	});
});

describe("finance UI store", () => {
	it("starts with sheet closed", () => {
		expect(financeUiStore.state.addTransactionOpen).toBe(false);
	});

	it("opens the add transaction sheet", () => {
		openAddTransaction();
		expect(financeUiStore.state.addTransactionOpen).toBe(true);
	});

	it("closes the add transaction sheet", () => {
		openAddTransaction();
		closeAddTransaction();
		expect(financeUiStore.state.addTransactionOpen).toBe(false);
	});
});
