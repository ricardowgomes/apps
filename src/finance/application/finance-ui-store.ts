import { Store } from "@tanstack/store";
import type { Transaction } from "../domain/transaction";

export type DateRangePreset = "7d" | "30d" | "90d" | "6m" | "12m";

export type DateRange =
	| { type: "preset"; preset: DateRangePreset }
	| { type: "month"; month: string } // "YYYY-MM"
	| { type: "custom"; from: string; to: string }; // "YYYY-MM-DD"

interface FinanceUiState {
	addTransactionOpen: boolean;
	editingTransaction: Transaction | null;
	dateRange: DateRange;
	sortOrder: "desc" | "asc"; // newest-first or oldest-first
}

export const financeUiStore = new Store<FinanceUiState>({
	addTransactionOpen: false,
	editingTransaction: null,
	dateRange: { type: "preset", preset: "30d" },
	sortOrder: "desc",
});

export function openAddTransaction(): void {
	financeUiStore.setState((s) => ({
		...s,
		addTransactionOpen: true,
		editingTransaction: null,
	}));
}

export function closeAddTransaction(): void {
	financeUiStore.setState((s) => ({ ...s, addTransactionOpen: false }));
}

export function openEditTransaction(transaction: Transaction): void {
	financeUiStore.setState((s) => ({
		...s,
		editingTransaction: transaction,
		addTransactionOpen: false,
	}));
}

export function closeTransactionSheet(): void {
	financeUiStore.setState((s) => ({
		...s,
		addTransactionOpen: false,
		editingTransaction: null,
	}));
}

export function setDateRange(range: DateRange): void {
	financeUiStore.setState((s) => ({ ...s, dateRange: range }));
}

export function toggleSortOrder(): void {
	financeUiStore.setState((s) => ({
		...s,
		sortOrder: s.sortOrder === "desc" ? "asc" : "desc",
	}));
}

// Compute the actual ISO date bounds (YYYY-MM-DD) for any DateRange value.
export function computeDateBounds(range: DateRange): {
	from: string;
	to: string;
} {
	if (range.type === "preset") {
		const now = new Date();
		const to = now.toISOString().slice(0, 10);
		const from = new Date(now);
		switch (range.preset) {
			case "7d":
				from.setDate(now.getDate() - 6);
				break;
			case "30d":
				from.setDate(now.getDate() - 29);
				break;
			case "90d":
				from.setDate(now.getDate() - 89);
				break;
			case "6m":
				from.setMonth(now.getMonth() - 6);
				break;
			case "12m":
				from.setMonth(now.getMonth() - 12);
				break;
		}
		return { from: from.toISOString().slice(0, 10), to };
	}

	if (range.type === "month") {
		const [y, m] = range.month.split("-").map(Number);
		const lastDay = new Date(y, m, 0).getDate();
		return {
			from: `${range.month}-01`,
			to: `${range.month}-${String(lastDay).padStart(2, "0")}`,
		};
	}

	return { from: range.from, to: range.to };
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
	"7d": "Last 7 days",
	"30d": "Last 30 days",
	"90d": "Last 3 months",
	"6m": "Last 6 months",
	"12m": "Last 12 months",
};

export function getDateRangeLabel(range: DateRange): string {
	if (range.type === "preset") return PRESET_LABELS[range.preset];

	if (range.type === "month") {
		return new Date(`${range.month}-01T12:00:00`).toLocaleDateString("en-CA", {
			month: "long",
			year: "numeric",
		});
	}

	// Custom range: "Jan 1 – Mar 30"
	const fmt = (d: string) =>
		new Date(`${d}T12:00:00`).toLocaleDateString("en-CA", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	return `${fmt(range.from)} – ${fmt(range.to)}`;
}
