import { useStore } from "@tanstack/react-store";
import { Plus, Upload } from "lucide-react";
import { useMemo } from "react";
import {
	closeImportSheet,
	closeTransactionSheet,
	computeDateBounds,
	financeUiStore,
	getDateRangeLabel,
	openAddTransaction,
	openEditTransaction,
	openImportSheet,
} from "../application/finance-ui-store";
import { useTransactions } from "../application/use-transactions";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { CategoryBreakdownChart } from "./CategoryBreakdownChart";
import { ImportTransactionsSheet } from "./ImportTransactionsSheet";
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
	const importSheetOpen = useStore(financeUiStore, (s) => s.importSheetOpen);
	const dateRange = useStore(financeUiStore, (s) => s.dateRange);

	const sheetOpen = addTransactionOpen || editingTransaction !== null;

	// Filter transactions to those within the selected date range
	const { from, to } = computeDateBounds(dateRange);
	const rangeTransactions = useMemo(
		() => allTransactions.filter((t) => t.date >= from && t.date <= to),
		[allTransactions, from, to],
	);

	const rangeLabel = getDateRangeLabel(dateRange);

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
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={openImportSheet}
								data-testid="open-import"
								className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.10] text-gray-400 hover:text-white hover:border-white/20 text-sm font-semibold transition-all duration-200"
							>
								<Upload size={15} />
								Import
							</button>
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
					</div>

					{/* Summary — scoped to the selected date range */}
					<SummaryCards
						transactions={rangeTransactions}
						rangeLabel={rangeLabel}
					/>

					{/* Charts — category breakdown (range-scoped) + 6-month trend (all-time) */}
					<CategoryBreakdownChart transactions={rangeTransactions} />
					<MonthlyTrendChart allTransactions={allTransactions} />

					{/* Transaction list — scoped to the selected date range */}
					<TransactionList
						transactions={rangeTransactions}
						onEdit={openEditTransaction}
						dateRange={dateRange}
					/>
				</div>
			</main>

			{/* Add / edit transaction sheet */}
			<AddTransactionSheet
				open={sheetOpen}
				onClose={closeTransactionSheet}
				initialValues={editingTransaction ?? undefined}
			/>

			{/* CSV import sheet */}
			<ImportTransactionsSheet
				open={importSheetOpen}
				onClose={closeImportSheet}
			/>
		</>
	);
}
