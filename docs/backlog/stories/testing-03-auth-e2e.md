# Story: Auth E2E Tests

- **Epic**: [Automated Testing](../epic-testing.md)
- **Status**: Backlog
- **Size**: S
- **Priority**: High
- **Depends on**: [testing-02-auth-stub.md](testing-02-auth-stub.md)

## Goal

Cover the two core auth user flows with Cypress E2E tests: unauthenticated users are redirected to `/login`, and the login page renders the expected UI.

## Acceptance Criteria

- `cypress/e2e/auth/auth.cy.ts` exists with at least two specs
- The redirect spec verifies that a fresh browser session visiting `/finance` lands on `/login`
- The login page spec verifies the "Sign in with Google" button is visible on `/login`
- Both specs pass against a running local Wrangler dev server

## Tasks

- [ ] Create `cypress/e2e/auth/auth.cy.ts`
- [ ] Spec: unauthenticated redirect — visit `/finance` with no cookie, assert `cy.url()` contains `/login`
- [ ] Spec: login page render — visit `/login`, assert the "Sign in with Google" button is visible

## Done When

- [ ] Both specs pass in `npm run cy:run`
- [ ] No flakiness on three consecutive runs
- [ ] Changes committed on a feature branch
