import { describe, expect, it } from "vitest";
import { detectFormat, parseWealthsimpleCSV } from "../csv-import";

// ---------------------------------------------------------------------------
// Fixtures — derived from the real CSV examples
// ---------------------------------------------------------------------------

const ACCOUNT_CSV = `"date","transaction","description","amount","balance","currency"
"2026-02-01","INT","Interest earned","14.17","7810.0","CAD"
"2026-02-05","AFT_IN","Direct deposit from ISTOCKPHOTO LP","138.57","7948.57","CAD"
"2026-02-05","E_TRFOUT","Interac e-Transfer® Out","-210.0","7738.57","CAD"
"2026-02-05","TRFOUT","Transfer out","-411.39","7327.18","CAD"`;

const CREDIT_CSV = `"transaction_date","post_date","type","details","amount","currency"
"2026-02-14","2026-02-15","Purchase","AMZN MKTP CA*M91BX84H3","25.19","CAD"
"2026-02-18","2026-02-18","Payment","From chequing account","-4005.1","CAD"
"2026-02-18","2026-02-19","Purchase","CLAUDE.AI SUBSCRIPTION","29.4","CAD"`;

const UNKNOWN_CSV = `"col1","col2","col3"
"a","b","c"`;

// Helper — asserts non-null so each test body stays concise.
function parsed(csv: string) {
	const result = parseWealthsimpleCSV(csv);
	if (!result) throw new Error("Expected a non-null parse result");
	return result;
}

// ---------------------------------------------------------------------------
// detectFormat
// ---------------------------------------------------------------------------

describe("detectFormat", () => {
	it("detects wealthsimple-account format", () => {
		expect(detectFormat(ACCOUNT_CSV)).toBe("wealthsimple-account");
	});

	it("detects wealthsimple-credit format", () => {
		expect(detectFormat(CREDIT_CSV)).toBe("wealthsimple-credit");
	});

	it("returns null for unknown format", () => {
		expect(detectFormat(UNKNOWN_CSV)).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(detectFormat("")).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// parseWealthsimpleCSV — account (chequing / debit)
// ---------------------------------------------------------------------------

describe("parseWealthsimpleCSV — account format", () => {
	it("returns null for unknown CSV", () => {
		expect(parseWealthsimpleCSV(UNKNOWN_CSV)).toBeNull();
	});

	it("parses all data rows", () => {
		const result = parseWealthsimpleCSV(ACCOUNT_CSV);
		expect(result).not.toBeNull();
		expect(result?.rows).toHaveLength(4);
	});

	it("correctly classifies positive amounts as income", () => {
		const result = parsed(ACCOUNT_CSV);
		const income = result.rows.filter((r) => r.type === "income");
		expect(income).toHaveLength(2); // Interest + Direct deposit
		expect(income[0].description).toBe("Interest earned");
		expect(income[0].amount).toBe(14.17);
	});

	it("correctly classifies negative amounts as expense", () => {
		const result = parsed(ACCOUNT_CSV);
		const expenses = result.rows.filter((r) => r.type === "expense");
		expect(expenses).toHaveLength(2);
		// Amounts should be stored as absolute values
		expect(expenses[0].amount).toBe(210.0);
		expect(expenses[1].amount).toBe(411.39);
	});

	it("parses dates correctly", () => {
		const result = parsed(ACCOUNT_CSV);
		expect(result.rows[0].date).toBe("2026-02-01");
	});

	it("picks up currency", () => {
		const result = parsed(ACCOUNT_CSV);
		for (const row of result.rows) {
			expect(row.currency).toBe("CAD");
		}
	});

	it("reports zero skipped rows for a clean file", () => {
		const result = parsed(ACCOUNT_CSV);
		expect(result.skippedRows).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// parseWealthsimpleCSV — credit card
// ---------------------------------------------------------------------------

describe("parseWealthsimpleCSV — credit card format", () => {
	it("parses purchases as expenses", () => {
		const result = parsed(CREDIT_CSV);
		const purchases = result.rows.filter((r) => r.type === "expense");
		expect(purchases).toHaveLength(2);
	});

	it("skips payment rows", () => {
		const result = parsed(CREDIT_CSV);
		expect(result.skippedRows).toBe(1); // the Payment row
	});

	it("uses transaction_date (not post_date)", () => {
		const result = parsed(CREDIT_CSV);
		expect(result.rows[0].date).toBe("2026-02-14");
	});

	it("uses details field as description", () => {
		const result = parsed(CREDIT_CSV);
		expect(result.rows[0].description).toBe("AMZN MKTP CA*M91BX84H3");
	});

	it("parses amounts as absolute values", () => {
		const result = parsed(CREDIT_CSV);
		expect(result.rows[0].amount).toBe(25.19);
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
	it("handles Windows line endings (CRLF)", () => {
		const crlf = ACCOUNT_CSV.replace(/\n/g, "\r\n");
		const result = parseWealthsimpleCSV(crlf);
		expect(result).not.toBeNull();
		expect(result?.rows.length).toBeGreaterThan(0);
	});

	it("handles descriptions with commas inside quotes", () => {
		const csv = `"date","transaction","description","amount","balance","currency"
"2026-03-01","SPEND","Coffee, pastry","15.00","100.00","CAD"`;
		const result = parsed(csv);
		expect(result.rows[0].description).toBe("Coffee, pastry");
	});

	it('handles escaped quotes ("") inside quoted fields', () => {
		const csv = `"date","transaction","description","amount","balance","currency"
"2026-03-01","SPEND","Tim Hortons ""Double Double""","5.00","200.00","CAD"`;
		const result = parsed(csv);
		expect(result.rows[0].description).toBe('Tim Hortons "Double Double"');
	});

	it("skips account rows with too few columns", () => {
		const csv = `"date","transaction","description","amount","balance","currency"
"2026-03-01","SPEND"
"2026-03-02","SPEND","Coffee","5.00","200.00","CAD"`;
		const result = parsed(csv);
		expect(result.skippedRows).toBe(1);
		expect(result.rows).toHaveLength(1);
	});

	it("skips account rows with an invalid amount", () => {
		const csv = `"date","transaction","description","amount","balance","currency"
"2026-03-01","SPEND","Coffee","not-a-number","200.00","CAD"`;
		const result = parsed(csv);
		expect(result.skippedRows).toBe(1);
		expect(result.rows).toHaveLength(0);
	});

	it("defaults currency to CAD when the field is empty in account format", () => {
		const csv = `"date","transaction","description","amount","balance","currency"
"2026-03-01","SPEND","Coffee","5.00","200.00",""`;
		const result = parsed(csv);
		expect(result.rows[0].currency).toBe("CAD");
	});

	it("skips credit rows with too few columns", () => {
		const csv = `"transaction_date","post_date","type","details","amount","currency"
"2026-03-01","2026-03-02"
"2026-03-03","2026-03-04","Purchase","Coffee","5.00","CAD"`;
		const result = parseWealthsimpleCSV(csv);
		if (!result) throw new Error("Expected non-null result");
		expect(result.skippedRows).toBe(1);
		expect(result.rows).toHaveLength(1);
	});

	it("defaults currency to CAD when the field is empty in credit format", () => {
		const csv = `"transaction_date","post_date","type","details","amount","currency"
"2026-03-01","2026-03-02","Purchase","Coffee","5.00",""`;
		const result = parseWealthsimpleCSV(csv);
		if (!result) throw new Error("Expected non-null result");
		expect(result.rows[0].currency).toBe("CAD");
	});

	it("skips credit rows with a negative amount (card payoff)", () => {
		const csv = `"transaction_date","post_date","type","details","amount","currency"
"2026-03-01","2026-03-02","Purchase","Coffee","-5.00","CAD"`;
		const result = parseWealthsimpleCSV(csv);
		if (!result) throw new Error("Expected non-null result");
		expect(result.skippedRows).toBe(1);
		expect(result.rows).toHaveLength(0);
	});

	it("skips credit rows with an invalid amount", () => {
		const csv = `"transaction_date","post_date","type","details","amount","currency"
"2026-03-01","2026-03-02","Purchase","Coffee","not-a-number","CAD"`;
		const result = parseWealthsimpleCSV(csv);
		if (!result) throw new Error("Expected non-null result");
		expect(result.skippedRows).toBe(1);
		expect(result.rows).toHaveLength(0);
	});
});
