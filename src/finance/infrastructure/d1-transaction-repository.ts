import type { Transaction, TransactionInput } from "../domain/transaction";

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
