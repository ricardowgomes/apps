# Story: CI Integration

- **Epic**: [Automated Testing](../epic-testing.md)
- **Status**: Backlog
- **Size**: S
- **Priority**: High
- **Depends on**: [testing-04-finance-e2e.md](testing-04-finance-e2e.md)

## Goal

Add a `cy:run` step to the GitHub Actions workflow so the full Cypress suite runs automatically on every push and pull request, blocking merges when tests fail.

## Context

The existing CI workflow (`.github/workflows/`) runs build, typecheck, lint, and Vitest. This story appends a Cypress step that:
1. Starts the Wrangler local dev server in the background
2. Waits for it to be ready
3. Runs `npm run cy:run`
4. Uploads Cypress screenshots/videos as artifacts on failure

The Wrangler dev server needs a local D1 database to exist, so migrations must be applied before the server starts.

## Acceptance Criteria

- The GitHub Actions workflow has a `cypress` job (or step) that runs after the build job
- The job starts `wrangler dev` in the background and waits for `localhost:3000` to respond
- Cypress migrations are applied against the local D1 before the server starts
- `npm run cy:run` exits 0 on a green suite and non-0 on failures
- Cypress screenshots and videos are uploaded as GitHub Actions artifacts when the job fails
- The workflow passes end-to-end on the `main` branch

## Tasks

- [ ] Review the existing GitHub Actions workflow file(s) in `.github/workflows/`
- [ ] Add a step that applies D1 migrations locally: `npx wrangler d1 execute <db> --local --file=migrations/*.sql`
- [ ] Add a step that starts `wrangler dev` in the background and waits for the server to be ready (use `wait-on` or a retry loop)
- [ ] Add the `npm run cy:run` step
- [ ] Configure artifact upload for `cypress/screenshots` and `cypress/videos` on failure
- [ ] Set required secrets/env vars in GitHub Actions (e.g. `ALLOWED_EMAILS` for the test user)
- [ ] Verify the workflow passes on a test branch before merging

## Done When

- [ ] A PR with a green Cypress suite shows a passing CI check
- [ ] A deliberate spec failure causes the CI check to fail and uploads artifacts
- [ ] Changes committed and PR opened
