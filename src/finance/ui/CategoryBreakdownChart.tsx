import { useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	type CategorySlice,
	useCategoryBreakdown,
} from "../application/use-chart-data";
import type { Transaction } from "../domain/transaction";
import { formatCurrency } from "./SummaryCards";

// Cycle through a small set of accent colours so each category gets a distinct bar
const CATEGORY_COLORS = [
	"#22d3ee", // cyan-400
	"#818cf8", // indigo-400
	"#a78bfa", // violet-400
	"#38bdf8", // sky-400
	"#34d399", // emerald-400
	"#fb923c", // orange-400
	"#f472b6", // pink-400
];

function ChartTooltip({
	active,
	payload,
}: {
	active?: boolean;
	payload?: Array<{ value: number; payload: CategorySlice }>;
}) {
	if (!active || !payload?.length) return null;
	const { value, payload: data } = payload[0];
	return (
		<div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f]/90 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
			<p className="text-gray-400">{data.category}</p>
			<p className="mt-0.5 font-semibold text-white">{formatCurrency(value)}</p>
		</div>
	);
}

interface CategoryBreakdownChartProps {
	transactions: Transaction[];
}

export function CategoryBreakdownChart({
	transactions,
}: CategoryBreakdownChartProps) {
	const slices = useCategoryBreakdown(transactions);

	// Guard against SSR — recharts uses ResizeObserver + window
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	return (
		<div
			data-testid="category-breakdown-chart"
			className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
		>
			<h3 className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-4">
				Spending by Category
			</h3>

			{slices.length === 0 ? (
				<div className="flex items-center justify-center h-24 text-gray-600 text-sm">
					No expenses this month
				</div>
			) : mounted ? (
				<ResponsiveContainer
					width="100%"
					height={Math.max(slices.length * 40, 80)}
				>
					<BarChart
						data={slices}
						layout="vertical"
						margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
					>
						<XAxis type="number" hide domain={[0, "dataMax"]} />
						<YAxis
							type="category"
							dataKey="category"
							width={120}
							tick={{ fill: "#6b7280", fontSize: 12 }}
							axisLine={false}
							tickLine={false}
						/>
						<Tooltip
							content={<ChartTooltip />}
							cursor={{ fill: "rgba(255,255,255,0.03)" }}
						/>
						<Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={20}>
							{slices.map((entry, index) => (
								<Cell
									key={entry.category}
									fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
									fillOpacity={0.85}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			) : (
				<div className="h-24 animate-pulse rounded-xl bg-white/[0.03]" />
			)}
		</div>
	);
}
