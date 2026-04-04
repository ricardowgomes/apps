import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type {
	PortfolioEntry,
	PortfolioEntryInput,
} from "../domain/portfolio-entry";
import {
	createPortfolioEntryFn,
	deletePortfolioEntryFn,
	getPortfolioEntriesFn,
	updatePortfolioEntryFn,
} from "./portfolio-server-fns";

const PORTFOLIO_KEY = ["portfolio"] as const;

export function usePortfolioEntries() {
	const { data } = useSuspenseQuery<PortfolioEntry[]>({
		queryKey: PORTFOLIO_KEY,
		queryFn: () => getPortfolioEntriesFn(),
	});
	return data;
}

export function useAddPortfolioEntry() {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (input: PortfolioEntryInput) =>
			createPortfolioEntryFn({ data: input }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEY }),
	});
	return (input: PortfolioEntryInput) => mutation.mutateAsync(input);
}

export function useUpdatePortfolioEntry() {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (input: PortfolioEntryInput & { id: string }) =>
			updatePortfolioEntryFn({ data: input }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEY }),
	});
	return (input: PortfolioEntryInput & { id: string }) =>
		mutation.mutateAsync(input);
}

export function useRemovePortfolioEntry() {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (id: string) => deletePortfolioEntryFn({ data: { id } }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEY }),
	});
	return (id: string) => mutation.mutateAsync(id);
}
