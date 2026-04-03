import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCategoriesFn } from "@/finance/application/category-server-fns";
import { CategoriesPage } from "@/finance/ui/CategoriesPage";

export const Route = createFileRoute("/finance/categories")({
	beforeLoad: ({ context }) => {
		if (!context.user) throw redirect({ to: "/login" });
	},
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData({
			queryKey: ["categories"],
			queryFn: () => getCategoriesFn(),
		}),
	component: CategoriesPage,
});
