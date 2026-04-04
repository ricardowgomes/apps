import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";
import { useMemo } from "react";
import type { PortfolioEntry } from "../domain/portfolio-entry";
import { formatCurrency } from "./SummaryCards";

interface PortfolioSummaryCardsProps {
	entries: PortfolioEntry[];
}

export function PortfolioSummaryCards({ entries }: PortfolioSummaryCardsProps) {
	const { totalInvestments, totalDebt, netWorth } = useMemo(() => {
		const totalInvestments = entries
			.filter((e) => e.type === "investment")
			.reduce((sum, e) => sum + e.total_amount, 0);
		const totalDebt = entries
			.filter((e) => e.type === "debt")
			.reduce((sum, e) => sum + e.total_amount, 0);
		return {
			totalInvestments,
			totalDebt,
			netWorth: totalInvestments - totalDebt,
		};
	}, [entries]);

	const isPositive = netWorth >= 0;

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{/* Net Worth */}
			<div
				data-testid="net-worth-card"
				className="sm:col-span-1 flex flex-col gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
			>
				<div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest font-medium">
					<Scale size={13} />
					Net Worth
				</div>
				<p
					className={`text-2xl font-bold mt-1 ${isPositive ? "text-white" : "text-rose-400"}`}
				>
					{formatCurrency(netWorth)}
				</p>
				<p className="text-xs text-gray-600">Investments minus debt</p>
			</div>

			{/* Investments */}
			<div
				data-testid="total-investments-card"
				className="flex flex-col gap-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5"
			>
				<div className="flex items-center gap-2 text-xs text-emerald-500/80 uppercase tracking-widest font-medium">
					<ArrowUpRight size={13} />
					Investments
				</div>
				<p className="text-2xl font-bold mt-1 text-emerald-400">
					{formatCurrency(totalInvestments)}
				</p>
				<p className="text-xs text-gray-600">Total across all accounts</p>
			</div>

			{/* Debt */}
			<div
				data-testid="total-debt-card"
				className="flex flex-col gap-1 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5"
			>
				<div className="flex items-center gap-2 text-xs text-rose-500/80 uppercase tracking-widest font-medium">
					<ArrowDownRight size={13} />
					Debt
				</div>
				<p className="text-2xl font-bold mt-1 text-rose-400">
					{formatCurrency(totalDebt)}
				</p>
				<p className="text-xs text-gray-600">Total outstanding</p>
			</div>
		</div>
	);
}
