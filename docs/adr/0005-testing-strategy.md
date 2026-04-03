# ADR-0005: Testing Strategy — The Testing Trophy

- **Date**: 2026-04-02
- **Status**: Accepted (supersedes [ADR-0009](0009-cypress-e2e-testing.md); tooling for E2E remains [ADR-0010](0010-playwright-over-cypress.md))

## Context

Earlier ADRs (0005 original, 0009) defined a two-layer Vitest strategy plus a Cypress/Playwright E2E layer. In practice the layers lacked clear effort guidance, had no co-location rules, and used a single `*.test.ts` naming convention that made it impossible to distinguish unit from integration tests at a glance.

The project needs a concrete, opinionated model that tells Claude (the primary implementer) exactly:
- Which kind of test to write for which kind of code
- How to name and locate each test file
- What percentage of effort belongs at each layer

## Decision

Adopt the **Testing Trophy** model. Coverage is measured in **functionality** (use cases), not raw line percentage.

```
         ╱ E2E ╲           ← 15% effort — happy paths only
        ╱─────────╲
       ╱ Integration ╲     ← 60% effort — the sweet spot
      ╱───────────────╲
     ╱   Unit Tests    ╲   ← 20% effort — pure logic only
    ╱───────────────────╲
   ╱  Static Analysis   ╲  ← base — TypeScript + Biome (always on)
  ╱─────────────────────╲
```

### Layer 1 — Static Analysis (base, zero effort)
- TypeScript strict mode + Biome catch typos, null errors, and syntax issues before any test runs.
- This is not a "test" layer but it counts toward confidence. Keep strict mode on everywhere.

### Layer 2 — Unit Tests (20% effort)
Write unit tests only for **logic-heavy pure code**. Do not unit-test every function.

**Write unit tests for:**
- Shared utilities: date formatting, currency conversion, regex parsers
- Data transformation: functions that map raw API/DB responses to UI models
- Reducers / state machines: complex state transitions
- Domain entities and value objects

**Do NOT write unit tests for:**
- React components (integration tests cover these)
- Simple pass-through functions
- Auto-generated code

### Layer 3 — Integration Tests (60% effort — the sweet spot)
Test how pieces work together. Mock the **outer world** (network, DB) but exercise the real code path.

**Frontend integration tests:**
- Render a whole page or complex form using React Testing Library
- Mock API/server-fn calls (MSW or Vitest mock); interact with the DOM as a user would
- Test "the what": assert visible outcomes, not internal state

**Backend / application-layer integration tests:**
- Test hooks, stores, and use-cases together
- Mock only infrastructure boundaries (D1 repository, external HTTP)

**The golden rule — test the "What," not the "How":**
- Bad: `expect(component.state.isLoading).toBe(true)` — tests implementation detail
- Good: `expect(screen.getByRole('progressbar')).toBeVisible()` — tests user-visible outcome

If you move a button or rename a private variable, a unit test might break; an integration test only breaks if the **feature** stops working.

### Layer 4 — E2E Tests (15% effort)
Keep lean. E2E tests are slow and prone to flakiness. Cover only **happy paths** on critical user journeys.

**Write E2E tests for:**
- Authentication (login/logout)
- The primary CRUD flow of each domain feature (e.g., "user can import CSV and see transactions")
- Any flow that crosses the frontend↔backend boundary in a way integration tests cannot reach

**Do NOT write E2E tests for:**
- Error states (cover these in integration tests instead)
- Edge cases or validation messages
- Every variant of a form

**Tool**: Playwright (see ADR-0010). Every new production feature ships with at least one E2E test. A feature without a passing E2E test is not done.

---

## File Naming and Co-location

### Convention

| Layer | Suffix | Example |
|---|---|---|
| Unit | `*.test.ts` / `*.test.tsx` | `transaction.test.ts` |
| Integration | `*.integration.test.ts` / `*.integration.test.tsx` | `finance-page.integration.test.tsx` |
| E2E | `*.spec.ts` | `finance.spec.ts` |

### Co-location Rule

**Test files live next to the code they test.** No `__tests__/` subdirectories.

```
src/
  finance/
    domain/
      transaction.ts
      transaction.test.ts              ← unit test, right next to source
      csv-import.ts
      csv-import.test.ts
    application/
      use-transactions.ts
      use-transactions.integration.test.ts   ← integration test, co-located
    ui/
      FinancePage.tsx
      FinancePage.integration.test.tsx

tests/
  e2e/
    finance/
      finance.spec.ts                  ← E2E lives here (Playwright config requires a root dir)
```

> E2E tests are the only exception to strict co-location because Playwright's `testDir` points to `tests/e2e/`. Mirror the domain structure inside that directory.

### Existing Tests (migration note)
Existing test files in `__tests__/` subdirectories do not need to be moved immediately. Apply the co-location rule to all **new** test files from the date of this ADR.

---

## Effort Distribution Summary

| Type | Effort | Goal | Tools |
|---|---|---|---|
| Unit | 20% | Pure logic & edge cases | Vitest |
| Integration | 60% | Component/hook/API interactions | Vitest + RTL + MSW |
| E2E | 15% | Critical user journeys | Playwright |
| Manual/QA | 5% | Visual polish & "feel" | Your eyeballs |

---

## What NOT to Test (ever)

- Auto-generated files (`routeTree.gen.ts`, `src/paraglide/`)
- Pure configuration files (`vite.config.ts`, `biome.json`)
- Demo/scaffold routes (unless they contain shared reusable logic)

---

## Consequences

### Positive
- Integration tests dominate: they are fast enough to run on every commit and catch real regressions
- Co-located files are easy to find and delete when the feature is removed
- Naming convention makes the test type visible without opening the file
- "Test the what" rule keeps tests stable during internal refactors

### Negative / Trade-offs
- `*.integration.test.ts` suffix is verbose; the pay-off is immediate clarity
- Requires discipline to resist writing unit tests for non-pure code
- E2E tests still require the dev server running (`pnpm dev` or Wrangler)

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Test pyramid (heavy unit focus) | Too many brittle tests that break on refactors |
| E2E only | Too slow; no granular failure signals |
| Single `*.test.ts` for everything | Ambiguous; cannot tell layer from filename alone |
| `__tests__/` subdirectories | Adds indirection; co-location is simpler |
