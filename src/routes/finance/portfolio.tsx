import { createFileRoute, redirect } from "@tanstack/react-router";
import { getPortfolioEntriesFn } from "@/finance/application/portfolio-server-fns";
import { PortfolioPage } from "@/finance/ui/PortfolioPage";

export const Route = createFileRoute("/finance/portfolio")({
	beforeLoad: ({ context }) => {
		if (!context.user) throw redirect({ to: "/login" });
	},
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData({
			queryKey: ["portfolio"],
			queryFn: () => getPortfolioEntriesFn(),
		}),
	component: PortfolioPage,
});
