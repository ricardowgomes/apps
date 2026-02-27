import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useMemo } from "react";
import type { Transaction, TransactionInput } from "../domain/transaction";
import {
	createTransactionFn,
	deleteTransactionFn,
	getTransactionsFn,
	updateTransactionFn,
} from "./transaction-server-fns";

export interface TransactionFilters {
	search: string;
	type: "all" | "income" | "expense";
}

const TRANSACTIONS_KEY = ["transactions"] as const;

export function useTransactions() {
	const { data } = useSuspenseQuery<Transaction[]>({
		queryKey: TRANSACTIONS_KEY,
		queryFn: () => getTransactionsFn(),
	});
	return data;
}

export function useSummary() {
	const transactions = useTransactions();

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
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (input: TransactionInput) =>
			createTransactionFn({ data: input }),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
	});
	return (input: TransactionInput) => mutation.mutateAsync(input);
}

export function useUpdateTransaction() {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (input: TransactionInput & { id: string }) =>
			updateTransactionFn({ data: input }),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
	});
	return (input: TransactionInput & { id: string }) =>
		mutation.mutateAsync(input);
}

export function useRemoveTransaction() {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (id: string) => deleteTransactionFn({ data: { id } }),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
	});
	return (id: string) => mutation.mutateAsync(id);
}
