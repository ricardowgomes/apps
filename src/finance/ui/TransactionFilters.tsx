import {
	ArrowDownUp,
	Calendar,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Search,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
	DateRange,
	DateRangePreset,
} from "../application/finance-ui-store";
import {
	getDateRangeLabel,
	setDateRange,
} from "../application/finance-ui-store";
import type { TransactionFilters } from "../application/use-transactions";

interface TransactionFiltersProps {
	filters: TransactionFilters;
	onChange: (filters: TransactionFilters) => void;
	dateRange: DateRange;
	sortOrder: "desc" | "asc";
	onSortToggle: () => void;
}

const PRESETS: { label: string; value: DateRangePreset }[] = [
	{ label: "Last 7 days", value: "7d" },
	{ label: "Last 30 days", value: "30d" },
	{ label: "Last 3 months", value: "90d" },
	{ label: "Last 6 months", value: "6m" },
	{ label: "Last 12 months", value: "12m" },
];

const TYPE_OPTIONS: { label: string; value: TransactionFilters["type"] }[] = [
	{ label: "All", value: "all" },
	{ label: "Income", value: "income" },
	{ label: "Expenses", value: "expense" },
];

function formatMonthDisplay(yearMonth: string): string {
	return new Date(`${yearMonth}-01T12:00:00`).toLocaleDateString("en-CA", {
		month: "long",
		year: "numeric",
	});
}

function addMonths(yearMonth: string, delta: number): string {
	const [year, mon] = yearMonth.split("-").map(Number);
	const d = new Date(year, mon - 1 + delta, 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentYearMonth(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function DateRangePicker({ dateRange }: { dateRange: DateRange }) {
	const [open, setOpen] = useState(false);
	// Track the month shown in the month-picker panel; default to current month
	const [pickerMonth, setPickerMonth] = useState(
		dateRange.type === "month" ? dateRange.month : currentYearMonth(),
	);
	// Custom range inputs
	const [customFrom, setCustomFrom] = useState(
		dateRange.type === "custom" ? dateRange.from : "",
	);
	const [customTo, setCustomTo] = useState(
		dateRange.type === "custom" ? dateRange.to : "",
	);
	const ref = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		function handler(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	function applyPreset(preset: DateRangePreset) {
		setDateRange({ type: "preset", preset });
		setOpen(false);
	}

	function applyMonth(month: string) {
		setDateRange({ type: "month", month });
		setOpen(false);
	}

	function applyCustom() {
		if (customFrom && customTo && customFrom <= customTo) {
			setDateRange({ type: "custom", from: customFrom, to: customTo });
			setOpen(false);
		}
	}

	const label = getDateRangeLabel(dateRange);
	const isPreset = dateRange.type === "preset";
	const activePreset = isPreset ? dateRange.preset : null;

	return (
		<div ref={ref} className="relative">
			{/* Trigger button */}
			<button
				type="button"
				data-testid="date-range-picker"
				onClick={() => setOpen((v) => !v)}
				className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white hover:bg-white/[0.07] transition-colors w-full"
			>
				<Calendar size={14} className="text-gray-500 flex-shrink-0" />
				<span className="flex-1 text-left text-sm">{label}</span>
				<ChevronDown
					size={13}
					className={`text-gray-500 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{/* Dropdown */}
			{open && (
				<div className="absolute z-50 mt-2 left-0 w-72 rounded-2xl border border-white/[0.10] bg-[#111] shadow-2xl shadow-black/60 overflow-hidden">
					{/* Presets */}
					<div className="p-3 space-y-0.5">
						<p className="text-xs text-gray-600 uppercase tracking-widest font-medium px-2 pb-1.5">
							Presets
						</p>
						{PRESETS.map(({ label: pl, value }) => (
							<button
								key={value}
								type="button"
								onClick={() => applyPreset(value)}
								className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
									activePreset === value
										? "bg-cyan-500/15 text-cyan-400"
										: "text-gray-300 hover:bg-white/[0.06] hover:text-white"
								}`}
							>
								{pl}
							</button>
						))}
					</div>

					<div className="border-t border-white/[0.06]" />

					{/* Month picker */}
					<div className="p-3">
						<p className="text-xs text-gray-600 uppercase tracking-widest font-medium px-2 pb-2">
							Specific month
						</p>
						<div className="flex items-center justify-between px-1">
							<button
								type="button"
								onClick={() => setPickerMonth(addMonths(pickerMonth, -1))}
								aria-label="Previous month"
								className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-colors"
							>
								<ChevronLeft size={14} />
							</button>
							<button
								type="button"
								onClick={() => applyMonth(pickerMonth)}
								data-testid="month-display"
								className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
									dateRange.type === "month" && dateRange.month === pickerMonth
										? "text-cyan-400 bg-cyan-500/15"
										: "text-white hover:bg-white/[0.06]"
								}`}
							>
								{formatMonthDisplay(pickerMonth)}
							</button>
							<button
								type="button"
								onClick={() => setPickerMonth(addMonths(pickerMonth, 1))}
								aria-label="Next month"
								className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-colors"
							>
								<ChevronRight size={14} />
							</button>
						</div>
					</div>

					<div className="border-t border-white/[0.06]" />

					{/* Custom date range */}
					<div className="p-3">
						<p className="text-xs text-gray-600 uppercase tracking-widest font-medium px-2 pb-2">
							Custom range
						</p>
						<div className="flex gap-2 items-center">
							<input
								type="date"
								value={customFrom}
								onChange={(e) => setCustomFrom(e.target.value)}
								className="flex-1 px-2 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-500/40 transition-colors [color-scheme:dark]"
								aria-label="From date"
							/>
							<span className="text-gray-600 text-xs flex-shrink-0">–</span>
							<input
								type="date"
								value={customTo}
								onChange={(e) => setCustomTo(e.target.value)}
								className="flex-1 px-2 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-500/40 transition-colors [color-scheme:dark]"
								aria-label="To date"
							/>
						</div>
						<button
							type="button"
							onClick={applyCustom}
							disabled={!customFrom || !customTo || customFrom > customTo}
							className="mt-2 w-full py-1.5 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Apply range
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export function TransactionFiltersBar({
	filters,
	onChange,
	dateRange,
	sortOrder,
	onSortToggle,
}: TransactionFiltersProps) {
	return (
		<div className="flex flex-col gap-3">
			{/* Date range picker */}
			<DateRangePicker dateRange={dateRange} />

			{/* Search */}
			<div className="relative">
				<Search
					size={15}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
				/>
				<input
					type="text"
					placeholder="Search transactions…"
					value={filters.search}
					onChange={(e) => onChange({ ...filters, search: e.target.value })}
					className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
				/>
				{filters.search && (
					<button
						type="button"
						onClick={() => onChange({ ...filters, search: "" })}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
						aria-label="Clear search"
					>
						<X size={14} />
					</button>
				)}
			</div>

			{/* Type filter pills + sort toggle */}
			<div className="flex items-center gap-2">
				{TYPE_OPTIONS.map(({ label, value }) => (
					<button
						key={value}
						type="button"
						onClick={() => onChange({ ...filters, type: value })}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
							filters.type === value
								? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
								: "bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-white hover:bg-white/[0.07]"
						}`}
					>
						{label}
					</button>
				))}

				<button
					type="button"
					onClick={onSortToggle}
					data-testid="sort-toggle"
					aria-label={
						sortOrder === "desc" ? "Sort oldest first" : "Sort newest first"
					}
					className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-white hover:bg-white/[0.07] transition-all"
				>
					<ArrowDownUp size={12} />
					{sortOrder === "desc" ? "Newest" : "Oldest"}
				</button>
			</div>
		</div>
	);
}
