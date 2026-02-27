# Story: CI Integration

- **Epic**: [Automated Testing](../epic-testing.md)
- **Status**: Backlog
- **Size**: S
- **Priority**: High
- **Depends on**: [testing-04-finance-e2e.md](testing-04-finance-e2e.md)

## Goal

Add a `pw:run` step to the GitHub Actions workflow so the full Playwright suite runs automatically on every push and pull request, blocking merges when tests fail.

## Context

The existing CI workflow (`.github/workflows/`) runs build, typecheck, lint, and Vitest. This story appends a Playwright step that:
1. Starts the Wrangler local dev server in the background
2. Waits for it to be ready
3. Runs `npm run pw:run`
4. Uploads Playwright traces/screenshots as artifacts on failure

The Wrangler dev server needs a local D1 database to exist, so migrations must be applied before the server starts.

## Acceptance Criteria

- The GitHub Actions workflow has a `playwright` job (or step) that runs after the build job
- The job starts `wrangler dev` in the background and waits for `localhost:3000` to respond
- D1 migrations are applied against the local D1 before the server starts
- `npm run pw:run` exits 0 on a green suite and non-0 on failures
- Playwright trace files are uploaded as GitHub Actions artifacts when the job fails
- The workflow passes end-to-end on the `main` branch

## Tasks

- [ ] Review the existing GitHub Actions workflow file(s) in `.github/workflows/`
- [ ] Add a step that installs Playwright browsers: `npx playwright install --with-deps chromium`
- [ ] Add a step that applies D1 migrations locally
- [ ] Add a step that starts `wrangler dev` in the background and waits for the server to be ready
- [ ] Add the `npm run pw:run` step
- [ ] Configure artifact upload for Playwright traces on failure
- [ ] Set required secrets/env vars in GitHub Actions (e.g. `ALLOWED_EMAILS` for the test user)
- [ ] Verify the workflow passes on a test branch before merging

## Done When

- [ ] A PR with a green Playwright suite shows a passing CI check
- [ ] A deliberate spec failure causes the CI check to fail and uploads artifacts
- [ ] Changes committed and PR opened
