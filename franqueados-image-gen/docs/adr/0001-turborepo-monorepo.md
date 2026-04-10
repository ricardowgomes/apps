# ADR-0001: Turborepo as Monorepo Tool

- **Date**: 2026-04-10
- **Status**: Accepted

## Context

The project has two distinct deployment targets — a React SPA (Cloudflare Pages) and a Cloudflare Worker (API) — plus shared code (types, UI components, config). Managing these as separate repositories creates friction: shared types diverge, configs duplicate, and running the full stack locally requires manually starting multiple processes.

A monorepo keeps all code in one place and lets the AI (Claude) reason about the entire system in a single session. The tooling choice must be lightweight enough for a single-developer project and compatible with the Cloudflare deployment pipeline.

## Decision

Use **Turborepo** as the monorepo orchestration layer with **pnpm workspaces**.

Workspace layout:
```
apps/web        # React SPA (Cloudflare Pages)
apps/api        # Cloudflare Workers backend
packages/types  # Shared API contract types
packages/ui     # Shared React components
packages/config # Shared Biome, TypeScript, Vitest configs
```

Turborepo handles:
- Parallel `dev`, `build`, `test`, `check` across all packages
- Build caching (avoids rebuilding unchanged packages)
- Dependency-aware pipeline ordering (`api` builds after `types`, etc.)

## Consequences

### Positive
- Single `pnpm dev` starts the full stack (frontend + worker)
- Shared types in `packages/types` are the single source of truth for API contracts
- Claude can read and modify frontend and backend in the same session without context switching
- Turborepo's remote cache speeds up CI builds (optional, free for open source)
- `pnpm --filter <app> <command>` scopes commands to a single app when needed

### Negative / Trade-offs
- Slightly more complex initial scaffold than a single-app repo
- pnpm workspace hoisting can occasionally cause subtle dependency resolution issues
- Cloudflare Workers deploy must be run from `apps/api` with `wrangler`, not from root

### Neutral
- Each `apps/*` package has its own `wrangler.jsonc` or `vite.config.ts`
- `turbo.json` at root defines the pipeline; each package's `package.json` defines its scripts

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Separate repositories | No shared code; types drift; harder for Claude to reason about the full system |
| Nx | More opinionated and heavier; Turborepo is simpler and sufficient |
| Single app (no monorepo) | Frontend and Worker in the same build would couple deploy targets and complicate Cloudflare setup |
| npm workspaces (no Turborepo) | No task caching or pipeline orchestration — just workspace linking |
