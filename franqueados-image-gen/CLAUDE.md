# Claude Code Instructions — Gerador de Imagens para Franqueados

This file provides context and rules for Claude Code when working in this repository.
Read `docs/architecture.md` for the full codebase overview.

---

## Project Summary

**franqueados-image-gen** is an AI-first tool that lets franchisees type a simple prompt and receive a brand-compliant social media image featuring the company's water purifier, logo, and official tone of voice. Built with:

- **Turborepo** monorepo (apps + packages)
- **Frontend**: React + TypeScript deployed to Cloudflare Pages
- **Backend**: Cloudflare Workers (TypeScript, HTTP API)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Storage**: Cloudflare R2 (generated images + brand assets)
- **Image generation**: Fal.ai — Flux model
- **Auth**: Cloudflare Access (franchisee gate)
- **Linting/formatting**: Biome
- **Testing**: Vitest + Testing Library (unit + integration), Playwright (E2E)

Primary purpose: empower franchisees to create on-brand social media content without design skills.

---

## Monorepo Structure

```
apps/
  web/          # React frontend — Cloudflare Pages
  api/          # Cloudflare Workers backend
packages/
  ui/           # Shared shadcn/ui components
  config/       # Shared Biome, TypeScript, and Vitest configs
  types/        # Shared API contract types (request/response shapes)
```

---

## Key Files to Know

| File | Purpose |
|---|---|
| `docs/architecture.md` | Codebase structure, patterns, and decisions |
| `docs/adr/` | Architecture Decision Records — read before making design choices |
| `docs/backlog/` | Epics and high-level plans — primary task backlog |
| `docs/logs/` | Implementation logs — historical record of what was shipped and why |
| `apps/web/src/routes/` | Frontend pages (file-based routing) |
| `apps/api/src/` | Worker handlers by domain |
| `apps/api/wrangler.jsonc` | Cloudflare Workers deployment config |
| `turbo.json` | Turborepo pipeline definition |
| `biome.json` | Root Biome config (applies to all packages) |
| `packages/types/src/` | Shared request/response types — single source of truth |

---

## Architectural Rules (enforce these)

### 1. Domain-Driven Design

Organise code by **domain**, not by technical layer.

```
apps/web/src/
  image-gen/
    domain/         # Types, entities, pure logic (no framework deps)
    application/    # Use cases, hooks, query functions
    infrastructure/ # API clients, R2/D1 adapters
    ui/             # React components, pages, forms

apps/api/src/
  image-gen/
    domain/
    application/
    infrastructure/ # Fal.ai client, D1 repo, R2 uploader
```

See ADR-0006 for full guidance.

### 2. Testing — The Testing Trophy

Four layers. All must pass before a task is done. See [ADR-0005](docs/adr/0005-testing-strategy.md) for the full rationale.

```
         ╱ E2E ╲           ← 15% effort
        ╱─────────╲
       ╱ Integration ╲     ← 60% effort  (the sweet spot)
      ╱───────────────╲
     ╱   Unit Tests    ╲   ← 20% effort
    ╱───────────────────╲
   ╱  Static Analysis   ╲  ← base (TypeScript strict + Biome — always on)
```

#### Layer rules

| Layer | Tool | Write tests for | Effort |
|---|---|---|---|
| Unit | Vitest | Pure functions, data transformers, domain entities | 20% |
| Integration | Vitest + RTL | Whole pages/forms/hooks with mocked network | 60% |
| E2E | Playwright | Happy paths on critical user journeys | 15% |

#### Golden rule — test the "What," not the "How"
- **Bad**: `expect(component.state.isLoading).toBe(true)` — tests implementation detail
- **Good**: `expect(screen.getByRole('progressbar')).toBeVisible()` — tests user-visible outcome

#### File naming

| Layer | Suffix |
|---|---|
| Unit | `*.test.ts` / `*.test.tsx` |
| Integration | `*.integration.test.ts` / `*.integration.test.tsx` |
| E2E | `*.spec.ts` |

#### Co-location rule
Test files live **next to the source file they test** — no `__tests__/` subdirectories.

```
apps/web/src/image-gen/
  domain/
    prompt-builder.ts
    prompt-builder.test.ts                            ← unit
  application/
    use-generate-image.ts
    use-generate-image.integration.test.ts            ← integration
tests/e2e/
  image-gen.spec.ts                                   ← E2E (Playwright root)
```

#### Hard rules
- **Every new production feature ships with at least one E2E test.** A feature without a passing Playwright test is not done.
- Never test auto-generated files or pure configuration

### 3. ADRs
- Before making a significant architectural decision, check `docs/adr/` for existing decisions
- When making a new architectural decision, create an ADR in `docs/adr/` using `docs/adr/template.md`
- ADR numbering: next available 4-digit number (e.g., `0009-...`)

### 4. Shared Types are the API Contract
- All request/response shapes live in `packages/types/src/`
- Both frontend and backend import from `@franqueados/types`
- Never duplicate type definitions across apps

### 5. Code Style
- Biome is the enforcer: run `pnpm check` before committing
- Double quotes, tab indentation
- No unused variables or imports (TypeScript strict + Biome)
- Path alias `@/*` maps to each app's `src/*`

---

## Common Commands

```bash
# Root (runs across all apps/packages via Turborepo)
pnpm dev              # Start all dev servers in parallel
pnpm build            # Build all apps and packages
pnpm test             # Run all Vitest tests (unit + integration)
pnpm check            # Biome: lint + format check (all packages)
pnpm format           # Biome: auto-format (all packages)

# App-specific
pnpm --filter web dev           # Frontend only, port 5173
pnpm --filter api dev           # Worker dev via wrangler, port 8787
pnpm --filter api deploy        # Deploy worker to Cloudflare

# E2E (requires both web and api dev servers running)
pnpm pw:open          # Playwright interactive UI
pnpm pw:run           # Playwright headless
```

---

## Environment Variables

### apps/api/.dev.vars (Cloudflare Workers local secrets — not committed)

| Variable | Purpose |
|---|---|
| `FAL_API_KEY` | Fal.ai — image generation (required) |
| `BRAND_SYSTEM_PROMPT` | Override for brand prompt (optional, fallback in DB) |

### apps/web/.env.local (not committed)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API Worker URL (defaults to `http://localhost:8787`) |

### Cloudflare Bindings (wrangler.jsonc)

| Binding | Type | Purpose |
|---|---|---|
| `DB` | D1 | Generation history, brand context, franchisee records |
| `IMAGES` | R2 | Generated images and brand asset storage |

---

## What Exists vs. What Is Planned

### Planned (in priority order — see `docs/backlog/`)
1. Monorepo scaffold (Turborepo + apps + packages)
2. Brand context upload and system prompt management
3. Image generation UI (text field → image)
4. Fal.ai integration (Flux model)
5. Franchisee authentication (Cloudflare Access)
6. Generation history (D1 + R2)

---

## Workflow (AI-first — follow this on every task)

This is an AI-first project. Most code and features are written by Claude. Follow this workflow on every task, without exception.

**Standing authorization**: You are pre-authorized to run `git commit`, `git push`, and `gh pr create` on non-main branches without asking for permission. Execute these as part of the normal workflow — do not wait for approval.

### 0. Check the backlog first

Read `docs/backlog/` to understand the current state. Pick the highest-priority incomplete task from the active epic.

**When GitHub Issues are available:** prefer them over backlog files. Use the same label lifecycle:
```
status: in story writing  →  status: ready to pull  →  status: in progress  →  closed
```

### 1. Create a feature branch
Before writing any code, create and checkout a feature branch from `main`:
```bash
git checkout main && git pull
git checkout -b feat/short-description   # new features
git checkout -b fix/short-description    # bug fixes
git checkout -b chore/short-description  # maintenance
```
Never work directly on `main`.

### 2. Small, focused changes
Make the smallest change that moves the task forward. Avoid bundling unrelated edits.

### 3. Commit after every meaningful change
Commit as soon as a logical unit of work is complete. You are pre-authorized to do this.

### 4. Write tests
- Integration tests for features and domain boundaries
- Unit tests for domain logic and pure functions
- Tests must pass before the task is considered done

### 5. Document for future self
Add code comments where the intent or reasoning isn't obvious. Write for the next Claude session, not for the product owner.

### 6. Ship gates — run, fix, repeat until all pass

```
pnpm test             # all Vitest tests pass
pnpm check            # Biome lint + format (auto-fix with: pnpm format)
pnpm tsc              # TypeScript strict (runs tsc --noEmit in each app)
pnpm knip             # no dead code
```

**Gate failure rules:**
- `test` fails → diagnose, fix the code or test, re-run
- `check` fails → run `pnpm format` first; if lint errors remain, fix them, re-run
- `tsc` fails → fix type errors, re-run
- `knip` fails → remove the dead export/import, re-run
- Never skip a gate. Never use `--no-verify` or suppression comments to silence a gate.

### 7. Final self-review
After all gates are green, re-read the original requirements: did I actually meet them?

### 8. Ship automatically once gates pass
```bash
git push -u origin <branch-name>
gh pr create --fill
```
Always include `Closes #<issue-number>` in the PR body when working from a GitHub Issue.

### 9. End-of-task summary
After the PR is open, give a brief summary:
- What was done and the PR link
- Where to optimize next (concrete suggestions)

---

## Ownership

- **Product owner** — sets priorities, approves epics, makes product decisions
- **Claude** — primary implementer and co-author: proposes task sizes and scope, executes tasks, maintains the backlog as work progresses

See [ADR-0007](docs/adr/0007-ai-first-project-management.md) for the project management approach.
