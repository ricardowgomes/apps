import { Store } from "@tanstack/store";
import type { Transaction } from "../domain/transaction";

interface FinanceUiState {
	addTransactionOpen: boolean;
	editingTransaction: Transaction | null;
}

export const financeUiStore = new Store<FinanceUiState>({
	addTransactionOpen: false,
	editingTransaction: null,
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
