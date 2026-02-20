import { Search, X } from "lucide-react";
import type { TransactionFilters } from "../application/use-transactions";

interface TransactionFiltersProps {
	filters: TransactionFilters;
	onChange: (filters: TransactionFilters) => void;
}

const TYPE_OPTIONS: { label: string; value: TransactionFilters["type"] }[] = [
	{ label: "All", value: "all" },
	{ label: "Income", value: "income" },
	{ label: "Expenses", value: "expense" },
];

export function TransactionFiltersBar({
	filters,
	onChange,
}: TransactionFiltersProps) {
	return (
		<div className="flex flex-col gap-3">
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

			{/* Type filter pills */}
			<div className="flex gap-2">
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
			</div>
		</div>
	);
}
