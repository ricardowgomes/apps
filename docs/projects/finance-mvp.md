# Finance MVP — Implementation Log

## Status: In Progress — MVP Shipped

**Commit**: `f4e9197`
**Date**: 2026-02-19

---

## What Was Built

The first iteration of the Finance sub-application, accessible at `/finance`. No database or authentication — data lives in-memory (TanStack Store) and is seeded with demo transactions on load.

### Architecture

Follows the project's DDD structure under `src/finance/`:

```
src/finance/
  domain/
    transaction.ts             # Transaction entity, Zod schema, category constants
  application/
    transaction-store.ts       # TanStack Store (in-memory), add/remove actions, seed data
    finance-ui-store.ts        # Global UI state (add-transaction sheet open/closed)
    use-transactions.ts        # Hooks: useTransactions (filter), useSummary, useAddTransaction
    __tests__/
      transaction-store.test.ts
  ui/
    FinancePage.tsx            # Main page layout + wires store → components
    SummaryCards.tsx           # Balance / Income / Expenses summary cards
    TransactionFilters.tsx     # Search input + All/Income/Expenses type pills
    TransactionList.tsx        # Transactions grouped by date (Today / Yesterday / etc.)
    AddTransactionSheet.tsx    # Bottom sheet with TanStack Form
  tests/
    finance-page.test.tsx      # Application-layer integration tests
src/routes/finance/
  index.tsx                    # Route file: /finance/
```

### Features

| Feature | Status |
|---|---|
| Add income transaction | ✅ Done |
| Add expense transaction | ✅ Done |
| Display transaction list (grouped by date) | ✅ Done |
| Search by description or category | ✅ Done |
| Filter by type (All / Income / Expenses) | ✅ Done |
| Summary cards (balance, income, expenses) | ✅ Done |
| Finance-aware BottomNav | ✅ Done |
| In-memory seed data (10 transactions) | ✅ Done |

### Domain Model (Implemented)

```ts
interface Transaction {
  id: string                          // crypto.randomUUID()
  type: "income" | "expense"
  amount: number                      // positive float
  currency: string                    // "CAD" default
  category: string                    // from INCOME_CATEGORIES / EXPENSE_CATEGORIES
  description: string
  date: string                        // "YYYY-MM-DD"
  createdAt: string                   // ISO timestamp
}
```

**Income categories**: Salary, Freelance, Investment, Rental, Other

**Expense categories**: Food & Dining, Housing, Transport, Healthcare, Entertainment, Shopping, Education, Utilities, Other

### Navigation

The global `BottomNav` detects `/finance/*` routes and switches to finance-specific items:
- **← Home** — back to portfolio
- **Finance** — current page indicator
- **+ Add** — opens the add-transaction sheet via `financeUiStore`

The sheet can also be opened from the "Add" button in the page header, making it accessible from the page itself regardless of nav state.

### State Management

Two TanStack Stores:
- `transactionStore` — holds `Transaction[]`, mutations via `addTransaction()` / `removeTransaction()`
- `financeUiStore` — holds `{ addTransactionOpen: boolean }`, actions via `openAddTransaction()` / `closeAddTransaction()`

The global UI store pattern lets both the BottomNav and the page button control the same sheet without prop drilling.

### Tests

**24 tests, all passing** (`npm run test`):

| Suite | Tests |
|---|---|
| `domain/transaction.test.ts` | 8 — schema validation, category constants |
| `application/transaction-store.test.ts` | 4 — add, remove, ordering |
| `finance-page.test.tsx` | 12 — filtering, search, summary math, UI store |

#### Testing Environment Note

`vitest.config.ts` uses `environment: "node"` (not jsdom). jsdom 27 has a chain of ESM-only dependencies (`@exodus/bytes`, `@csstools/css-calc`, etc.) that Node 20 cannot `require()`. The test files `test/shims/` and `test/preload.cjs` partially address this but the cascade is too deep to shim completely.

**To enable React component render tests**: upgrade to Node 22+ (which adds `--experimental-require-module`) and switch vitest config to `environment: "jsdom"`.

---

## What's Next

See [finance-app-implementation.md](../plans/finance-app-implementation.md) for the full backlog.

Prioritised next steps:

1. **Persistence** — Wire up Cloudflare D1 so data survives page reloads. The store/hook layer is already designed as an adapter boundary: swap `transaction-store.ts` for a D1-backed implementation.
2. **Authentication** — Gate `/finance/*` routes. Evaluate Clerk or Cloudflare Access.
3. **Monthly filtering** — Add a month picker to the filters bar so users can view one month at a time rather than all-time.
4. **Charts** — Add a category breakdown chart (pie or bar) to the dashboard.
5. **CSV import** — Let users upload a bank statement CSV and parse it into transactions.
6. **Node 22 upgrade** — Unlocks jsdom-based component render tests.
