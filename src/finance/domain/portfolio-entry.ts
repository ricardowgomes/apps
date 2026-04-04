import { z } from "zod";

export type PortfolioEntryType = "investment" | "debt";

export const portfolioEntrySchema = z.object({
	type: z.enum(["investment", "debt"]),
	name: z.string().min(1, "Name is required"),
	// null means "N/A" — user has not set a monthly amount
	monthly_amount: z.number().positive().nullable(),
	// null means "N/A" — user has not set an interest rate
	interest_rate: z.number().min(0).nullable(),
	total_amount: z.number().nonnegative("Total must be zero or greater"),
	currency: z.string().min(1),
});

export type PortfolioEntryInput = z.infer<typeof portfolioEntrySchema>;

export interface PortfolioEntry extends PortfolioEntryInput {
	id: string;
	updatedAt: string;
	createdAt: string;
}

// --- Projection helpers ---

/** Number of months to project forward in the projection chart. */
export const PROJECTION_MONTHS = 60;

/**
 * Projects a single investment entry forward month-by-month.
 * Uses the standard future-value formula with optional monthly contributions.
 *
 *   FV(n+1) = FV(n) * (1 + r/12) + monthly_amount
 *
 * If monthly_amount or interest_rate is null they are treated as 0.
 */
export function projectInvestment(
	entry: PortfolioEntry,
	months: number = PROJECTION_MONTHS,
): number[] {
	const rate = (entry.interest_rate ?? 0) / 100 / 12;
	const contribution = entry.monthly_amount ?? 0;
	const values: number[] = [entry.total_amount];
	for (let i = 1; i <= months; i++) {
		const prev = values[i - 1];
		values.push(prev * (1 + rate) + contribution);
	}
	return values;
}

/**
 * Projects a single debt entry forward month-by-month.
 * Applies interest then subtracts the monthly payment.
 * Balance floors at 0 once the debt is paid off.
 *
 * If monthly_amount or interest_rate is null they are treated as 0.
 */
export function projectDebt(
	entry: PortfolioEntry,
	months: number = PROJECTION_MONTHS,
): number[] {
	const rate = (entry.interest_rate ?? 0) / 100 / 12;
	const payment = entry.monthly_amount ?? 0;
	const values: number[] = [entry.total_amount];
	for (let i = 1; i <= months; i++) {
		const prev = values[i - 1];
		const next = Math.max(0, prev * (1 + rate) - payment);
		values.push(next);
	}
	return values;
}

/**
 * Builds the combined projection dataset for the chart.
 * Returns one data point per month with:
 *   - label: "Month N" (or "Now" for index 0)
 *   - investments: total projected investment value
 *   - debt: total projected debt value
 *   - netWorth: investments - debt
 */
export function buildProjectionData(
	entries: PortfolioEntry[],
	months: number = PROJECTION_MONTHS,
): Array<{
	label: string;
	investments: number;
	debt: number;
	netWorth: number;
}> {
	const investments = entries.filter((e) => e.type === "investment");
	const debts = entries.filter((e) => e.type === "debt");

	const investmentSeries = investments.map((e) => projectInvestment(e, months));
	const debtSeries = debts.map((e) => projectDebt(e, months));

	return Array.from({ length: months + 1 }, (_, i) => {
		const totalInvestments = investmentSeries.reduce(
			(sum, series) => sum + series[i],
			0,
		);
		const totalDebt = debtSeries.reduce((sum, series) => sum + series[i], 0);
		return {
			label: i === 0 ? "Now" : `M${i}`,
			investments: Math.round(totalInvestments * 100) / 100,
			debt: Math.round(totalDebt * 100) / 100,
			netWorth: Math.round((totalInvestments - totalDebt) * 100) / 100,
		};
	});
}
