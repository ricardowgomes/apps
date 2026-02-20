import { describe, expect, it } from "vitest";
import {
	EXPENSE_CATEGORIES,
	INCOME_CATEGORIES,
	transactionSchema,
} from "../transaction";

describe("transactionSchema", () => {
	it("accepts a valid income transaction", () => {
		const result = transactionSchema.safeParse({
			type: "income",
			amount: 1000,
			currency: "CAD",
			category: "Salary",
			description: "Monthly salary",
			date: "2026-02-01",
		});
		expect(result.success).toBe(true);
	});

	it("accepts a valid expense transaction", () => {
		const result = transactionSchema.safeParse({
			type: "expense",
			amount: 85.5,
			currency: "CAD",
			category: "Food & Dining",
			description: "Grocery run",
			date: "2026-02-15",
		});
		expect(result.success).toBe(true);
	});

	it("rejects a negative amount", () => {
		const result = transactionSchema.safeParse({
			type: "expense",
			amount: -50,
			currency: "CAD",
			category: "Food & Dining",
			description: "Lunch",
			date: "2026-02-01",
		});
		expect(result.success).toBe(false);
	});

	it("rejects a zero amount", () => {
		const result = transactionSchema.safeParse({
			type: "expense",
			amount: 0,
			currency: "CAD",
			category: "Transport",
			description: "Bus",
			date: "2026-02-01",
		});
		expect(result.success).toBe(false);
	});

	it("rejects an empty description", () => {
		const result = transactionSchema.safeParse({
			type: "income",
			amount: 500,
			currency: "CAD",
			category: "Freelance",
			description: "",
			date: "2026-02-01",
		});
		expect(result.success).toBe(false);
	});

	it("rejects an invalid type", () => {
		const result = transactionSchema.safeParse({
			type: "transfer",
			amount: 100,
			currency: "CAD",
			category: "Other",
			description: "Transfer",
			date: "2026-02-01",
		});
		expect(result.success).toBe(false);
	});
});

describe("INCOME_CATEGORIES", () => {
	it("includes expected categories", () => {
		expect(INCOME_CATEGORIES).toContain("Salary");
		expect(INCOME_CATEGORIES).toContain("Freelance");
		expect(INCOME_CATEGORIES).toContain("Investment");
	});
});

describe("EXPENSE_CATEGORIES", () => {
	it("includes expected categories", () => {
		expect(EXPENSE_CATEGORIES).toContain("Food & Dining");
		expect(EXPENSE_CATEGORIES).toContain("Housing");
		expect(EXPENSE_CATEGORIES).toContain("Transport");
	});
});
