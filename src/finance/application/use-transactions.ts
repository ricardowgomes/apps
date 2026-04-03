import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type { Transaction, TransactionInput } from "../domain/transaction";
import {
	bulkImportTransactionsFn,
	createTransactionFn,
	deleteTransactionFn,
	getTransactionsFn,
	updateCategoryByDescriptionFn,
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

export function useUpdateCategoryByDescription() {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (input: { description: string; category: string }) =>
			updateCategoryByDescriptionFn({ data: input }),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
	});
	return (input: { description: string; category: string }) =>
		mutation.mutateAsync(input);
}

export function useImportTransactions() {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (transactions: Transaction[]) =>
			bulkImportTransactionsFn({ data: { transactions } }),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
	});
	return mutation;
}
