import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type { CategoryInput } from "../domain/category";
import {
	createCategoryFn,
	deleteCategoryFn,
	getCategoriesFn,
	updateCategoryFn,
} from "./category-server-fns";

const QUERY_KEY = ["categories"] as const;

export function useCategories() {
	return useSuspenseQuery({
		queryKey: QUERY_KEY,
		queryFn: () => getCategoriesFn(),
	});
}

export function useAddCategory() {
	const qc = useQueryClient();
	const { mutateAsync } = useMutation({
		mutationFn: (data: CategoryInput) => createCategoryFn({ data }),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
	return mutateAsync;
}

export function useUpdateCategory() {
	const qc = useQueryClient();
	const { mutateAsync } = useMutation({
		mutationFn: (data: CategoryInput & { id: string }) =>
			updateCategoryFn({ data }),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
	return mutateAsync;
}

export function useRemoveCategory() {
	const qc = useQueryClient();
	const { mutateAsync } = useMutation({
		mutationFn: (id: string) => deleteCategoryFn({ data: { id } }),
		onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
	});
	return mutateAsync;
}
