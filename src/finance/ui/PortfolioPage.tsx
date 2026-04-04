import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	usePortfolioEntries,
	useRemovePortfolioEntry,
} from "../application/use-portfolio";
import type { PortfolioEntry } from "../domain/portfolio-entry";
import { PortfolioEntrySheet } from "./PortfolioEntrySheet";
import { PortfolioSummaryCards } from "./PortfolioSummaryCards";
import { ProjectionChart } from "./ProjectionChart";
import { formatCurrency } from "./SummaryCards";

function formatRate(rate: number | null): string {
	if (rate === null) return "N/A";
	return `${rate}%`;
}

function formatMonthly(amount: number | null): string {
	if (amount === null) return "N/A";
	return formatCurrency(amount);
}

function formatUpdatedAt(iso: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(new Date(iso));
}

interface EntryRowProps {
	entry: PortfolioEntry;
	onEdit: (entry: PortfolioEntry) => void;
	onDelete: (id: string) => void;
}

function EntryRow({ entry, onEdit, onDelete }: EntryRowProps) {
	const isInvestment = entry.type === "investment";

	return (
		<div
			data-testid="portfolio-entry-row"
			className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold text-white truncate">
						{entry.name}
					</p>
					<p className="text-xs text-gray-600 mt-0.5">
						Updated {formatUpdatedAt(entry.updatedAt)}
					</p>
				</div>
				<div className="flex items-center gap-1 shrink-0">
					<button
						type="button"
						onClick={() => onEdit(entry)}
						data-testid="edit-entry-btn"
						className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors"
						aria-label={`Edit ${entry.name}`}
					>
						<Pencil size={14} />
					</button>
					<button
						type="button"
						onClick={() => onDelete(entry.id)}
						data-testid="delete-entry-btn"
						className="p-1.5 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors"
						aria-label={`Delete ${entry.name}`}
					>
						<Trash2 size={14} />
					</button>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[0.04]">
				<div>
					<p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium mb-0.5">
						{entry.type === "investment" ? "Contribution" : "Payment"}
					</p>
					<p className="text-sm font-semibold text-white">
						{formatMonthly(entry.monthly_amount)}
						{entry.monthly_amount !== null && (
							<span className="text-xs text-gray-600 font-normal">/mo</span>
						)}
					</p>
				</div>
				<div>
					<p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium mb-0.5">
						Rate
					</p>
					<p className="text-sm font-semibold text-white">
						{formatRate(entry.interest_rate)}
					</p>
				</div>
				<div className="text-right">
					<p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium mb-0.5">
						Balance
					</p>
					<p
						className={`text-sm font-semibold ${isInvestment ? "text-emerald-400" : "text-rose-400"}`}
					>
						{formatCurrency(entry.total_amount)}
					</p>
				</div>
			</div>
		</div>
	);
}

interface SectionProps {
	title: string;
	entries: PortfolioEntry[];
	total: number;
	colorClass: string;
	emptyText: string;
	onEdit: (entry: PortfolioEntry) => void;
	onDelete: (id: string) => void;
}

function Section({
	title,
	entries,
	total,
	colorClass,
	emptyText,
	onEdit,
	onDelete,
}: SectionProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-baseline justify-between">
				<h2 className="text-sm font-semibold text-white uppercase tracking-widest">
					{title}
				</h2>
				<span className={`text-base font-bold ${colorClass}`}>
					{formatCurrency(total)}
				</span>
			</div>
			{entries.length === 0 ? (
				<p className="text-sm text-gray-600 py-4 text-center">{emptyText}</p>
			) : (
				<div className="space-y-2">
					{entries.map((e) => (
						<EntryRow
							key={e.id}
							entry={e}
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export function PortfolioPage() {
	const entries = usePortfolioEntries();
	const removeEntry = useRemovePortfolioEntry();

	const [sheetOpen, setSheetOpen] = useState(false);
	const [editingEntry, setEditingEntry] = useState<PortfolioEntry | null>(null);

	const investments = entries.filter((e) => e.type === "investment");
	const debts = entries.filter((e) => e.type === "debt");
	const totalInvestments = investments.reduce((s, e) => s + e.total_amount, 0);
	const totalDebt = debts.reduce((s, e) => s + e.total_amount, 0);

	function handleAdd() {
		setEditingEntry(null);
		setSheetOpen(true);
	}

	function handleEdit(entry: PortfolioEntry) {
		setEditingEntry(entry);
		setSheetOpen(true);
	}

	async function handleDelete(id: string) {
		await removeEntry(id);
	}

	function handleClose() {
		setSheetOpen(false);
		setEditingEntry(null);
	}

	return (
		<>
			<main className="min-h-screen text-white">
				{/* Ambient glow */}
				<div
					className="fixed inset-0 overflow-hidden pointer-events-none"
					aria-hidden="true"
				>
					<div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[130px]" />
					<div className="absolute top-[50%] right-[5%] w-[350px] h-[350px] bg-indigo-600/[0.04] rounded-full blur-[130px]" />
					<div className="absolute bottom-[10%] left-[40%] w-[400px] h-[400px] bg-rose-500/[0.03] rounded-full blur-[130px]" />
				</div>

				<div className="relative max-w-2xl mx-auto px-4 pt-24 pb-32 space-y-6">
					{/* Page header */}
					<div className="flex items-end justify-between">
						<div>
							<p className="text-xs text-gray-600 uppercase tracking-widest font-medium mb-1">
								Finance
							</p>
							<h1 className="text-3xl font-bold text-white">Portfolio</h1>
						</div>
						<button
							type="button"
							onClick={handleAdd}
							data-testid="open-add-entry"
							className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition-all duration-200 shadow-lg shadow-cyan-500/20"
						>
							<Plus size={16} />
							Add
						</button>
					</div>

					{/* Summary cards */}
					<PortfolioSummaryCards entries={entries} />

					{/* Investments section */}
					<Section
						title="Investments"
						entries={investments}
						total={totalInvestments}
						colorClass="text-emerald-400"
						emptyText="No investments yet — add your first one"
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>

					{/* Debt section */}
					<Section
						title="Debt"
						entries={debts}
						total={totalDebt}
						colorClass="text-rose-400"
						emptyText="No debts — nice!"
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>

					{/* Projection chart */}
					<ProjectionChart entries={entries} />
				</div>
			</main>

			<PortfolioEntrySheet
				open={sheetOpen}
				onClose={handleClose}
				initialValues={editingEntry ?? undefined}
			/>
		</>
	);
}
