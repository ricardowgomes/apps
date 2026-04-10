# ADR-0006: Domain-Driven Design as Architectural Principle

- **Date**: 2026-04-10
- **Status**: Accepted

## Context

Even for a focused tool, mixing concerns leads to unmaintainable code fast — especially when Claude is the primary author and starts each session with no memory of the previous one. Without a clear structural principle, related files get scattered across technical layers (`components/`, `utils/`, `handlers/`), making it hard to reason about what a "feature" consists of.

DDD organises code around **business domains** (image generation, brand management, history) rather than technical layers. This matches how Claude naturally thinks about features and makes the codebase self-documenting.

## Decision

Adopt **Domain-Driven Design (DDD)** as the primary architectural principle across both `apps/web` and `apps/api`.

### Structure for each domain (frontend)

```
apps/web/src/{domain}/
  domain/         # Entities, value objects, pure domain logic (no React, no fetch)
  application/    # Hooks, query functions, use-case orchestration
  infrastructure/ # API clients, fetch wrappers calling apps/api
  ui/             # React components, pages, forms
```

### Structure for each domain (backend)

```
apps/api/src/{domain}/
  domain/         # Entities, value objects, pure logic (no Fal.ai, no D1 deps)
  application/    # Use cases (orchestrate domain + infrastructure)
  infrastructure/ # D1 repositories, R2 uploader, Fal.ai client
```

### Current domains

| Domain | Frontend | Backend | Responsibility |
|--------|----------|---------|----------------|
| `image-gen` | yes | yes | Prompt → image generation flow |
| `brand` | no | yes | System prompt management, brand context |
| `history` | yes | yes | Past generation retrieval |
| `shared` | yes | yes | Cross-domain utilities, middleware, layout |

## Consequences

### Positive
- Features and all their related code live together — easy to find, easy to delete
- Domain boundaries make it obvious what a feature touches before making changes
- Pure domain logic (no framework dependencies) is trivially unit-testable
- Claude can navigate by domain without needing a mental map of the full codebase

### Negative / Trade-offs
- Requires upfront domain identification before coding
- Shared utilities still need a home (`src/shared/`)
- Can feel over-engineered for very small features — apply pragmatically for XS tasks

### Neutral
- `packages/types` defines the API contract shapes shared between frontend and backend domains
- Infrastructure adapters (D1, R2, Fal.ai) are always behind an interface so they can be mocked in tests

## Recommended Domain Structure Example

```
apps/api/src/image-gen/
  domain/
    prompt-builder.ts          # Pure function: BrandContext + UserPrompt → EnrichedPrompt
    prompt-builder.test.ts
    types.ts                   # UserPrompt, EnrichedPrompt, GeneratedImage
  application/
    generate-image.usecase.ts  # Orchestrates: build prompt → call Fal.ai → save to R2/D1
    generate-image.usecase.integration.test.ts
  infrastructure/
    fal-ai.client.ts           # HTTP wrapper around Fal.ai API
    d1-image.repository.ts     # D1 read/write for generation records
    r2-image.uploader.ts       # R2 put/get for image files
```

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Technical layers (controllers/, services/, models/) | Breaks down as features grow; hard to understand what belongs together |
| Feature folders (flat, no sub-layers) | Similar but less explicit about boundaries; domain logic mixes with infrastructure |
| No structure (files in `src/`) | Fine for 5 files, chaotic at 50+ |
