import { ArrowDownLeft, ArrowUpRight, Inbox } from "lucide-react";
import type { Transaction } from "../domain/transaction";
import { formatCurrency } from "./SummaryCards";

function getDateLabel(dateStr: string): string {
	const today = new Date().toISOString().split("T")[0];
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStr = yesterday.toISOString().split("T")[0];

	if (dateStr === today) return "Today";
	if (dateStr === yesterdayStr) return "Yesterday";

	return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-CA", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});
}

function groupByDate(
	transactions: Transaction[],
): Array<{ label: string; items: Transaction[] }> {
	const map = new Map<string, Transaction[]>();
	for (const t of transactions) {
		const label = getDateLabel(t.date);
		const existing = map.get(label);
		if (existing) {
			existing.push(t);
		} else {
			map.set(label, [t]);
		}
	}
	return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
	const isIncome = transaction.type === "income";

	return (
		<div className="flex items-center gap-4 py-3.5 px-4 rounded-xl hover:bg-white/[0.03] transition-colors group">
			{/* Icon */}
			<div
				className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border ${
					isIncome
						? "bg-emerald-500/10 border-emerald-500/20"
						: "bg-rose-500/10 border-rose-500/20"
				}`}
			>
				{isIncome ? (
					<ArrowUpRight size={16} className="text-emerald-400" />
				) : (
					<ArrowDownLeft size={16} className="text-rose-400" />
				)}
			</div>

			{/* Details */}
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-white truncate">
					{transaction.description}
				</p>
				<p className="text-xs text-gray-500 mt-0.5">{transaction.category}</p>
			</div>

			{/* Amount */}
			<p
				className={`text-sm font-semibold flex-shrink-0 ${
					isIncome ? "text-emerald-400" : "text-white"
				}`}
			>
				{isIncome ? "+" : "-"}
				{formatCurrency(transaction.amount)}
			</p>
		</div>
	);
}

interface TransactionListProps {
	transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
	if (transactions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<Inbox size={36} className="text-gray-700 mb-3" />
				<p className="text-gray-500 text-sm">No transactions found</p>
				<p className="text-gray-700 text-xs mt-1">
					Try adjusting your filters or add a new transaction
				</p>
			</div>
		);
	}

	const groups = groupByDate(transactions);

	return (
		<div className="flex flex-col gap-6">
			{groups.map(({ label, items }) => (
				<div key={label}>
					<p className="text-xs text-gray-600 uppercase tracking-widest font-medium px-4 mb-1">
						{label}
					</p>
					<div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
						{items.map((t) => (
							<TransactionRow key={t.id} transaction={t} />
						))}
					</div>
				</div>
			))}
		</div>
	);
}
