import { useStore } from "@tanstack/react-store";
import { Plus } from "lucide-react";
import {
	closeAddTransaction,
	financeUiStore,
	openAddTransaction,
} from "../application/finance-ui-store";
import { useTransactions } from "../application/use-transactions";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { SummaryCards } from "./SummaryCards";
import { TransactionList } from "./TransactionList";

export function FinancePage() {
	const transactions = useTransactions();
	const sheetOpen = useStore(financeUiStore, (s) => s.addTransactionOpen);

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
							className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition-all duration-200 shadow-lg shadow-cyan-500/20"
						>
							<Plus size={16} />
							Add
						</button>
					</div>

					{/* Summary */}
					<SummaryCards />

					{/* Transaction list — owns filters internally */}
					<TransactionList transactions={transactions} />
				</div>
			</main>

			{/* Add transaction sheet */}
			<AddTransactionSheet open={sheetOpen} onClose={closeAddTransaction} />
		</>
	);
}
