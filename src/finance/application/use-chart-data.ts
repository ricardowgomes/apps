import { useMemo } from "react";
import type { Transaction } from "../domain/transaction";

export interface CategorySlice {
	category: string;
	amount: number;
}

export interface MonthlyDataPoint {
	month: string; // "YYYY-MM"
	label: string; // "Jan", "Feb", …
	income: number;
	expenses: number;
}

/**
 * Pure computation: aggregates expenses by category, sorted by amount desc.
 * Exported for unit testing.
 */
export function computeCategoryBreakdown(
	transactions: Transaction[],
): CategorySlice[] {
	const map = new Map<string, number>();
	for (const t of transactions) {
		if (t.type === "expense") {
			map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
		}
	}
	return Array.from(map.entries())
		.map(([category, amount]) => ({ category, amount }))
		.sort((a, b) => b.amount - a.amount);
}

/**
 * Pure computation: builds income vs. expenses for the last 6 calendar months.
 * Accepts `now` as a parameter so tests can inject a fixed date.
 * Exported for unit testing.
 */
export function computeMonthlyTrend(
	allTransactions: Transaction[],
	now: Date = new Date(),
): MonthlyDataPoint[] {
	const points: MonthlyDataPoint[] = [];

	for (let i = 5; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		const label = d.toLocaleDateString("en-CA", { month: "short" });

		const monthTxs = allTransactions.filter((t) => t.date.startsWith(month));
		const income = monthTxs
			.filter((t) => t.type === "income")
			.reduce((s, t) => s + t.amount, 0);
		const expenses = monthTxs
			.filter((t) => t.type === "expense")
			.reduce((s, t) => s + t.amount, 0);

		points.push({ month, label, income, expenses });
	}

	return points;
}

/** React hook wrapper for category breakdown — memoises on transactions reference. */
export function useCategoryBreakdown(
	transactions: Transaction[],
): CategorySlice[] {
	return useMemo(() => computeCategoryBreakdown(transactions), [transactions]);
}

/** React hook wrapper for monthly trend — memoises on allTransactions reference. */
export function useMonthlyTrend(
	allTransactions: Transaction[],
): MonthlyDataPoint[] {
	return useMemo(() => computeMonthlyTrend(allTransactions), [allTransactions]);
}
