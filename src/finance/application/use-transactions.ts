import { useStore } from "@tanstack/react-store";
import { useMemo } from "react";
import type {
	Transaction,
	TransactionInput,
	TransactionType,
} from "../domain/transaction";
import { addTransaction, transactionStore } from "./transaction-store";

export interface TransactionFilters {
	search: string;
	type: "all" | TransactionType;
}

export function useTransactions(filters: TransactionFilters) {
	const transactions = useStore(transactionStore, (s) => s.transactions);

	const filtered = useMemo(() => {
		return transactions.filter((t) => {
			if (filters.type !== "all" && t.type !== filters.type) return false;
			if (filters.search) {
				const q = filters.search.toLowerCase();
				return (
					t.description.toLowerCase().includes(q) ||
					t.category.toLowerCase().includes(q)
				);
			}
			return true;
		});
	}, [transactions, filters]);

	const sorted = useMemo(
		() => [...filtered].sort((a, b) => b.date.localeCompare(a.date)),
		[filtered],
	);

	return { transactions: sorted };
}

export function useSummary() {
	const transactions = useStore(transactionStore, (s) => s.transactions);

	return useMemo(() => {
		const income = transactions
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);
		const expenses = transactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);
		return { income, expenses, balance: income - expenses };
	}, [transactions]);
}

export function useAddTransaction() {
	return (input: TransactionInput): Transaction => {
		const transaction: Transaction = {
			...input,
			id: crypto.randomUUID(),
			createdAt: new Date().toISOString(),
		};
		addTransaction(transaction);
		return transaction;
	};
}
