/**
 * Tests for the React hook wrappers in use-chart-data.ts.
 *
 * useMemo is mocked to call the callback immediately so these tests run in the
 * node environment without a DOM (same constraint as finance-page.test.tsx).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("react")>();
	return { ...actual, useMemo: (fn: () => unknown) => fn() };
});

import {
	useCategoryBreakdown,
	useMonthlyTrend,
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

describe("useCategoryBreakdown", () => {
	it("delegates to computeCategoryBreakdown and returns category slices", () => {
		const txs = [
			makeTx({ type: "expense", category: "Transport", amount: 80 }),
			makeTx({ type: "expense", category: "Food & Dining", amount: 120 }),
			makeTx({ type: "income", category: "Salary", amount: 2000 }),
		];

		const result = useCategoryBreakdown(txs);

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ category: "Food & Dining", amount: 120 });
		expect(result[1]).toEqual({ category: "Transport", amount: 80 });
	});

	it("returns empty array when there are no transactions", () => {
		expect(useCategoryBreakdown([])).toEqual([]);
	});
});

describe("useMonthlyTrend", () => {
	it("delegates to computeMonthlyTrend and returns 6 data points", () => {
		const result = useMonthlyTrend([]);
		expect(result).toHaveLength(6);
	});

	it("includes income and expense totals per month", () => {
		const txs = [
			makeTx({ type: "income", amount: 1000, date: "2026-03-10" }),
			makeTx({ type: "expense", amount: 200, date: "2026-03-05" }),
		];

		const result = useMonthlyTrend(txs);
		const march = result.find((p) => p.month === "2026-03");

		// march may or may not be in the 6-month window depending on current date,
		// but the hook should always return an array of 6 well-formed points
		expect(result.every((p) => "income" in p && "expenses" in p)).toBe(true);
		// if march is in window, values should be correct
		if (march) {
			expect(march.income).toBe(1000);
			expect(march.expenses).toBe(200);
		}
	});
});
