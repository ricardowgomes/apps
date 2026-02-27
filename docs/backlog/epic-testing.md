# Epic: Automated Testing

- **Status**: In Progress
- **Priority**: High

## Goal

Establish full Playwright E2E test coverage for all existing production features (Finance tracker + Auth). Every future feature must ship with a corresponding Playwright test. This epic moves the project from its current partial unit/integration coverage to a fully automated test suite that exercises real user flows against a running server.

## Scope

**In:**
- Playwright installation and configuration against the local Wrangler dev server
- Auth stub / test session seeding so tests can bypass real Google OAuth
- E2E tests for the Auth flow (unauthenticated redirect, login page)
- E2E tests for all Finance tracker features (load, add, delete, filter, search, summary cards)
- CI integration — run Playwright as part of the automated pipeline

**Out:**
- Tests for demo/scaffold routes (`/demo/*`)
- Visual regression testing
- Unit test gap-filling (Vitest unit tests already exist for domain logic)
- Coverage enforcement via Playwright (use Vitest for coverage reports)

## Stories

| Story | Size | Status | Description |
|---|---|---|---|
| [testing-01-cypress-setup](stories/testing-01-cypress-setup.md) | S | Done | Install Playwright, configure baseUrl, add pw:open/pw:run scripts |
| [testing-02-auth-stub](stories/testing-02-auth-stub.md) | M | Done | `loginAsTestUser()` helper — bypasses Google OAuth via D1 session seed |
| [testing-03-auth-e2e](stories/testing-03-auth-e2e.md) | S | Done | Auth E2E tests: unauthenticated redirect + login page render |
| [testing-04-finance-e2e](stories/testing-04-finance-e2e.md) | M | Backlog | Finance E2E tests: load, add, delete, filter, search, summary cards |
| [testing-05-ci-integration](stories/testing-05-ci-integration.md) | S | Backlog | Add pw:run step to GitHub Actions; start Wrangler dev server in CI |

## Done When

- [ ] `npm run pw:run` completes with zero failures against a local Wrangler dev server
- [ ] All stories above are Done
- [ ] GitHub Actions CI runs `pw:run` and the workflow passes
- [ ] `docs/architecture.md` and `CLAUDE.md` reflect the Playwright requirement for new features
