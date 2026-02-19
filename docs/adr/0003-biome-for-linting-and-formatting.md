# ADR-0003: Biome for Linting and Formatting

- **Date**: 2026-02-18
- **Status**: Accepted

## Context

The project needs consistent code style enforcement and static analysis. The traditional choice is ESLint + Prettier, but this combination requires significant configuration, has overlap between the two tools, and can be slow on large codebases.

## Decision

Use **Biome** as the single tool for both linting and formatting, replacing ESLint and Prettier.

## Consequences

### Positive
- Single tool, single config (`biome.json`) for both formatting and linting
- Significantly faster than ESLint + Prettier (written in Rust)
- Opinionated defaults reduce bikeshedding
- `pnpm check` runs all checks; `pnpm format` and `pnpm lint` are available separately

### Negative / Trade-offs
- Biome does not have 100% ESLint rule coverage — some niche rules may be unavailable
- Smaller plugin ecosystem than ESLint
- Team members familiar with ESLint must learn Biome's configuration model

### Neutral
- Config: double quotes, tab indentation, recommended rules
- Auto-generated files (`routeTree.gen.ts`, `styles.css`) are excluded from Biome checks
- Organise imports is enabled

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| ESLint + Prettier | More configuration, slower, two tools to maintain |
| oxlint | Linting only — still needs Prettier for formatting |
