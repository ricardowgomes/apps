CREATE TABLE portfolio_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('investment', 'debt')),
  name TEXT NOT NULL,
  monthly_amount REAL,          -- monthly contribution (investments) or payment (debts); NULL = N/A
  interest_rate REAL,           -- percentage, e.g. 3.99 means 3.99%; NULL = N/A
  total_amount REAL NOT NULL,   -- current balance
  currency TEXT NOT NULL DEFAULT 'CAD',
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
