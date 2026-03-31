import type { Transaction, TransactionInput } from "../domain/transaction";

export interface InsertManyResult {
	inserted: number;
	duplicates: number;
}

interface D1TransactionRow {
	id: string;
	type: "income" | "expense";
	amount: number;
	currency: string;
	category: string;
	description: string;
	date: string;
	created_at: string;
}

function rowToTransaction(row: D1TransactionRow): Transaction {
	return {
		id: row.id,
		type: row.type,
		amount: row.amount,
		currency: row.currency,
		category: row.category,
		description: row.description,
		date: row.date,
		createdAt: row.created_at,
	};
}

export async function getAll(db: D1Database): Promise<Transaction[]> {
	const result = await db
		.prepare("SELECT * FROM transactions ORDER BY date DESC, created_at DESC")
		.all<D1TransactionRow>();
	return result.results.map(rowToTransaction);
}

export async function insert(db: D1Database, tx: Transaction): Promise<void> {
	await db
		.prepare(
			`INSERT INTO transactions (id, type, amount, currency, category, description, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			tx.id,
			tx.type,
			tx.amount,
			tx.currency,
			tx.category,
			tx.description,
			tx.date,
			tx.createdAt,
		)
		.run();
}

export async function update(
	db: D1Database,
	id: string,
	data: TransactionInput,
): Promise<void> {
	await db
		.prepare(
			`UPDATE transactions SET type=?, amount=?, currency=?, category=?, description=?, date=? WHERE id=?`,
		)
		.bind(
			data.type,
			data.amount,
			data.currency,
			data.category,
			data.description,
			data.date,
			id,
		)
		.run();
}

export async function remove(db: D1Database, id: string): Promise<void> {
	await db.prepare("DELETE FROM transactions WHERE id = ?").bind(id).run();
}

/** Returns the set of (date|amount|description) signatures already in the DB. */
export async function getDuplicateSignatures(
	db: D1Database,
	candidates: Array<{ date: string; amount: number; description: string }>,
): Promise<Set<string>> {
	if (candidates.length === 0) return new Set();

	const signatures = candidates.map(
		(c) => `${c.date}|${c.amount}|${c.description}`,
	);

	// Fetch rows that match any candidate — SQLite has no array parameter, so
	// we pull all transactions and filter in JS (import batches are small).
	const result = await db
		.prepare("SELECT date, amount, description FROM transactions")
		.all<{ date: string; amount: number; description: string }>();

	const existing = new Set(
		result.results.map((r) => `${r.date}|${r.amount}|${r.description}`),
	);

	return new Set(signatures.filter((s) => existing.has(s)));
}

export async function insertMany(
	db: D1Database,
	transactions: Transaction[],
): Promise<InsertManyResult> {
	if (transactions.length === 0) return { inserted: 0, duplicates: 0 };

	const sigs = await getDuplicateSignatures(db, transactions);

	const toInsert = transactions.filter(
		(tx) => !sigs.has(`${tx.date}|${tx.amount}|${tx.description}`),
	);
	const duplicates = transactions.length - toInsert.length;

	// D1 batch insert
	const stmts = toInsert.map((tx) =>
		db
			.prepare(
				`INSERT INTO transactions (id, type, amount, currency, category, description, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				tx.id,
				tx.type,
				tx.amount,
				tx.currency,
				tx.category,
				tx.description,
				tx.date,
				tx.createdAt,
			),
	);

	if (stmts.length > 0) {
		await db.batch(stmts);
	}

	return { inserted: toInsert.length, duplicates };
}
