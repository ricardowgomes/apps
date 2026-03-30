import { Store } from "@tanstack/store";
import type { Transaction } from "../domain/transaction";

function currentYearMonth(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}


interface FinanceUiState {
	addTransactionOpen: boolean;
	editingTransaction: Transaction | null;
	selectedMonth: string; // "YYYY-MM"
	sortOrder: "desc" | "asc"; // newest-first or oldest-first
}

export const financeUiStore = new Store<FinanceUiState>({
	addTransactionOpen: false,
	editingTransaction: null,
	selectedMonth: currentYearMonth(),
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

export function setSelectedMonth(month: string): void {
	financeUiStore.setState((s) => ({ ...s, selectedMonth: month }));
}

export function toggleSortOrder(): void {
	financeUiStore.setState((s) => ({
		...s,
		sortOrder: s.sortOrder === "desc" ? "asc" : "desc",
	}));
}
