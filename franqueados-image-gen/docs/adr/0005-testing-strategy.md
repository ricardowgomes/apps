# ADR-0005: Testing Strategy — The Testing Trophy

- **Date**: 2026-04-10
- **Status**: Accepted

## Context

As an AI-first project where Claude writes most code, tests serve two purposes:
1. Catching regressions when Claude modifies existing features
2. Giving Claude a fast feedback loop to verify its own output

Tests need to be fast enough to run on every commit, granular enough to pinpoint failures, and stable enough not to break when internal implementation details change. The Testing Pyramid (heavy unit test focus) produces brittle tests that break on refactors. The Testing Trophy model inverts this by emphasising integration tests.

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
TypeScript strict mode + Biome catch typos, null errors, and syntax issues before any test runs.

### Layer 2 — Unit Tests (20% effort)
Write only for **pure, logic-heavy code**.

**Write unit tests for:**
- `PromptBuilder` — prompt enrichment logic
- Data transformers — mapping D1 rows to domain types
- Validation functions — prompt length, character checks
- Domain value objects

**Do NOT write unit tests for:**
- React components (integration tests cover these)
- Simple pass-through functions
- Worker route handlers (integration tests cover these)

### Layer 3 — Integration Tests (60% effort — the sweet spot)
Test how pieces work together. Mock the **outer world** (Fal.ai, D1, R2) but exercise real code paths.

**Frontend integration tests:**
- Render the generation page, mock the API call, assert the image appears
- Test loading state, error state, and success state from the user's perspective

**Backend integration tests:**
- Test Worker route handlers with a mocked D1/R2/Fal.ai client
- Assert correct D1 writes and R2 uploads on a successful generation
- Assert correct error responses on Fal.ai failure

**The golden rule — test the "What," not the "How":**
- Bad: `expect(promptBuilder.brandContext).toBe('...')` — tests internal state
- Good: `expect(screen.getByAltText('Generated image')).toBeInTheDocument()` — tests user-visible outcome

### Layer 4 — E2E Tests (15% effort)
Cover only **happy paths** on critical user journeys. Every production feature requires at least one E2E test before it ships.

**Write E2E tests for:**
- Franchisee logs in and generates an image successfully
- Franchisee views their generation history

**Tool**: Playwright (see ADR-0010 if adopted; otherwise Playwright is default).

---

## File Naming and Co-location

### Convention

| Layer | Suffix | Example |
|---|---|---|
| Unit | `*.test.ts` / `*.test.tsx` | `prompt-builder.test.ts` |
| Integration | `*.integration.test.ts` / `*.integration.test.tsx` | `generate-page.integration.test.tsx` |
| E2E | `*.spec.ts` | `image-gen.spec.ts` |

### Co-location Rule

Test files live **next to the source file they test**. No `__tests__/` subdirectories.

```
apps/web/src/image-gen/
  domain/
    prompt-builder.ts
    prompt-builder.test.ts                          ← unit
  application/
    use-generate-image.ts
    use-generate-image.integration.test.ts          ← integration
  ui/
    GeneratePage.tsx
    GeneratePage.integration.test.tsx               ← integration

apps/api/src/image-gen/
  application/
    generate-image.usecase.ts
    generate-image.usecase.integration.test.ts      ← integration

tests/e2e/
  image-gen.spec.ts                                 ← E2E (Playwright root)
```

---

## Effort Distribution Summary

| Type | Effort | Tools |
|------|--------|-------|
| Unit | 20% | Vitest |
| Integration | 60% | Vitest + React Testing Library + MSW (or fetch mocks) |
| E2E | 15% | Playwright |
| Manual/QA | 5% | Browser + eyes |

---

## Consequences

### Positive
- Integration tests dominate: fast to run, catch real regressions, stable across refactors
- Co-located test files are easy to find and delete when features are removed
- Naming convention makes test type visible without opening the file
- Claude gets fast feedback from `pnpm test` during the ship-gates loop

### Negative / Trade-offs
- `*.integration.test.ts` suffix is verbose
- Mocking D1/R2/Fal.ai requires careful setup — MSW or Vitest mocks must be maintained
- E2E tests require both frontend and backend running — CI must start both

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Test Pyramid (heavy unit focus) | Too many brittle tests that break on refactors |
| E2E only | Too slow; no granular failure signals |
| Single `*.test.ts` for everything | Ambiguous; can't tell layer from filename |
