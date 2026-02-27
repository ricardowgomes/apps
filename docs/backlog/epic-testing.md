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

## Stories

| Story | Size | Status | Description |
|---|---|---|---|
| [testing-01-cypress-setup](stories/testing-01-cypress-setup.md) | S | Backlog | Install Cypress, configure baseUrl, add cy:open/cy:run scripts |
| [testing-02-auth-stub](stories/testing-02-auth-stub.md) | M | Backlog | `cy.loginAsTestUser()` command — bypasses Google OAuth via D1 session seed |
| [testing-03-auth-e2e](stories/testing-03-auth-e2e.md) | S | Backlog | Auth E2E tests: unauthenticated redirect + login page render |
| [testing-04-finance-e2e](stories/testing-04-finance-e2e.md) | M | Backlog | Finance E2E tests: load, add, delete, filter, search, summary cards |
| [testing-05-ci-integration](stories/testing-05-ci-integration.md) | S | Backlog | Add cy:run step to GitHub Actions; start Wrangler dev server in CI |

## Done When

- [ ] `npm run cy:run` completes with zero failures against a local Wrangler dev server
- [ ] All task checkboxes above are checked
- [ ] GitHub Actions CI runs `cy:run` and the workflow passes
- [ ] `docs/architecture.md` and `CLAUDE.md` reflect the Cypress requirement for new features
