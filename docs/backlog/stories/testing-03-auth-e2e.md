# Story: Auth E2E Tests

- **Epic**: [Automated Testing](../epic-testing.md)
- **Status**: Done
- **Size**: S
- **Priority**: High
- **Depends on**: [testing-02-auth-stub.md](testing-02-auth-stub.md)

## Goal

Cover the two core auth user flows with Playwright E2E tests: unauthenticated users are redirected to `/login`, and the login page renders the expected UI.

## Acceptance Criteria

- `tests/e2e/auth/auth.spec.ts` exists with at least two specs
- The redirect spec verifies that a fresh browser session visiting `/finance` lands on `/login`
- The login page spec verifies the "Sign in with Google" button is visible on `/login`
- Both specs pass against a running local Wrangler dev server

## Tasks

- [x] Create `tests/e2e/auth/auth.spec.ts`
- [x] Spec: unauthenticated redirect — visit `/finance` with no cookies, assert URL contains `/login`
- [x] Spec: login page render — visit `/login`, assert the "Sign in with Google" button is visible

## Done When

- [x] Both specs pass in `npm run pw:run`
- [x] No flakiness on three consecutive runs
- [x] Changes committed on a feature branch
