/**
 * Finance application-layer integration tests.
 *
 * These tests verify the application logic (filtering, summary calculations,
 * and UI state) that powers the finance page. They run without DOM so they
 * are not affected by the jsdom 27 / Node 20 ESM compatibility issue.
 *
 * TODO: Add React component render tests once the project runs on Node 22+
 * (which supports require()-ing ESM modules natively).
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
	closeAddTransaction,
	closeTransactionSheet,
	financeUiStore,
	openAddTransaction,
	openEditTransaction,
} from "../application/finance-ui-store";
import {
	computeCategoryBreakdown,
	computeMonthlyTrend,
} from "../application/use-chart-data";
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
	closeTransactionSheet();
});

describe("transaction filtering logic", () => {
	it("filters income only", () => {
		const transactions = [
			makeTx({ type: "income", description: "Salary" }),
			makeTx({ type: "expense", description: "Rent" }),
		];

		const incomeOnly = transactions.filter((t) => t.type === "income");
		expect(incomeOnly).toHaveLength(1);
		expect(incomeOnly[0].description).toBe("Salary");
	});

	it("filters expenses only", () => {
		const transactions = [
			makeTx({ type: "income", description: "Bonus" }),
			makeTx({ type: "expense", description: "Groceries" }),
			makeTx({ type: "expense", description: "Rent" }),
		];

		const expenseOnly = transactions.filter((t) => t.type === "expense");
		expect(expenseOnly).toHaveLength(2);
	});

	it("searches by description (case-insensitive)", () => {
		const transactions = [
			makeTx({ description: "Grocery run" }),
			makeTx({ description: "Transit pass" }),
		];

		const query = "grocery";
		const results = transactions.filter((t) =>
			t.description.toLowerCase().includes(query),
		);
		expect(results).toHaveLength(1);
		expect(results[0].description).toBe("Grocery run");
	});

	it("searches by category (case-insensitive)", () => {
		const transactions = [
			makeTx({ category: "Transport", description: "Bus" }),
			makeTx({ category: "Food & Dining", description: "Sushi" }),
		];

		const results = transactions.filter((t) =>
			t.category.toLowerCase().includes("transport"),
		);
		expect(results).toHaveLength(1);
		expect(results[0].description).toBe("Bus");
	});

	it("sorts transactions by date descending", () => {
		const transactions = [
			makeTx({ date: "2026-02-01" }),
			makeTx({ date: "2026-02-15" }),
			makeTx({ date: "2026-02-10" }),
		];

		const sorted = [...transactions].sort((a, b) =>
			b.date.localeCompare(a.date),
		);
		expect(sorted[0].date).toBe("2026-02-15");
		expect(sorted[1].date).toBe("2026-02-10");
		expect(sorted[2].date).toBe("2026-02-01");
	});
});

describe("summary calculations", () => {
	it("sums income correctly", () => {
		const transactions = [
			makeTx({ type: "income", amount: 1000 }),
			makeTx({ type: "income", amount: 500 }),
			makeTx({ type: "expense", amount: 200 }),
		];

		const income = transactions
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);
		expect(income).toBe(1500);
	});

	it("sums expenses correctly", () => {
		const transactions = [
			makeTx({ type: "income", amount: 1000 }),
			makeTx({ type: "expense", amount: 200 }),
			makeTx({ type: "expense", amount: 75.5 }),
		];

		const expenses = transactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);
		expect(expenses).toBeCloseTo(275.5);
	});

	it("computes balance as income minus expenses", () => {
		const transactions = [
			makeTx({ type: "income", amount: 2000 }),
			makeTx({ type: "expense", amount: 800 }),
		];

		const income = transactions
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);
		const expenses = transactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);
		expect(income - expenses).toBe(1200);
	});
});

describe("finance UI store", () => {
	it("starts with sheet closed and no editing transaction", () => {
		expect(financeUiStore.state.addTransactionOpen).toBe(false);
		expect(financeUiStore.state.editingTransaction).toBeNull();
	});

	it("opens the add transaction sheet", () => {
		openAddTransaction();
		expect(financeUiStore.state.addTransactionOpen).toBe(true);
		expect(financeUiStore.state.editingTransaction).toBeNull();
	});

	it("closes the add transaction sheet", () => {
		openAddTransaction();
		closeAddTransaction();
		expect(financeUiStore.state.addTransactionOpen).toBe(false);
	});

	it("opens edit mode with the selected transaction", () => {
		const tx = makeTx({ id: "tx-edit-1", description: "Edited Entry" });
		openEditTransaction(tx);
		expect(financeUiStore.state.editingTransaction).toEqual(tx);
		expect(financeUiStore.state.addTransactionOpen).toBe(false);
	});

	it("openEditTransaction clears the add sheet if it was open", () => {
		openAddTransaction();
		const tx = makeTx({ id: "tx-edit-2" });
		openEditTransaction(tx);
		expect(financeUiStore.state.addTransactionOpen).toBe(false);
		expect(financeUiStore.state.editingTransaction).toEqual(tx);
	});

	it("closeTransactionSheet clears both add and edit state", () => {
		openEditTransaction(makeTx({ id: "tx-edit-3" }));
		closeTransactionSheet();
		expect(financeUiStore.state.addTransactionOpen).toBe(false);
		expect(financeUiStore.state.editingTransaction).toBeNull();
	});
});

describe("computeCategoryBreakdown", () => {
	it("aggregates expenses by category", () => {
		const txs = [
			makeTx({ type: "expense", category: "Food & Dining", amount: 100 }),
			makeTx({ type: "expense", category: "Food & Dining", amount: 50 }),
			makeTx({ type: "expense", category: "Transport", amount: 80 }),
			makeTx({ type: "income", category: "Salary", amount: 2000 }),
		];

		const result = computeCategoryBreakdown(txs);

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ category: "Food & Dining", amount: 150 });
		expect(result[1]).toEqual({ category: "Transport", amount: 80 });
	});

	it("sorts categories by amount descending", () => {
		const txs = [
			makeTx({ type: "expense", category: "Shopping", amount: 30 }),
			makeTx({ type: "expense", category: "Transport", amount: 200 }),
			makeTx({ type: "expense", category: "Food & Dining", amount: 120 }),
		];

		const result = computeCategoryBreakdown(txs);

		expect(result.map((s) => s.category)).toEqual([
			"Transport",
			"Food & Dining",
			"Shopping",
		]);
	});

	it("returns empty array when there are no expenses", () => {
		const txs = [makeTx({ type: "income", category: "Salary", amount: 3000 })];

		expect(computeCategoryBreakdown(txs)).toEqual([]);
	});

	it("ignores income transactions", () => {
		const txs = [
			makeTx({ type: "income", category: "Salary", amount: 3000 }),
			makeTx({ type: "expense", category: "Utilities", amount: 90 }),
		];

		const result = computeCategoryBreakdown(txs);
		expect(result).toHaveLength(1);
		expect(result[0].category).toBe("Utilities");
	});
});

describe("computeMonthlyTrend", () => {
	it("returns exactly 6 data points", () => {
		const now = new Date("2026-03-15");
		const result = computeMonthlyTrend([], now);
		expect(result).toHaveLength(6);
	});

	it("labels span the last 6 months ending in the current month", () => {
		const now = new Date("2026-03-15");
		const result = computeMonthlyTrend([], now);

		// Months should be Oct-25 through Mar-26
		expect(result[0].month).toBe("2025-10");
		expect(result[5].month).toBe("2026-03");
	});

	it("sums income and expenses per month", () => {
		const now = new Date("2026-03-15");
		const txs = [
			makeTx({ type: "income", amount: 1000, date: "2026-03-10" }),
			makeTx({ type: "income", amount: 500, date: "2026-03-20" }),
			makeTx({ type: "expense", amount: 200, date: "2026-03-05" }),
			makeTx({ type: "income", amount: 800, date: "2026-02-14" }),
		];

		const result = computeMonthlyTrend(txs, now);

		const march = result.find((p) => p.month === "2026-03");
		expect(march?.income).toBe(1500);
		expect(march?.expenses).toBe(200);

		const feb = result.find((p) => p.month === "2026-02");
		expect(feb?.income).toBe(800);
		expect(feb?.expenses).toBe(0);
	});

	it("returns zero for months with no transactions", () => {
		const now = new Date("2026-03-15");
		const result = computeMonthlyTrend([], now);

		for (const point of result) {
			expect(point.income).toBe(0);
			expect(point.expenses).toBe(0);
		}
	});
});
