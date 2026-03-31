import { useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	type MonthlyDataPoint,
	useMonthlyTrend,
} from "../application/use-chart-data";
import type { Transaction } from "../domain/transaction";
import { formatCurrency } from "./SummaryCards";

function ChartTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: Array<{
		name: keyof MonthlyDataPoint;
		value: number;
		color: string;
	}>;
	label?: string;
}) {
	if (!active || !payload?.length) return null;
	return (
		<div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f]/90 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
			<p className="mb-1.5 text-gray-400 font-medium">{label}</p>
			{payload.map((entry) => (
				<p key={entry.name} style={{ color: entry.color }} className="mt-0.5">
					{entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}:{" "}
					<span className="font-semibold">{formatCurrency(entry.value)}</span>
				</p>
			))}
		</div>
	);
}

interface MonthlyTrendChartProps {
	allTransactions: Transaction[];
}

export function MonthlyTrendChart({ allTransactions }: MonthlyTrendChartProps) {
	const data = useMonthlyTrend(allTransactions);

	// Guard against SSR — recharts uses ResizeObserver + window
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	return (
		<div
			data-testid="monthly-trend-chart"
			className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
		>
			<h3 className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-4">
				Income vs Expenses — Last 6 Months
			</h3>

			{mounted ? (
				<ResponsiveContainer width="100%" height={200}>
					<BarChart
						data={data}
						margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
						barCategoryGap="30%"
					>
						<CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
						<XAxis
							dataKey="label"
							tick={{ fill: "#6b7280", fontSize: 11 }}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis hide />
						<Tooltip
							content={<ChartTooltip />}
							cursor={{ fill: "rgba(255,255,255,0.03)" }}
						/>
						<Legend
							formatter={(value) =>
								value.charAt(0).toUpperCase() + value.slice(1)
							}
							wrapperStyle={{ fontSize: 11, color: "#6b7280", paddingTop: 8 }}
						/>
						<Bar
							dataKey="income"
							fill="#34d399"
							fillOpacity={0.8}
							radius={[3, 3, 0, 0]}
							maxBarSize={24}
						/>
						<Bar
							dataKey="expenses"
							fill="#fb7185"
							fillOpacity={0.8}
							radius={[3, 3, 0, 0]}
							maxBarSize={24}
						/>
					</BarChart>
				</ResponsiveContainer>
			) : (
				<div className="h-[200px] animate-pulse rounded-xl bg-white/[0.03]" />
			)}
		</div>
	);
}
