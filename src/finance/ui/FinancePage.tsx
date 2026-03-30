import { useStore } from "@tanstack/react-store";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import {
	closeTransactionSheet,
	financeUiStore,
	openAddTransaction,
	openEditTransaction,
	setSelectedMonth,
} from "../application/finance-ui-store";
import { useTransactions } from "../application/use-transactions";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { CategoryBreakdownChart } from "./CategoryBreakdownChart";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { SummaryCards } from "./SummaryCards";
import { TransactionList } from "./TransactionList";

export function FinancePage() {
	const allTransactions = useTransactions();
	const addTransactionOpen = useStore(
		financeUiStore,
		(s) => s.addTransactionOpen,
	);
	const editingTransaction = useStore(
		financeUiStore,
		(s) => s.editingTransaction,
	);
	const selectedMonth = useStore(financeUiStore, (s) => s.selectedMonth);

	const sheetOpen = addTransactionOpen || editingTransaction !== null;

	// Filter to only transactions in the selected month for both list and summary cards
	const monthTransactions = useMemo(
		() => allTransactions.filter((t) => t.date.startsWith(selectedMonth)),
		[allTransactions, selectedMonth],
	);

	return (
		<>
			<main className="min-h-screen text-white">
				{/* Ambient glow */}
				<div
					className="fixed inset-0 overflow-hidden pointer-events-none"
					aria-hidden="true"
				>
					<div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[130px]" />
					<div className="absolute top-[50%] right-[5%] w-[350px] h-[350px] bg-cyan-600/[0.04] rounded-full blur-[130px]" />
					<div className="absolute bottom-[10%] left-[40%] w-[400px] h-[400px] bg-violet-500/[0.035] rounded-full blur-[130px]" />
				</div>

				<div className="relative max-w-2xl mx-auto px-4 pt-24 pb-32 space-y-6">
					{/* Page header */}
					<div className="flex items-end justify-between">
						<div>
							<p className="text-xs text-gray-600 uppercase tracking-widest font-medium mb-1">
								Finance
							</p>
							<h1 className="text-3xl font-bold text-white">Transactions</h1>
						</div>
						<button
							type="button"
							onClick={openAddTransaction}
							data-testid="open-add-transaction"
							className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition-all duration-200 shadow-lg shadow-cyan-500/20"
						>
							<Plus size={16} />
							Add
						</button>
					</div>

					{/* Summary — scoped to the selected month */}
					<SummaryCards
						transactions={monthTransactions}
						selectedMonth={selectedMonth}
					/>

					{/* Charts — category breakdown (month-scoped) + 6-month trend (all-time) */}
					<CategoryBreakdownChart transactions={monthTransactions} />
					<MonthlyTrendChart allTransactions={allTransactions} />

					{/* Transaction list — scoped to the selected month */}
					<TransactionList
						transactions={monthTransactions}
						onEdit={openEditTransaction}
						selectedMonth={selectedMonth}
						onMonthChange={setSelectedMonth}
					/>
				</div>
			</main>

			{/* Add / edit transaction sheet */}
			<AddTransactionSheet
				open={sheetOpen}
				onClose={closeTransactionSheet}
				initialValues={editingTransaction ?? undefined}
			/>
		</>
	);
}
