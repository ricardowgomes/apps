import { Store } from "@tanstack/store";

interface FinanceUiState {
	addTransactionOpen: boolean;
}

export const financeUiStore = new Store<FinanceUiState>({
	addTransactionOpen: false,
});

export function openAddTransaction(): void {
	financeUiStore.setState((s) => ({ ...s, addTransactionOpen: true }));
}

export function closeAddTransaction(): void {
	financeUiStore.setState((s) => ({ ...s, addTransactionOpen: false }));
}
