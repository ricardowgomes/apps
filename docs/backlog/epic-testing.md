# Epic: Automated Testing

- **Status**: Backlog
- **Priority**: High

## Goal

Establish full Cypress E2E test coverage for all existing production features (Finance tracker + Auth). Every future feature must ship with a corresponding Cypress test. This epic moves the project from its current partial unit/integration coverage to a fully automated test suite that exercises real user flows against a running server.

## Scope

**In:**
- Cypress installation and configuration against the local Wrangler dev server
- Auth stub / test session seeding so tests can bypass real Google OAuth
- E2E tests for the Auth flow (unauthenticated redirect, login page)
- E2E tests for all Finance tracker features (load, add, delete, filter, search, summary cards)
- CI integration — run Cypress as part of the automated pipeline

**Out:**
- Tests for demo/scaffold routes (`/demo/*`)
- Visual regression testing
- Unit test gap-filling (Vitest unit tests already exist for domain logic)
- Coverage enforcement via Cypress (use Vitest for coverage reports)

## Tasks

### Setup
- [ ] (S) Install Cypress — `npx pnpm add -D cypress`; add `cy:open` and `cy:run` scripts to `package.json`; create `cypress.config.ts` pointing `baseUrl` at `http://localhost:3000` (Wrangler local dev)
- [ ] (S) Auth stub — create a `cy.loginAsTestUser()` custom command that seeds a test session directly into the local D1 database (or intercepts the OAuth redirect and sets the session cookie) so protected routes are accessible without a real Google account

### Auth Tests (`cypress/e2e/auth/`)
- [ ] (S) Unauthenticated redirect — visiting `/finance` without a session cookie should redirect to `/login`
- [ ] (S) Login page renders — `/login` shows the "Sign in with Google" button

### Finance Tests (`cypress/e2e/finance/`)
- [ ] (S) Finance page loads — after login, `/finance` renders the dashboard with the summary cards and transaction list
- [ ] (M) Add income transaction — open the add-transaction sheet, fill type=income + amount + category + description + date, submit; verify the new row appears in the list and the income summary card total increases
- [ ] (M) Add expense transaction — same flow for type=expense; verify expense total increases and balance decreases
- [ ] (S) Delete transaction — click the delete icon on an existing row, confirm; verify the row is removed and totals update
- [ ] (S) Filter by income — click the "Income" filter toggle; verify only income rows are visible
- [ ] (S) Filter by expense — click the "Expenses" filter toggle; verify only expense rows are visible
- [ ] (S) Search by description — type a description into the search box; verify only matching rows appear
- [ ] (S) Summary cards — verify the balance, total income, and total expenses values match the sum of visible transactions

### CI Integration
- [ ] (S) Add a `cy:run` step to the GitHub Actions workflow — runs after the build step against a local Wrangler dev server started in the background

## Done When

- [ ] `npm run cy:run` completes with zero failures against a local Wrangler dev server
- [ ] All task checkboxes above are checked
- [ ] GitHub Actions CI runs `cy:run` and the workflow passes
- [ ] `docs/architecture.md` and `CLAUDE.md` reflect the Cypress requirement for new features
