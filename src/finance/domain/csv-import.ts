type WealthsimpleFormat =
	| "wealthsimple-account" // checking or debit: date,transaction,description,amount,balance,currency
	| "wealthsimple-credit"; // credit card: transaction_date,post_date,type,details,amount,currency

export interface ParsedRow {
	date: string;
	description: string;
	amount: number;
	type: "income" | "expense";
	currency: string;
	/** Raw row index in the CSV for error reporting */
	rowIndex: number;
}

interface ParseResult {
	format: WealthsimpleFormat;
	rows: ParsedRow[];
	skippedRows: number;
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

function normaliseHeaders(line: string): string[] {
	return line
		.split(",")
		.map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
}

export function detectFormat(csvText: string): WealthsimpleFormat | null {
	const firstLine = csvText.split("\n")[0];
	if (!firstLine) return null;
	const headers = normaliseHeaders(firstLine);

	if (headers.includes("transaction_date") && headers.includes("details")) {
		return "wealthsimple-credit";
	}
	if (
		headers.includes("date") &&
		headers.includes("description") &&
		headers.includes("balance")
	) {
		return "wealthsimple-account";
	}
	return null;
}

// ---------------------------------------------------------------------------
// CSV line parser (handles quoted fields with commas)
// ---------------------------------------------------------------------------

function parseCSVLine(line: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			// Handle escaped quotes ("") inside quoted fields
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (ch === "," && !inQuotes) {
			fields.push(current);
			current = "";
		} else {
			current += ch;
		}
	}
	fields.push(current);
	return fields.map((f) => f.trim());
}

function parseAllLines(csvText: string): string[][] {
	return csvText
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.map(parseCSVLine);
}

// ---------------------------------------------------------------------------
// Wealthsimple account (checking / debit)
// Headers: date, transaction, description, amount, balance, currency
// ---------------------------------------------------------------------------

function parseWealthsimpleAccount(csvText: string): ParseResult {
	const lines = parseAllLines(csvText);
	const rows: ParsedRow[] = [];
	let skippedRows = 0;

	// Skip header row (index 0)
	for (let i = 1; i < lines.length; i++) {
		const cols = lines[i];
		// Expected: date[0], transaction[1], description[2], amount[3], balance[4], currency[5]
		if (cols.length < 6) {
			skippedRows++;
			continue;
		}

		const date = cols[0];
		const description = cols[2];
		const rawAmount = Number.parseFloat(cols[3]);
		const currency = cols[5] || "CAD";

		if (!date || !description || Number.isNaN(rawAmount)) {
			skippedRows++;
			continue;
		}

		rows.push({
			date,
			description,
			amount: Math.abs(rawAmount),
			type: rawAmount >= 0 ? "income" : "expense",
			currency,
			rowIndex: i,
		});
	}

	return { format: "wealthsimple-account", rows, skippedRows };
}

// ---------------------------------------------------------------------------
// Wealthsimple credit card
// Headers: transaction_date, post_date, type, details, amount, currency
// Purchases (positive) → expense; Payments (negative) → skip
// ---------------------------------------------------------------------------

function parseWealthsimpleCredit(csvText: string): ParseResult {
	const lines = parseAllLines(csvText);
	const rows: ParsedRow[] = [];
	let skippedRows = 0;

	// Skip header row (index 0)
	for (let i = 1; i < lines.length; i++) {
		const cols = lines[i];
		// Expected: transaction_date[0], post_date[1], type[2], details[3], amount[4], currency[5]
		if (cols.length < 6) {
			skippedRows++;
			continue;
		}

		const date = cols[0];
		const txType = cols[2].toLowerCase(); // "purchase", "payment", etc.
		const description = cols[3];
		const rawAmount = Number.parseFloat(cols[4]);
		const currency = cols[5] || "CAD";

		if (!date || !description || Number.isNaN(rawAmount)) {
			skippedRows++;
			continue;
		}

		// Skip payments (negative amounts / payment type) — they are card payoffs, not transactions
		if (txType === "payment" || rawAmount < 0) {
			skippedRows++;
			continue;
		}

		rows.push({
			date,
			description,
			amount: rawAmount,
			type: "expense",
			currency,
			rowIndex: i,
		});
	}

	return { format: "wealthsimple-credit", rows, skippedRows };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function parseWealthsimpleCSV(csvText: string): ParseResult | null {
	const format = detectFormat(csvText);
	if (!format) return null;

	if (format === "wealthsimple-credit") {
		return parseWealthsimpleCredit(csvText);
	}
	return parseWealthsimpleAccount(csvText);
}
