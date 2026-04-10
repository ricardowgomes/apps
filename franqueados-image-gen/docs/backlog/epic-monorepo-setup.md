# Epic: Monorepo Scaffold

- **Status**: Backlog
- **Priority**: High
- **Estimated size**: M

## Goal

Bootstrap the Turborepo monorepo with the two apps (`web`, `api`) and three shared packages (`types`, `ui`, `config`). This is the foundation — nothing else can be built until the scaffold exists, CI runs, and the dev server starts cleanly.

## Scope

### In
- Turborepo + pnpm workspaces setup
- `apps/web`: Vite + React + TypeScript (Cloudflare Pages target)
- `apps/api`: Hono (or plain Workers fetch handler) + TypeScript (Cloudflare Workers target)
- `packages/types`: Empty package with shared type exports
- `packages/ui`: Empty package with one example shadcn/ui component
- `packages/config`: Shared `biome.json`, `tsconfig.base.json`, `vitest.base.ts`
- Root `turbo.json` with `dev`, `build`, `test`, `check` pipelines
- Root `biome.json` applying to all workspaces
- `wrangler.jsonc` for `apps/api` with D1 and R2 bindings declared (empty, not yet provisioned)
- One smoke-test (integration) per app: "page renders" for web, "health endpoint returns 200" for api
- One Playwright E2E: "home page loads"
- GitHub Actions CI: install → build → test → check → tsc on every push

### Out
- Any feature code (image generation, brand context, auth)
- Actual D1/R2 provisioning (Cloudflare dashboard step, not code)
- Deployment to Cloudflare (next epic)

## Tasks

- [ ] (S) Initialise pnpm workspace with `pnpm-workspace.yaml`
- [ ] (S) Create `turbo.json` with `dev`, `build`, `test`, `check` pipeline
- [ ] (S) Scaffold `packages/config` with `biome.json`, `tsconfig.base.json`, `vitest.base.ts`
- [ ] (M) Scaffold `apps/web` with Vite + React + TypeScript, extend shared configs
- [ ] (M) Scaffold `apps/api` with Hono + Cloudflare Workers + `wrangler.jsonc`
- [ ] (S) Scaffold `packages/types` with one example shared type
- [ ] (S) Scaffold `packages/ui` with one shadcn/ui Button component
- [ ] (S) Wire `apps/web` and `apps/api` to import from `@franqueados/types`
- [ ] (S) Add smoke integration test for `apps/web` (home page renders)
- [ ] (S) Add smoke integration test for `apps/api` (GET /health → 200)
- [ ] (S) Add one Playwright E2E test (home page loads, title visible)
- [ ] (S) Add GitHub Actions CI workflow
- [ ] (XS) Verify `pnpm dev` starts both apps without errors
- [ ] (XS) Verify all ship gates pass: `pnpm test`, `pnpm check`, `pnpm tsc`, `pnpm knip`

## Done When

- `pnpm dev` starts frontend on port 5173 and API on port 8787 simultaneously
- `pnpm test` runs and passes all Vitest tests (smoke tests included)
- `pnpm check` passes with no Biome errors
- `pnpm tsc` passes with TypeScript strict mode on all packages
- Playwright smoke test passes (`pnpm pw:run`)
- GitHub Actions CI passes on the feature branch
