import type {
	PortfolioEntry,
	PortfolioEntryInput,
} from "../domain/portfolio-entry";

interface D1PortfolioRow {
	id: string;
	type: "investment" | "debt";
	name: string;
	monthly_amount: number | null;
	interest_rate: number | null;
	total_amount: number;
	currency: string;
	updated_at: string;
	created_at: string;
}

function rowToEntry(row: D1PortfolioRow): PortfolioEntry {
	return {
		id: row.id,
		type: row.type,
		name: row.name,
		monthly_amount: row.monthly_amount,
		interest_rate: row.interest_rate,
		total_amount: row.total_amount,
		currency: row.currency,
		updatedAt: row.updated_at,
		createdAt: row.created_at,
	};
}

export async function getAll(db: D1Database): Promise<PortfolioEntry[]> {
	const result = await db
		.prepare("SELECT * FROM portfolio_entries ORDER BY type ASC, name ASC")
		.all<D1PortfolioRow>();
	return result.results.map(rowToEntry);
}

export async function insert(
	db: D1Database,
	entry: PortfolioEntry,
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO portfolio_entries
         (id, type, name, monthly_amount, interest_rate, total_amount, currency, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			entry.id,
			entry.type,
			entry.name,
			entry.monthly_amount,
			entry.interest_rate,
			entry.total_amount,
			entry.currency,
			entry.updatedAt,
			entry.createdAt,
		)
		.run();
}

export async function update(
	db: D1Database,
	id: string,
	data: PortfolioEntryInput,
): Promise<void> {
	const now = new Date().toISOString();
	await db
		.prepare(
			`UPDATE portfolio_entries
       SET type=?, name=?, monthly_amount=?, interest_rate=?, total_amount=?, currency=?, updated_at=?
       WHERE id=?`,
		)
		.bind(
			data.type,
			data.name,
			data.monthly_amount,
			data.interest_rate,
			data.total_amount,
			data.currency,
			now,
			id,
		)
		.run();
}

export async function remove(db: D1Database, id: string): Promise<void> {
	await db.prepare("DELETE FROM portfolio_entries WHERE id = ?").bind(id).run();
}
