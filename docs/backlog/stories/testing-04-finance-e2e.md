# Story: Finance E2E Tests

- **Epic**: [Automated Testing](../epic-testing.md)
- **Status**: Backlog
- **Size**: M
- **Priority**: High
- **Depends on**: [testing-02-auth-stub.md](testing-02-auth-stub.md)

## Goal

Full Cypress E2E coverage for every user-facing Finance tracker feature: loading the dashboard, adding and deleting transactions, filtering, searching, and verifying summary card totals.

## Acceptance Criteria

- `cypress/e2e/finance/finance.cy.ts` exists with one spec per feature
- All specs call `cy.loginAsTestUser()` in `beforeEach`
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

- [ ] Decide on test-data strategy: seed transactions via the test API endpoint or via the UI in each spec (prefer API seed for speed)
- [ ] Create `cypress/e2e/finance/finance.cy.ts`
- [ ] Implement spec: Finance page loads
- [ ] Implement spec: Add income transaction
- [ ] Implement spec: Add expense transaction
- [ ] Implement spec: Delete transaction
- [ ] Implement spec: Filter by income
- [ ] Implement spec: Filter by expense
- [ ] Implement spec: Search by description
- [ ] Implement spec: Summary cards match transaction sums
- [ ] Verify teardown: each spec leaves the DB in a clean state for the next

## Done When

- [ ] All 8 specs pass in `npm run cy:run`
- [ ] No flakiness on three consecutive runs
- [ ] `npm run test` (Vitest) still passes — no regressions
- [ ] Changes committed on a feature branch
