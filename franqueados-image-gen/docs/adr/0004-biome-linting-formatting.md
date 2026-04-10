# ADR-0004: Biome for Linting and Formatting

- **Date**: 2026-04-10
- **Status**: Accepted

## Context

A monorepo with multiple apps and packages needs consistent code style enforcement across all packages. The traditional choice is ESLint + Prettier, but in a Turborepo workspace this means configuring and maintaining both tools in each package, with potential version conflicts and slow CI runs.

As an AI-first project, Claude writes most of the code. A single opinionated tool with minimal configuration reduces the surface area Claude needs to reason about, and fast lint cycles mean gates close faster.

## Decision

Use **Biome** as the single tool for both linting and formatting across all apps and packages.

**Config strategy:**
- Root `biome.json` defines shared rules and applies to all files via workspace glob
- Individual packages can extend the root config via `"extends": ["//biome.json"]` if package-specific overrides are needed

**Turborepo integration:**
- `"check"` script in each `package.json` runs `biome check --no-errors-on-unmatched`
- Root `pnpm check` runs via Turborepo pipeline across all packages in parallel

## Consequences

### Positive
- Single config file at the root manages the entire monorepo
- Significantly faster than ESLint + Prettier (Rust-based)
- `pnpm format` auto-fixes formatting across all packages in one command
- Consistent style across frontend and backend without per-package config
- Biome's import organiser removes a common source of noisy diffs

### Negative / Trade-offs
- Biome does not cover 100% of ESLint rules — some specialised rules (React hooks lint, accessibility) may be missing
- Smaller plugin ecosystem than ESLint
- Cloudflare Workers auto-generated files (e.g., type bindings from `wrangler types`) must be excluded from Biome

### Neutral
- Config: double quotes, tab indentation, recommended rule set
- Auto-generated files (`*.gen.ts`, `src/paraglide/`) are excluded via `"ignore"` in `biome.json`
- The `"organizeImports"` feature is enabled — imports are sorted on format

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| ESLint + Prettier | Two tools, more config, slower — unjustified overhead for this project size |
| oxlint | Linting only; still needs Prettier for formatting |
| dprint | Less well-known; smaller community; Biome is rapidly becoming the standard |
