# ADR-0005: Testing Strategy

- **Date**: 2026-02-18
- **Status**: Amended by [ADR-0009](0009-cypress-e2e-testing.md)

## Context

The project has Vitest and Testing Library installed but no tests yet. A clear testing strategy is needed to guide what to test and at what level, avoiding both under-testing (no confidence) and over-testing (brittle, slow test suites).

## Decision

Adopt a **two-level testing strategy**:

1. **Integration tests** — at the route/feature boundary, exercising real user flows
2. **Unit tests** — for domain logic, pure functions, and utilities

### Integration Tests
- Test from the user's perspective (render a route, interact with UI, assert outcomes)
- Use Testing Library (`@testing-library/react`) with jsdom
- Mock only external services (API calls, browser APIs like `navigator.mediaDevices`)
- Live alongside the feature in `src/{domain}/tests/` or `src/routes/__tests__/`

### Unit Tests
- Test domain entities, value objects, use cases, and pure utility functions in isolation
- No React, no DOM — pure TypeScript
- Fast, numerous, deterministic
- Live next to the module: `src/{domain}/domain/__tests__/`

### What NOT to Test
- Auto-generated code (`routeTree.gen.ts`, `src/paraglide/`)
- Pure configuration files
- Demo/scaffold code (unless it contains reusable logic)

## Consequences

### Positive
- Integration tests catch regressions that matter to users
- Unit tests document and pin domain logic precisely
- Clear guidance prevents debate about what to test and where

### Negative / Trade-offs
- Integration tests are slower than unit tests — keep the suite lean
- jsdom does not perfectly replicate browser behaviour; some browser-specific APIs need mocking

### Neutral
- Test runner: `pnpm test` (vitest run)
- Test files: `*.test.ts` or `*.test.tsx`
- Coverage is encouraged but not enforced by CI (yet)

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| E2E tests only (Playwright/Cypress) | Too slow for rapid iteration; no unit-level confidence |
| Unit tests only | Miss integration bugs; don't reflect real user flows |
| No tests | Unacceptable for a codebase that will grow and be maintained |

## Amendment

[ADR-0009](0009-cypress-e2e-testing.md) adds Cypress as a **third layer** on top of this strategy. The two Vitest levels above remain unchanged; Cypress covers full user flows that unit and integration tests cannot reach.
