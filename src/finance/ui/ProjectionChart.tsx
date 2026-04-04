import { useEffect, useState } from "react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { PortfolioEntry } from "../domain/portfolio-entry";
import { buildProjectionData } from "../domain/portfolio-entry";
import { formatCurrency } from "./SummaryCards";

function ChartTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: Array<{ name: string; value: number; color: string }>;
	label?: string;
}) {
	if (!active || !payload?.length) return null;
	return (
		<div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f]/90 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
			<p className="mb-1.5 text-gray-400 font-medium">{label}</p>
			{payload.map((entry) => (
				<p key={entry.name} style={{ color: entry.color }} className="mt-0.5">
					{entry.name}:{" "}
					<span className="font-semibold">{formatCurrency(entry.value)}</span>
				</p>
			))}
		</div>
	);
}

// Show monthly ticks at 0, 6, 12, 24, 36, 48, 60
const TICK_MONTHS = [0, 6, 12, 24, 36, 48, 60];

function formatTick(label: string): string {
	if (label === "Now") return "Now";
	const month = Number(label.replace("M", ""));
	if (month % 12 === 0) return `Yr ${month / 12}`;
	if (month === 6) return "6m";
	return "";
}

interface ProjectionChartProps {
	entries: PortfolioEntry[];
}

export function ProjectionChart({ entries }: ProjectionChartProps) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const data = buildProjectionData(entries, 60);
	// Only render tick labels for selected months to avoid clutter
	const tickLabels = new Set(
		TICK_MONTHS.map((m) => (m === 0 ? "Now" : `M${m}`)),
	);

	const hasEntries = entries.length > 0;

	return (
		<div
			data-testid="projection-chart"
			className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
		>
			<h3 className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-1">
				5-Year Projection
			</h3>
			<p className="text-xs text-gray-600 mb-4">
				Based on current balances, monthly amounts, and interest rates
			</p>

			{!hasEntries ? (
				<div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">
					Add entries to see projections
				</div>
			) : mounted ? (
				<ResponsiveContainer width="100%" height={220}>
					<LineChart
						data={data}
						margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
					>
						<CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
						<XAxis
							dataKey="label"
							tick={({
								x,
								y,
								payload,
							}: {
								x: string | number;
								y: string | number;
								payload: { value: string };
							}) =>
								tickLabels.has(payload.value) ? (
									<text
										x={x}
										y={Number(y) + 12}
										textAnchor="middle"
										fill="#6b7280"
										fontSize={11}
									>
										{formatTick(payload.value)}
									</text>
								) : null
							}
							axisLine={false}
							tickLine={false}
							interval={0}
						/>
						<YAxis hide />
						<Tooltip
							content={<ChartTooltip />}
							cursor={{ stroke: "rgba(255,255,255,0.06)" }}
						/>
						<Legend
							wrapperStyle={{ fontSize: 11, color: "#6b7280", paddingTop: 8 }}
						/>
						<Line
							type="monotone"
							dataKey="investments"
							name="Investments"
							stroke="#34d399"
							strokeWidth={2}
							dot={false}
							activeDot={{ r: 4, fill: "#34d399" }}
						/>
						<Line
							type="monotone"
							dataKey="debt"
							name="Debt"
							stroke="#fb7185"
							strokeWidth={2}
							dot={false}
							activeDot={{ r: 4, fill: "#fb7185" }}
						/>
						<Line
							type="monotone"
							dataKey="netWorth"
							name="Net Worth"
							stroke="#818cf8"
							strokeWidth={2}
							strokeDasharray="4 3"
							dot={false}
							activeDot={{ r: 4, fill: "#818cf8" }}
						/>
					</LineChart>
				</ResponsiveContainer>
			) : (
				<div className="h-[220px] animate-pulse rounded-xl bg-white/[0.03]" />
			)}
		</div>
	);
}
