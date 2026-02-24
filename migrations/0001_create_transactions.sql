CREATE TABLE IF NOT EXISTS transactions (
	id TEXT PRIMARY KEY,
	type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
	amount REAL NOT NULL,
	currency TEXT NOT NULL DEFAULT 'CAD',
	category TEXT NOT NULL,
	description TEXT NOT NULL,
	date TEXT NOT NULL,
	created_at TEXT NOT NULL
);
