# Story: Auth Test Stub

- **Epic**: [Automated Testing](../epic-testing.md)
- **Status**: Done
- **Size**: M
- **Priority**: High — required by Auth E2E and Finance E2E stories
- **Depends on**: [testing-01-cypress-setup.md](testing-01-cypress-setup.md)

## Goal

Create a `loginAsTestUser()` helper that authenticates a test user without going through real Google OAuth. All E2E tests for protected routes call this helper in their setup.

## Context

The app uses Google OAuth (arctic) + Cloudflare D1 sessions. The stub works by calling a test-only API endpoint (`GET /api/test/login`) that inserts a fake session row into the local D1 database, then sets the `session_id` cookie to that row's ID.

Originally implemented as a Cypress custom command (`cy.loginAsTestUser()`); migrated to a Playwright helper function (`loginAsTestUser(page)`) in `tests/e2e/helpers.ts` when the project switched from Cypress to Playwright (see [ADR-0010](../../adr/0010-playwright-over-cypress.md)).

## Acceptance Criteria

- `loginAsTestUser(page)` is defined in `tests/e2e/helpers.ts`
- Calling the helper results in a valid `session_id` cookie being set for `localhost`
- After the helper runs, navigating to `/finance` renders the finance dashboard (not `/login`)
- The test session uses a fixed test user (`test@example.com`) that is in `ALLOWED_EMAILS`
- No real Google credentials are needed to run the suite
- The stub endpoint (`/api/test/login`) is gated to local dev — not deployable to production

## Done When

- [x] `loginAsTestUser(page)` is callable in any Playwright spec
- [x] The smoke test (`tests/e2e/auth/login-stub.spec.ts`) passes against a running local Wrangler dev server
- [x] The test endpoint is not reachable in a production build
- [x] `npm run check` and `npx tsc --noEmit` pass
- [x] Changes committed on a feature branch
