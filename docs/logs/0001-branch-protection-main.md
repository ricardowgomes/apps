# Branch Protection: Block Merge on Failing CI

**Date:** 2026-04-09
**Issue:** #26

## What was done

Configured GitHub branch protection rules on `main` to block merges when the CI pipeline is failing.

**Required status check:** `Lint, Type-check, Test, Dead Code`

This check covers:
- Biome lint + format
- TypeScript strict type-check
- Vitest unit + integration tests
- Knip dead code detection

## What is intentionally NOT blocked

- **Playwright E2E** (`Playwright E2E (non-blocking)`) — remains advisory only. The CI workflow already marks this job with `continue-on-error: true` because E2E tests require a stable deployed environment. Revisit when a staging environment exists.
- **Cloudflare deploy** — only runs on `main` pushes, not on PRs.

## How to re-apply

Branch protection rules live in GitHub settings, not in the repo. To recreate:

```bash
gh api \
  --method PUT \
  repos/ricardowgomes/apps/branches/main/protection \
  --field 'required_status_checks[strict]=false' \
  --field 'required_status_checks[contexts][]=Lint, Type-check, Test, Dead Code' \
  --field 'enforce_admins=false' \
  --field 'required_pull_request_reviews=null' \
  --field 'restrictions=null'
```
