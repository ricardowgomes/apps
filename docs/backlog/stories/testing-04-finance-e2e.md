# Story: Finance E2E Tests

- **Epic**: [Automated Testing](../epic-testing.md)
- **Status**: Done
- **Size**: M
- **Priority**: High
- **Depends on**: [testing-02-auth-stub.md](testing-02-auth-stub.md)

## Goal

Full Playwright E2E coverage for every user-facing Finance tracker feature: loading the dashboard, adding and deleting transactions, filtering, searching, and verifying summary card totals.

## Acceptance Criteria

- `tests/e2e/finance/finance.spec.ts` exists with one spec per feature
- All specs call `loginAsTestUser(page)` in `beforeEach`
- Each spec is isolated — it seeds the data it needs and cleans up after itself (or uses a dedicated test D1 database)
- All specs pass against a running local Wrangler dev server

## Specs

| Spec | What it verifies |
|---|---|
| Finance page loads | `/finance` renders summary cards and the transaction list |
| Add income | Open sheet → fill income fields → submit → new row visible, income total increases |
| Add expense | Same flow for expense → expense total increases, balance decreases |
| Delete transaction | Click delete on a row → row removed, totals update |
| Filter: income | Click "Income" toggle → only income rows visible |
| Filter: expense | Click "Expenses" toggle → only expense rows visible |
| Search | Type in search box → only matching rows visible |
| Summary cards | Balance = income − expense; cards match visible transaction sums |

## Tasks

- [x] Decide on test-data strategy: seed transactions via the test API endpoint or via the UI in each spec (prefer API seed for speed)
- [x] Create `tests/e2e/finance/finance.spec.ts`
- [x] Implement spec: Finance page loads
- [x] Implement spec: Add income transaction
- [x] Implement spec: Add expense transaction
- [x] Implement spec: Delete transaction
- [x] Implement spec: Filter by income
- [x] Implement spec: Filter by expense
- [x] Implement spec: Search by description
- [x] Implement spec: Summary cards match transaction sums
- [x] Verify teardown: each spec leaves the DB in a clean state for the next

## Done When

- [x] All 8 specs pass in `npm run pw:run`
- [x] No flakiness on three consecutive runs
- [x] `npm run test` (Vitest) still passes — no regressions
- [x] Changes committed on a feature branch
