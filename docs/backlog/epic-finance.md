# Epic: Finance Tracker

- **Status**: In Progress
- **Priority**: High

## Goal

A private family finance application at `/finance/` for tracking income and expenses. Built for real daily use by Ricardo and family — not a demo. Needs auth, useful views, and enough transaction management to replace a spreadsheet.

## Scope

**In:**
- Authentication — gate `/finance/*` to logged-in users only
- Transaction management — add, edit, delete
- Filtering — by month, type (income/expense), and category
- Dashboard charts — category breakdown, monthly trend
- CSV import from Canadian banks (BMO, RBC, TD)

**Out:**
- Bank API / Open Banking integration
- Investment tracking
- Multi-currency conversion (CAD is the primary currency for now)
- Budgeting and goals (separate epic when the time comes)

## Completed

- [x] Add income / expense transaction (bottom sheet, TanStack Form)
- [x] Display transactions grouped by date
- [x] Search by description or category
- [x] Filter by type (All / Income / Expenses)
- [x] Summary cards (balance, total income, total expenses)
- [x] Finance-aware BottomNav
- [x] Cloudflare D1 persistence (migrations/0001_create_transactions.sql)
- [x] Server functions via createServerFn (get / create / delete)
- [x] Google OAuth authentication (shared auth domain — sessions in D1)

## Tasks

### Auth
- [x] (S) Gate `/finance/*` routes — add `beforeLoad` check for `context.user`, redirect to `/login` if null; verify the existing Google OAuth session works end-to-end on the finance route

### Transaction Management
- [x] (S) Delete transaction — wire `useRemoveTransaction()` to the trash icon on each row; the trash icon is already rendered, the delete hook is already wired up via `onDelete`
- [x] (M) Edit transaction — open the add-transaction sheet pre-filled with existing values; reuse the existing form; add `updateTransactionFn` server fn + D1 `UPDATE` in the repository

### Filtering & Views
- [ ] (S) Month picker — add a month selector to the filters bar; pass the selected month to the query; default to the current month; update summary cards to reflect the filtered month
- [ ] (S) Sort order toggle — newest first / oldest first, client-side, persisted in UI store

### Dashboard & Charts
- [ ] (M) Category breakdown chart — pie or horizontal bar showing spend by category for the selected month; use recharts; show on the finance index page below the summary cards
- [ ] (M) Monthly trend chart — last 6 months income vs. expenses; bar or line chart; recharts

### Import
- [ ] (L) CSV import — file upload UI → column mapping → row preview → bulk insert; support BMO / RBC / TD formats + a generic fallback; duplicate detection by (date, amount, description)

### Technical
- [ ] (S) Error boundaries — wrap async D1 queries with proper error UI (ErrorBoundary + Suspense fallback) so a failed fetch doesn't blank the page

## Done When

- [ ] `/finance/*` requires a valid session — unauthenticated users are redirected to `/login`
- [ ] Transactions can be added, edited, and deleted
- [ ] Month picker is the default view (not all-time)
- [ ] At least one chart shows category breakdown for the selected month
- [ ] All tests pass (`npm run test`)
- [ ] Biome, TypeScript, and Knip checks pass
