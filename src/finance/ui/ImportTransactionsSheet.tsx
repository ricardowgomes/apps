import { Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useImportTransactions } from "../application/use-transactions";
import { type ParsedRow, parseWealthsimpleCSV } from "../domain/csv-import";
import type { Transaction } from "../domain/transaction";

interface Props {
	open: boolean;
	onClose: () => void;
}

type Step = "upload" | "preview" | "done";

interface PreviewRow extends ParsedRow {
	category: string;
}

function formatAmount(amount: number): string {
	return amount.toLocaleString("en-CA", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function makeTransactions(rows: PreviewRow[]): Transaction[] {
	return rows.map((r) => ({
		id: crypto.randomUUID(),
		type: r.type,
		amount: r.amount,
		currency: r.currency,
		category: r.category,
		description: r.description,
		date: r.date,
		createdAt: new Date().toISOString(),
	}));
}

export function ImportTransactionsSheet({ open, onClose }: Props) {
	const [step, setStep] = useState<Step>("upload");
	const [error, setError] = useState<string | null>(null);
	const [formatLabel, setFormatLabel] = useState<string>("");
	const [skippedRows, setSkippedRows] = useState(0);
	const [rows, setRows] = useState<PreviewRow[]>([]);
	const [importResult, setImportResult] = useState<{
		inserted: number;
		duplicates: number;
	} | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const importMutation = useImportTransactions();

	// Reset when sheet opens/closes
	useEffect(() => {
		if (!open) {
			setStep("upload");
			setError(null);
			setRows([]);
			setImportResult(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	}, [open]);

	// Escape key
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	const handleFile = useCallback((file: File) => {
		if (!file.name.endsWith(".csv")) {
			setError("Please upload a .csv file.");
			return;
		}
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			const result = parseWealthsimpleCSV(text);
			if (!result) {
				setError(
					"Could not detect a supported Wealthsimple CSV format. Make sure you're uploading a Wealthsimple account or credit card statement.",
				);
				return;
			}
			const label =
				result.format === "wealthsimple-credit"
					? "Wealthsimple Credit Card"
					: "Wealthsimple Account (Chequing / Savings / Debit)";
			setFormatLabel(label);
			setSkippedRows(result.skippedRows);
			setRows(result.rows.map((r) => ({ ...r, category: "Uncategorized" })));
			setError(null);
			setStep("preview");
		};
		reader.readAsText(file);
	}, []);

	const onDrop = useCallback(
		(e: React.DragEvent<HTMLElement>) => {
			e.preventDefault();
			const file = e.dataTransfer.files[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	const onFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	const handleImport = async () => {
		const transactions = makeTransactions(rows);
		const result = await importMutation.mutateAsync(transactions);
		setImportResult(result);
		setStep("done");
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
					open ? "opacity-100" : "opacity-0 pointer-events-none"
				}`}
				onClick={onClose}
				onKeyDown={undefined}
				role="presentation"
				aria-hidden="true"
			/>

			{/* Sheet */}
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Import transactions"
				aria-hidden={open ? undefined : true}
				data-testid="import-sheet"
				className={`fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-3xl border-t border-white/[0.08] bg-[#070d14] shadow-2xl transition-transform duration-300 ease-out ${
					open ? "translate-y-0" : "translate-y-full"
				}`}
			>
				{/* Drag handle */}
				<div className="flex justify-center pt-3 pb-1">
					<div className="w-10 h-1 rounded-full bg-white/20" />
				</div>

				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4">
					<h2 className="text-base font-semibold text-white">
						Import Transactions
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
						aria-label="Close"
					>
						<X size={18} />
					</button>
				</div>

				<div className="px-6 pb-8">
					{step === "upload" && (
						<UploadStep
							error={error}
							fileInputRef={fileInputRef}
							onDrop={onDrop}
							onFileChange={onFileChange}
						/>
					)}

					{step === "preview" && (
						<PreviewStep
							rows={rows}
							formatLabel={formatLabel}
							skippedRows={skippedRows}
							isImporting={importMutation.isPending}
							onBack={() => setStep("upload")}
							onImport={handleImport}
						/>
					)}

					{step === "done" && importResult && (
						<DoneStep result={importResult} onClose={onClose} />
					)}
				</div>
			</div>
		</>
	);
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function ImportTotalsSummary({ rows }: { rows: PreviewRow[] }) {
	const totalIncome = rows
		.filter((r) => r.type === "income")
		.reduce((sum, r) => sum + r.amount, 0);
	const totalExpense = rows
		.filter((r) => r.type === "expense")
		.reduce((sum, r) => sum + r.amount, 0);
	const net = totalIncome - totalExpense;

	return (
		<div
			data-testid="import-totals-summary"
			className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex justify-between text-xs"
		>
			<div className="space-y-0.5">
				<p className="text-gray-500">Income</p>
				<p className="text-emerald-400 font-mono font-semibold">
					+${formatAmount(totalIncome)}
				</p>
			</div>
			<div className="space-y-0.5 text-center">
				<p className="text-gray-500">Expenses</p>
				<p className="text-rose-400 font-mono font-semibold">
					-${formatAmount(totalExpense)}
				</p>
			</div>
			<div className="space-y-0.5 text-right">
				<p className="text-gray-500">Net</p>
				<p
					className={`font-mono font-semibold ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}
				>
					{net >= 0 ? "+" : "-"}${formatAmount(Math.abs(net))}
				</p>
			</div>
		</div>
	);
}

function UploadStep({
	error,
	fileInputRef,
	onDrop,
	onFileChange,
}: {
	error: string | null;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	onDrop: (e: React.DragEvent<HTMLElement>) => void;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<div className="space-y-4">
			<p className="text-sm text-gray-400">
				Upload a Wealthsimple CSV export. Supported: chequing, savings, debit,
				and credit card statements.
			</p>

			{/* Drop zone */}
			<button
				type="button"
				className="w-full border-2 border-dashed border-white/[0.12] rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer hover:border-cyan-500/40 transition-colors"
				onDrop={onDrop}
				onDragOver={(e) => e.preventDefault()}
				onClick={() => fileInputRef.current?.click()}
				aria-label="Upload CSV file"
			>
				<div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
					<Upload size={22} className="text-cyan-400" />
				</div>
				<div className="text-center">
					<p className="text-sm text-white font-medium">
						Drop your CSV here or click to browse
					</p>
					<p className="text-xs text-gray-600 mt-1">
						Wealthsimple exports only
					</p>
				</div>
			</button>

			<input
				ref={fileInputRef}
				type="file"
				accept=".csv"
				className="hidden"
				onChange={onFileChange}
			/>

			{error && (
				<p className="text-sm text-rose-400 bg-rose-500/10 rounded-xl px-4 py-3">
					{error}
				</p>
			)}
		</div>
	);
}

function PreviewStep({
	rows,
	formatLabel,
	skippedRows,
	isImporting,
	onBack,
	onImport,
}: {
	rows: PreviewRow[];
	formatLabel: string;
	skippedRows: number;
	isImporting: boolean;
	onBack: () => void;
	onImport: () => void;
}) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-xs text-gray-500 font-medium">{formatLabel}</p>
					<p className="text-sm text-white font-semibold mt-0.5">
						{rows.length} transaction{rows.length !== 1 ? "s" : ""} found
						{skippedRows > 0 && (
							<span className="text-gray-500 font-normal">
								{" "}
								· {skippedRows} skipped
							</span>
						)}
					</p>
				</div>
				<button
					type="button"
					onClick={onBack}
					className="text-xs text-gray-500 hover:text-white transition-colors"
				>
					Change file
				</button>
			</div>

			<p className="text-xs text-amber-400/80 bg-amber-500/10 rounded-xl px-4 py-3">
				Categories will be set to <strong>Uncategorized</strong>. You can
				re-categorise after importing.
			</p>

			{/* Preview table */}
			<div className="rounded-xl border border-white/[0.06] overflow-hidden">
				<div className="overflow-x-auto max-h-64">
					<table className="w-full text-xs">
						<thead>
							<tr className="border-b border-white/[0.06] bg-white/[0.02]">
								<th className="text-left px-3 py-2.5 text-gray-500 font-medium">
									Date
								</th>
								<th className="text-left px-3 py-2.5 text-gray-500 font-medium">
									Description
								</th>
								<th className="text-right px-3 py-2.5 text-gray-500 font-medium">
									Amount
								</th>
								<th className="text-left px-3 py-2.5 text-gray-500 font-medium">
									Type
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr
									key={`${row.date}-${row.amount}-${row.rowIndex}`}
									className="border-b border-white/[0.04] last:border-0"
								>
									<td className="px-3 py-2 text-gray-400 whitespace-nowrap">
										{row.date}
									</td>
									<td className="px-3 py-2 text-white max-w-[180px] truncate">
										{row.description}
									</td>
									<td className="px-3 py-2 text-right font-mono whitespace-nowrap">
										<span
											className={
												row.type === "income"
													? "text-emerald-400"
													: "text-rose-400"
											}
										>
											{row.type === "income" ? "+" : "-"}$
											{formatAmount(row.amount)}
										</span>
									</td>
									<td className="px-3 py-2 whitespace-nowrap capitalize text-gray-400">
										{row.type}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Totals summary */}
			<ImportTotalsSummary rows={rows} />

			<div className="flex gap-3 pt-1">
				<button
					type="button"
					onClick={onBack}
					disabled={isImporting}
					className="flex-1 py-3 rounded-xl border border-white/[0.08] text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
				>
					Back
				</button>
				<button
					type="button"
					onClick={onImport}
					disabled={isImporting || rows.length === 0}
					className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isImporting ? "Importing…" : `Import ${rows.length}`}
				</button>
			</div>
		</div>
	);
}

function DoneStep({
	result,
	onClose,
}: {
	result: { inserted: number; duplicates: number };
	onClose: () => void;
}) {
	return (
		<div className="space-y-6 py-4">
			<div className="text-center space-y-2">
				<div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
					<span className="text-2xl">✓</span>
				</div>
				<h3 className="text-white font-semibold text-lg">Import complete</h3>
				<p className="text-sm text-gray-400">
					<span className="text-emerald-400 font-semibold">
						{result.inserted}
					</span>{" "}
					transaction{result.inserted !== 1 ? "s" : ""} imported
					{result.duplicates > 0 && (
						<>
							{" "}
							·{" "}
							<span className="text-gray-500">
								{result.duplicates} duplicate
								{result.duplicates !== 1 ? "s" : ""} skipped
							</span>
						</>
					)}
				</p>
			</div>

			<button
				type="button"
				onClick={onClose}
				className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20"
			>
				Done
			</button>
		</div>
	);
}
