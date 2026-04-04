import { describe, expect, it } from "vitest";
import {
	buildProjectionData,
	type PortfolioEntry,
	projectDebt,
	projectInvestment,
} from "./portfolio-entry";

function makeEntry(overrides: Partial<PortfolioEntry> = {}): PortfolioEntry {
	return {
		id: "test-id",
		type: "investment",
		name: "Test",
		monthly_amount: null,
		interest_rate: null,
		total_amount: 10000,
		currency: "CAD",
		updatedAt: "2026-01-01T00:00:00.000Z",
		createdAt: "2026-01-01T00:00:00.000Z",
		...overrides,
	};
}

describe("projectInvestment", () => {
	it("returns starting value as first element", () => {
		const entry = makeEntry({ total_amount: 5000 });
		const result = projectInvestment(entry, 3);
		expect(result[0]).toBe(5000);
		expect(result).toHaveLength(4);
	});

	it("grows by monthly contribution alone when rate is 0", () => {
		const entry = makeEntry({
			total_amount: 1000,
			monthly_amount: 100,
			interest_rate: 0,
		});
		const result = projectInvestment(entry, 2);
		expect(result[1]).toBeCloseTo(1100);
		expect(result[2]).toBeCloseTo(1200);
	});

	it("applies compound interest with no contributions", () => {
		// 12% annual = 1% monthly
		const entry = makeEntry({
			total_amount: 1000,
			monthly_amount: 0,
			interest_rate: 12,
		});
		const result = projectInvestment(entry, 1);
		expect(result[1]).toBeCloseTo(1010);
	});

	it("handles null monthly_amount and interest_rate (no growth)", () => {
		const entry = makeEntry({
			total_amount: 5000,
			monthly_amount: null,
			interest_rate: null,
		});
		const result = projectInvestment(entry, 12);
		// All values should stay at 5000
		expect(result.every((v) => v === 5000)).toBe(true);
	});
});

describe("projectDebt", () => {
	it("returns starting balance as first element", () => {
		const entry = makeEntry({ type: "debt", total_amount: 20000 });
		const result = projectDebt(entry, 3);
		expect(result[0]).toBe(20000);
	});

	it("decreases by payment when rate is 0", () => {
		const entry = makeEntry({
			type: "debt",
			total_amount: 1000,
			monthly_amount: 100,
			interest_rate: 0,
		});
		const result = projectDebt(entry, 2);
		expect(result[1]).toBeCloseTo(900);
		expect(result[2]).toBeCloseTo(800);
	});

	it("floors at 0 when fully paid off", () => {
		const entry = makeEntry({
			type: "debt",
			total_amount: 500,
			monthly_amount: 1000,
			interest_rate: 0,
		});
		const result = projectDebt(entry, 2);
		expect(result[1]).toBe(0);
		expect(result[2]).toBe(0);
	});

	it("increases when payment is less than interest", () => {
		// 120% annual = 10% monthly. Balance grows if payment is small.
		const entry = makeEntry({
			type: "debt",
			total_amount: 1000,
			monthly_amount: 50,
			interest_rate: 120,
		});
		const result = projectDebt(entry, 1);
		// 1000 * 1.10 - 50 = 1050
		expect(result[1]).toBeCloseTo(1050);
	});
});

describe("buildProjectionData", () => {
	it("returns months+1 data points", () => {
		const entries = [makeEntry()];
		const data = buildProjectionData(entries, 12);
		expect(data).toHaveLength(13);
	});

	it("first label is Now", () => {
		const data = buildProjectionData([makeEntry()], 5);
		expect(data[0].label).toBe("Now");
		expect(data[1].label).toBe("M1");
	});

	it("sums investments and debts separately", () => {
		const inv1 = makeEntry({
			type: "investment",
			total_amount: 10000,
			monthly_amount: null,
			interest_rate: null,
		});
		const inv2 = makeEntry({
			type: "investment",
			total_amount: 5000,
			monthly_amount: null,
			interest_rate: null,
		});
		const debt = makeEntry({
			type: "debt",
			total_amount: 3000,
			monthly_amount: null,
			interest_rate: null,
		});
		const data = buildProjectionData([inv1, inv2, debt], 1);
		expect(data[0].investments).toBe(15000);
		expect(data[0].debt).toBe(3000);
		expect(data[0].netWorth).toBe(12000);
	});
});
