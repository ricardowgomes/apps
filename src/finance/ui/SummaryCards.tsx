import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { useSummary } from "../application/use-transactions";

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
		minimumFractionDigits: 2,
	}).format(amount);
}

export function SummaryCards() {
	const { income, expenses, balance } = useSummary();
	const isPositive = balance >= 0;

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{/* Balance */}
			<div className="sm:col-span-1 flex flex-col gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
				<div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest font-medium">
					<Wallet size={13} />
					Balance
				</div>
				<p
					className={`text-2xl font-bold mt-1 ${isPositive ? "text-white" : "text-rose-400"}`}
				>
					{formatCurrency(balance)}
				</p>
				<p className="text-xs text-gray-600">All time</p>
			</div>

			{/* Income */}
			<div className="flex flex-col gap-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
				<div className="flex items-center gap-2 text-xs text-emerald-500/80 uppercase tracking-widest font-medium">
					<ArrowUpRight size={13} />
					Income
				</div>
				<p className="text-2xl font-bold mt-1 text-emerald-400">
					{formatCurrency(income)}
				</p>
				<p className="text-xs text-gray-600">All time</p>
			</div>

			{/* Expenses */}
			<div className="flex flex-col gap-1 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
				<div className="flex items-center gap-2 text-xs text-rose-500/80 uppercase tracking-widest font-medium">
					<ArrowDownLeft size={13} />
					Expenses
				</div>
				<p className="text-2xl font-bold mt-1 text-rose-400">
					{formatCurrency(expenses)}
				</p>
				<p className="text-xs text-gray-600">All time</p>
			</div>
		</div>
	);
}

export { formatCurrency };
