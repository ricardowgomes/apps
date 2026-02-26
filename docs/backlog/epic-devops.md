# Epic: DevOps & CI/CD

- **Status**: Backlog
- **Priority**: High

## Goal

Establish automated quality gates so every push to GitHub triggers linting, type-checking, and tests. Prevents regressions from landing on `main` and gives confidence when merging PRs.

## Scope

**In:**
- GitHub Actions workflow that runs on every push and pull request
- Steps: Biome check, TypeScript (`tsc --noEmit`), Vitest, Knip
- Fast feedback — cache `node_modules` / pnpm store to keep runs short

**Out:**
- Deployment pipeline (Cloudflare deploy stays manual via `pnpm deploy` for now)
- Matrix builds across multiple Node versions (single Node 20 is fine)

## Tasks

- [ ] (S) Create `.github/workflows/ci.yml` — runs `pnpm check`, `tsc --noEmit`, `pnpm test`, and `npm run knip` on every push and PR; caches pnpm store

## Done When

- [ ] Every push to any branch triggers the workflow in GitHub Actions
- [ ] A failing lint/type/test/knip step blocks the workflow with a clear error
- [ ] The workflow completes in under 3 minutes on a warm cache
