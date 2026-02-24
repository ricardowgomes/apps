import { createFileRoute } from "@tanstack/react-router";
import { getTransactionsFn } from "@/finance/application/transaction-server-fns";
import { FinancePage } from "@/finance/ui/FinancePage";

export const Route = createFileRoute("/finance/")({
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData({
			queryKey: ["transactions"],
			queryFn: () => getTransactionsFn(),
		});
	},
	component: FinancePage,
});
