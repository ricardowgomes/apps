import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { useMemo } from "react";
import type { Transaction } from "../domain/transaction";

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
		minimumFractionDigits: 2,
	}).format(amount);
}

function formatMonthLabel(yearMonth: string): string {
	return new Date(`${yearMonth}-01T12:00:00`).toLocaleDateString("en-CA", {
		month: "long",
		year: "numeric",
	});
}

interface SummaryCardsProps {
	transactions: Transaction[];
	selectedMonth: string;
}

export function SummaryCards({
	transactions,
	selectedMonth,
}: SummaryCardsProps) {
	const { income, expenses, balance } = useMemo(() => {
		const income = transactions
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);
		const expenses = transactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);
		return { income, expenses, balance: income - expenses };
	}, [transactions]);

	const isPositive = balance >= 0;
	const monthLabel = formatMonthLabel(selectedMonth);

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{/* Balance */}
			<div
				data-testid="balance-card"
				className="sm:col-span-1 flex flex-col gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
			>
				<div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest font-medium">
					<Wallet size={13} />
					Balance
				</div>
				<p
					className={`text-2xl font-bold mt-1 ${isPositive ? "text-white" : "text-rose-400"}`}
				>
					{formatCurrency(balance)}
				</p>
				<p className="text-xs text-gray-600">{monthLabel}</p>
			</div>

			{/* Income */}
			<div
				data-testid="income-card"
				className="flex flex-col gap-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5"
			>
				<div className="flex items-center gap-2 text-xs text-emerald-500/80 uppercase tracking-widest font-medium">
					<ArrowUpRight size={13} />
					Income
				</div>
				<p className="text-2xl font-bold mt-1 text-emerald-400">
					{formatCurrency(income)}
				</p>
				<p className="text-xs text-gray-600">{monthLabel}</p>
			</div>

			{/* Expenses */}
			<div
				data-testid="expenses-card"
				className="flex flex-col gap-1 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5"
			>
				<div className="flex items-center gap-2 text-xs text-rose-500/80 uppercase tracking-widest font-medium">
					<ArrowDownLeft size={13} />
					Expenses
				</div>
				<p className="text-2xl font-bold mt-1 text-rose-400">
					{formatCurrency(expenses)}
				</p>
				<p className="text-xs text-gray-600">{monthLabel}</p>
			</div>
		</div>
	);
}

export { formatCurrency };
