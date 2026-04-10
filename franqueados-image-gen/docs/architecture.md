# Architecture Overview — Gerador de Imagens para Franqueados

Last updated: 2026-04-10

---

## Purpose

A web tool that allows franchisees to generate brand-compliant social media images by typing a simple text prompt. The system enriches the prompt with brand context (product benefits, tone of voice, visual guidelines) and sends it to Fal.ai's Flux model, returning an image with the purifier and logo placed naturally.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Franchisee Browser                        │
│                   (React SPA — Cloudflare Pages)                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS (REST + multipart)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Cloudflare Workers (API)                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  /generate   │  │  /history    │  │  /brand (admin)        │ │
│  │  POST        │  │  GET         │  │  GET / PUT             │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬───────────┘ │
│         │                 │                        │             │
│  ┌──────▼─────────────────▼────────────────────────▼───────────┐ │
│  │              Application Layer (use cases)                   │ │
│  └──────┬──────────────────────────────────────────────────────┘ │
│         │                                                         │
│  ┌──────▼────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  Fal.ai Client    │  │  D1 Repo     │  │  R2 Uploader      │ │
│  │  (image gen)      │  │  (history)   │  │  (image storage)  │ │
│  └───────────────────┘  └──────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                      │                    │
    ┌─────▼─────┐         ┌──────▼──────┐    ┌───────▼──────┐
    │  Fal.ai   │         │ Cloudflare  │    │ Cloudflare   │
    │  (Flux)   │         │     D1      │    │     R2       │
    └───────────┘         └─────────────┘    └──────────────┘
```

---

## Monorepo Structure

```
franqueados-image-gen/
├── apps/
│   ├── web/                    # React SPA — Cloudflare Pages
│   │   ├── src/
│   │   │   ├── routes/         # File-based routing (TanStack Router or React Router)
│   │   │   ├── image-gen/      # Image generation domain
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── ui/
│   │   │   ├── history/        # Generation history domain
│   │   │   └── shared/         # Cross-domain utilities, layout, theme
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                    # Cloudflare Workers backend
│       ├── src/
│       │   ├── index.ts        # Worker entrypoint (router setup)
│       │   ├── image-gen/      # Image generation domain
│       │   │   ├── domain/     # Prompt builder, validation
│       │   │   ├── application/# GenerateImageUseCase
│       │   │   └── infrastructure/  # FalAiClient, D1ImageRepo, R2Uploader
│       │   ├── brand/          # Brand context management
│       │   │   ├── domain/     # BrandContext entity, SystemPrompt builder
│       │   │   ├── application/
│       │   │   └── infrastructure/  # D1BrandRepo
│       │   └── shared/         # Middleware, error handling, CORS
│       ├── wrangler.jsonc      # Cloudflare Workers config
│       └── package.json
│
├── packages/
│   ├── types/                  # Shared API contract types
│   │   └── src/
│   │       ├── image-gen.ts    # GenerateRequest, GenerateResponse
│   │       ├── history.ts      # HistoryItem
│   │       └── index.ts
│   ├── ui/                     # Shared React components (shadcn/ui based)
│   │   └── src/
│   │       └── components/
│   └── config/                 # Shared tool configs
│       ├── biome.json
│       ├── tsconfig.base.json
│       └── vitest.base.ts
│
├── tests/
│   └── e2e/                    # Playwright E2E tests
│       └── image-gen.spec.ts
│
├── turbo.json                  # Turborepo pipeline
├── biome.json                  # Root Biome config
├── package.json                # Root workspace
└── CLAUDE.md
```

---

## Domain Model

### Image Generation Domain

**Core flow:**
1. Franchisee submits a short natural-language prompt (e.g., "Água pura para toda a família")
2. API enriches the prompt with brand context (product benefits, visual style, logo placement rules)
3. Enriched prompt is sent to Fal.ai Flux model
4. Generated image URL is stored in R2, metadata in D1
5. Image URL is returned to the frontend

**Key entities:**
- `UserPrompt` — raw text from the franchisee (max 500 chars)
- `BrandContext` — system-level prompt prefix: product benefits, tone, visual rules
- `EnrichedPrompt` — concatenation of brand context + user prompt
- `GeneratedImage` — metadata record: id, franchisee_id, prompt, image_url, created_at
- `BrandAsset` — logo file reference, product reference image URL in R2

### Brand Context Domain

Stores and serves the brand system prompt that gets prepended to every franchisee request. Managed by the product owner via an admin endpoint.

**Key entities:**
- `SystemPrompt` — versioned text document in D1
- `ReferenceImage` — product/logo images stored in R2, referenced in the Fal.ai call

---

## Data Model (D1 — SQLite)

```sql
-- Brand configuration (admin-managed)
CREATE TABLE brand_context (
  id          INTEGER PRIMARY KEY,
  prompt_text TEXT    NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  is_active   INTEGER NOT NULL DEFAULT 1  -- boolean
);

-- Generation history
CREATE TABLE generations (
  id             TEXT PRIMARY KEY,  -- UUID
  franchisee_id  TEXT NOT NULL,
  user_prompt    TEXT NOT NULL,
  enriched_prompt TEXT NOT NULL,
  image_r2_key   TEXT NOT NULL,     -- R2 object key
  image_url      TEXT NOT NULL,     -- Public or signed URL
  status         TEXT NOT NULL,     -- 'pending' | 'done' | 'failed'
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/generate` | Cloudflare Access | Generate image from prompt |
| `GET` | `/api/history` | Cloudflare Access | List franchisee's past generations |
| `GET` | `/api/history/:id` | Cloudflare Access | Get single generation + image URL |
| `GET` | `/api/brand/context` | Admin only | Fetch active brand context |
| `PUT` | `/api/brand/context` | Admin only | Update brand system prompt |

---

## Key Patterns

### Prompt Enrichment
Brand context is prepended to every user prompt before sending to Fal.ai. The `PromptBuilder` in `image-gen/domain/` handles this as a pure function — easy to unit test in isolation.

### Image Storage
Generated images are stored in R2 under the key `generations/{franchisee_id}/{generation_id}.png`. The public URL (or a signed R2 URL) is returned to the frontend and stored in D1 for history lookup.

### Error Handling
All Workers return typed error responses matching `packages/types`. The frontend maps these to user-visible messages. Network/Fal.ai errors are surfaced as `status: 'failed'` in D1 so history remains consistent.

### Authentication Flow
Cloudflare Access sits in front of the Workers URL. The Worker validates the `CF-Access-JWT-Assertion` header to extract `franchisee_id`. No custom auth code required.

---

## Technology Decisions (ADR index)

| ADR | Decision |
|-----|----------|
| [0001](adr/0001-turborepo-monorepo.md) | Turborepo as monorepo tool |
| [0002](adr/0002-cloudflare-deployment-stack.md) | Cloudflare Pages + Workers + D1 + R2 |
| [0003](adr/0003-fal-ai-flux-image-generation.md) | Fal.ai (Flux) for image generation |
| [0004](adr/0004-biome-linting-formatting.md) | Biome for linting and formatting |
| [0005](adr/0005-testing-strategy.md) | Testing Trophy strategy |
| [0006](adr/0006-domain-driven-design.md) | Domain-Driven Design structure |
| [0007](adr/0007-ai-first-project-management.md) | AI-first project management |
| [0008](adr/0008-cloudflare-access-authentication.md) | Cloudflare Access for franchisee auth |
