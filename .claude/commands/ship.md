# /ship — Merge Feature to Main

Gate-check the current feature branch and merge it into `main` if all quality conditions are met.

## Pre-flight

1. Run `git branch --show-current` and capture the branch name as `$BRANCH`.
2. If `$BRANCH` is `main` or `master`, abort immediately: "Cannot ship from main."

---

## Gate 1 — Unit & Integration Test Coverage ≥ 95%

Run:
```bash
npm run test:coverage
```

Then read `coverage/coverage-summary.json`. Inspect the `total` key:
```json
{ "total": { "lines": { "pct": ... }, "statements": { "pct": ... }, "branches": { "pct": ... }, "functions": { "pct": ... } } }
```

**All four metrics must be ≥ 95%.** If any are below threshold:
- Print a coverage table showing each metric and its actual value.
- List which source files have the lowest coverage.
- **Abort.** Do not proceed to the next gate.

---

## Gate 2 — E2E Tests Exist for Every Changed Domain

Run:
```bash
git diff main...HEAD --name-only
```

From the changed file paths, identify every **domain** touched. A domain is the first path segment under `src/` for domain code (e.g. `src/finance/...` → domain `finance`), or the route segment for route files (e.g. `src/routes/finance/...` → domain `finance`). Ignore changes to config files, `src/paraglide/`, `src/routeTree.gen.ts`, and `tests/`.

For each identified domain, check whether at least one `*.spec.ts` file exists under `tests/e2e/{domain}/`.

If any domain is missing E2E tests:
- List the domains and what files were changed.
- **Abort.** Do not proceed.

---

## Gate 3 — Lint, Types, and Dead Code Pass

Run the following in sequence and collect all failures before aborting:
```bash
npm run check     # Biome lint + format
npx tsc --noEmit  # TypeScript
npm run knip      # Dead code
```

If any command exits non-zero:
- Print the full output for every failure.
- **Abort.** Do not proceed.

---

## Merge to Main

All gates passed. Execute:
```bash
git checkout main
git pull origin main
git merge --no-ff $BRANCH -m "chore: merge $BRANCH into main"
git push origin main
```

After push, confirm by running `git log --oneline -5` and printing the result.

Report: "Shipped. $BRANCH merged into main."

---

## Summary of Gates

| # | Gate | Threshold |
|---|------|-----------|
| 1 | Unit/integration coverage | All metrics ≥ 95% |
| 2 | E2E tests exist per domain | At least one spec per touched domain |
| 3 | Lint + types + dead code | All checks pass |

> **Note:** E2E execution (`pw:run`) is intentionally omitted from `/ship` to keep the cycle fast.
> It remains a required gate before deploying to production.
