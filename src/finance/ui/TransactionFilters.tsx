import {
	ArrowDownUp,
	ChevronLeft,
	ChevronRight,
	Search,
	X,
} from "lucide-react";
import type { TransactionFilters } from "../application/use-transactions";

interface TransactionFiltersProps {
	filters: TransactionFilters;
	onChange: (filters: TransactionFilters) => void;
	selectedMonth: string;
	onMonthChange: (month: string) => void;
	sortOrder: "desc" | "asc";
	onSortToggle: () => void;
}

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

export function TransactionFiltersBar({
	filters,
	onChange,
	selectedMonth,
	onMonthChange,
	sortOrder,
	onSortToggle,
}: TransactionFiltersProps) {
	return (
		<div className="flex flex-col gap-3">
			{/* Month picker */}
			<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={() => onMonthChange(addMonths(selectedMonth, -1))}
					aria-label="Previous month"
					className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-colors"
				>
					<ChevronLeft size={16} />
				</button>

				<span
					data-testid="month-display"
					className="text-sm font-medium text-white"
				>
					{formatMonthDisplay(selectedMonth)}
				</span>

				<button
					type="button"
					onClick={() => onMonthChange(addMonths(selectedMonth, 1))}
					aria-label="Next month"
					className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-colors"
				>
					<ChevronRight size={16} />
				</button>
			</div>

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
