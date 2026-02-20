import { createFileRoute } from "@tanstack/react-router";
import { FinancePage } from "@/finance/ui/FinancePage";

export const Route = createFileRoute("/finance/")({
	component: FinancePage,
});
