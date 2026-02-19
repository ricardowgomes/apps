# ADR-0004: Domain-Driven Design as Architectural Principle

- **Date**: 2026-02-18
- **Status**: Accepted

## Context

As the application grows to include multiple sub-applications (Portfolio, Finance, Files), the codebase needs a structural principle to prevent it from becoming a tangled monolith. Technical-layer organisation (components/, hooks/, utils/) breaks down when features span many files and teams work on independent domains.

## Decision

Adopt **Domain-Driven Design (DDD)** as the primary architectural principle. Code is organised around **business domains**, not technical layers.

## Consequences

### Positive
- Features and their related code (domain model, UI, API, tests) live together — easier to navigate and reason about
- Domains can evolve independently; clear ownership boundaries
- Encourages explicit modelling of business concepts (Entities, Value Objects, Domain Events)
- ADRs document significant design decisions, creating a living record of architectural evolution

### Negative / Trade-offs
- Requires upfront domain modelling before coding
- Shared utilities still need a home (use `src/shared/` or `src/lib/`)
- Over-engineering risk on small features — apply pragmatically

### Neutral
- Demo code (scaffolded boilerplate) lives in `demo/` routes and `demo-*` prefixed files; it does not need DDD structure
- New sub-applications should each get a top-level domain folder (e.g., `src/finance/`, `src/files/`)

## Recommended Structure for a Domain

```
src/{domain}/
  domain/         # Entities, Value Objects, domain logic (pure, no framework deps)
  application/    # Use cases, command/query handlers
  infrastructure/ # DB adapters, external API clients
  ui/             # React components, hooks, routes specific to this domain
  tests/          # Integration and unit tests for this domain
```

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Feature folders (flat) | Similar but less explicit about domain boundaries and ubiquitous language |
| Technical layers (components/, hooks/, services/) | Breaks down as features grow; hard to understand what belongs together |
| Micro-frontends | Overkill for a single-developer personal project |
