# Finance App — Plan

## Status: MVP Shipped — In Progress

See [docs/projects/finance-mvp.md](../projects/finance-mvp.md) for the implementation log and what was built.

---

## Vision

A private family finance application to track expenses, income, budgets, and financial goals. Built as a sub-application within `exponencial`, accessible only to authenticated family members.

---

## MVP (Done ✅)

Shipped in commit `f4e9197` — in-memory state, no auth, no DB.

- [x] Add income or expense transaction (bottom sheet with TanStack Form)
- [x] Display transactions (grouped by date, income/expense color-coded)
- [x] Search transactions by description or category
- [x] Filter by type (All / Income / Expenses)
- [x] Summary cards (balance, total income, total expenses)
- [x] Finance-aware BottomNav (Home / Finance / + Add)
- [x] Domain types + Zod validation
- [x] 19 automated tests (domain unit + application integration)

## Persistence (Done ✅)

Shipped 2026-02-23 — Cloudflare D1 replaces in-memory store. See [finance-mvp.md](../projects/finance-mvp.md#iteration-2--cloudflare-d1-persistence) for full details.

- [x] Cloudflare D1 database (`finance`) with `transactions` table
- [x] SQL migration at `migrations/0001_create_transactions.sql`
- [x] D1 repository at `src/finance/infrastructure/d1-transaction-repository.ts`
- [x] Server functions (`createServerFn`) for get / create / delete
- [x] Custom Worker entry `src/server.ts` — bridges Cloudflare `env` into TanStack Start context
- [x] Route loader pre-populates React Query cache (`queryClient.ensureQueryData`)
- [x] Hooks rewritten: `useSuspenseQuery` + `useMutation` (was: TanStack Store)

---

## Backlog

### Next Priority: Authentication

- [ ] Gate `/finance/*` routes — options:
  - **Cloudflare Access** (zero-code, org-level; good for personal use)
  - **Clerk** (full auth UI + session management; better for family multi-user)
  - Simple token-based (header check in a middleware route)
- [ ] Multi-user: family members with separate logins (single-user OK for now)

### Filtering & Views

- [ ] **Month picker** — filter transactions to a single month (most common view)
- [ ] **Date range filter** — custom from/to dates
- [ ] **Category filter** — multi-select categories
- [ ] Sort order toggle (newest first / oldest first)

### Dashboard & Charts

- [ ] Monthly summary view (income vs. expenses for a given month)
- [ ] Category breakdown chart (pie or horizontal bar — recharts or chart.js)
- [ ] Savings rate display
- [ ] Monthly trend chart (last 6 months income vs. expenses)

### Transaction Management

- [ ] **Edit transaction** — open a sheet pre-filled with existing values
- [ ] **Delete transaction** (with confirmation)
- [ ] **Recurring transactions** — flag + auto-create on schedule
- [ ] Tags (free-form labels beyond category)

### Import

- [ ] **CSV import** — upload a bank statement and map columns to transaction fields
- [ ] Support common formats (BMO, RBC, TD, generic)
- [ ] Duplicate detection on import

### Budgeting

- [ ] Monthly budget by category
- [ ] Progress bars showing spend vs. budget
- [ ] Alert when approaching/exceeding limit

### Goals

- [ ] Set financial goals (e.g., emergency fund, vacation savings)
- [ ] Track progress over time

### Reports

- [ ] Monthly/yearly summary report
- [ ] Export to CSV or PDF

### Technical Debt / Improvements

- [ ] Upgrade to **Node 22+** → enables jsdom in vitest → enables React component render tests
- [ ] Multi-currency: support BRL + CAD display, date-based USD conversion as follow-up
- [ ] Error boundaries and loading states for async D1 queries

---

## Domain Model

### Implemented

```ts
interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number              // positive float
  currency: string            // "CAD" default
  category: string
  description: string
  date: string                // "YYYY-MM-DD"
  createdAt: string           // ISO timestamp
}
```

### Planned Extensions

```
Category (currently just a string constant — future: entity with color + icon)
  - id
  - name
  - type: 'income' | 'expense'
  - color
  - icon

Budget
  - id
  - categoryId
  - month: YearMonth          // "2026-02"
  - limit: number

Account (future — for multi-account tracking)
  - id
  - name
  - type: 'checking' | 'savings' | 'investment'
  - balance: number
```

---

## Technical Notes

| Concern | Decision |
|---|---|
| **Route prefix** | `/finance/` |
| **Currency** | CAD default; BRL and multi-currency conversion to USD planned |
| **Mobile-first** | Yes |
| **Bank import format** | CSV |
| **Auth** | TBD — Cloudflare Access or Clerk |
| **Database** | Cloudflare D1 — `finance` database, `transactions` table |
| **Charts** | TBD — recharts or chart.js |
| **Bank API integration** | Not now; maybe future |
