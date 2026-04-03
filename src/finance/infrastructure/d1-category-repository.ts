import type { Category, CategoryInput } from "../domain/category";

interface D1CategoryRow {
	id: string;
	name: string;
	icon: string;
	color: string;
	keywords: string; // JSON string
	created_at: string;
}

function rowToCategory(row: D1CategoryRow): Category {
	return {
		id: row.id,
		name: row.name,
		icon: row.icon,
		color: row.color,
		keywords: JSON.parse(row.keywords) as string[],
		createdAt: row.created_at,
	};
}

export async function getAllCategories(db: D1Database): Promise<Category[]> {
	const result = await db
		.prepare("SELECT * FROM categories ORDER BY name ASC")
		.all<D1CategoryRow>();
	return result.results.map(rowToCategory);
}

export async function insertCategory(
	db: D1Database,
	cat: Category,
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO categories (id, name, icon, color, keywords, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			cat.id,
			cat.name,
			cat.icon,
			cat.color,
			JSON.stringify(cat.keywords),
			cat.createdAt,
		)
		.run();
}

export async function updateCategory(
	db: D1Database,
	id: string,
	data: CategoryInput,
): Promise<void> {
	await db
		.prepare(
			`UPDATE categories SET name=?, icon=?, color=?, keywords=? WHERE id=?`,
		)
		.bind(data.name, data.icon, data.color, JSON.stringify(data.keywords), id)
		.run();
}

export async function deleteCategory(
	db: D1Database,
	id: string,
): Promise<void> {
	await db.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
}
