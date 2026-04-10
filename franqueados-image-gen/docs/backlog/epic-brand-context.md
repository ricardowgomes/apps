# Epic: Brand Context & System Prompt

- **Status**: Backlog
- **Priority**: High
- **Estimated size**: M

## Goal

Upload brand documentation (product benefits, tone of voice, visual guidelines, logo placement rules) and store it as a versioned system prompt in D1. This brand context is automatically prepended to every franchisee prompt before it's sent to Fal.ai, ensuring all generated images are on-brand without requiring franchisees to know prompt engineering.

## Scope

### In
- D1 schema: `brand_context` table (versioned system prompts)
- D1 schema: `brand_assets` table (R2 key references for logo, product reference images)
- `apps/api/src/brand/` domain with `GET /api/brand/context` and `PUT /api/brand/context` endpoints
- Admin-only access policy (product owner email only — documented in CLAUDE.md)
- `PromptBuilder` pure function in `apps/api/src/image-gen/domain/` that concatenates brand context + user prompt
- Simple admin UI page in `apps/web` to view and edit the active system prompt (plain textarea, save button)
- R2 upload endpoint for brand asset images (logo PNG, reference product photo)
- Unit tests for `PromptBuilder`
- Integration tests for `GET` and `PUT /api/brand/context`
- Integration test for admin UI page

### Out
- Rich text editor for the system prompt (plain textarea is enough)
- Version history UI (D1 stores versions but no UI needed in MVP)
- Franchisee-facing brand context — franchisees never see or edit this

## Tasks

- [ ] (S) Create D1 migration: `brand_context` and `brand_assets` tables
- [ ] (S) Create `BrandContext` entity and `PromptBuilder` pure function in `image-gen/domain/`
- [ ] (S) Unit test `PromptBuilder` with various brand context + user prompt combinations
- [ ] (M) Implement `GET /api/brand/context` and `PUT /api/brand/context` Worker routes
- [ ] (S) Integration test: PUT updates active context, GET returns it
- [ ] (S) Implement `POST /api/brand/assets` for R2 upload (multipart/form-data)
- [ ] (M) Build admin UI page (`/admin/brand`) with textarea and save button
- [ ] (S) Integration test: admin page renders current context, saves new context
- [ ] (XS) Seed initial brand context with placeholder text (clear TODOs for product owner to fill)
- [ ] (XS) Document brand context format in `docs/brand-context-guide.md`

## Done When

- `PUT /api/brand/context` with a valid JSON body persists a new active system prompt in D1
- `GET /api/brand/context` returns the currently active system prompt
- `PromptBuilder` correctly concatenates brand context + user prompt into an enriched prompt string
- Admin UI at `/admin/brand` displays the current prompt and allows editing
- Logo and product reference image can be uploaded to R2 via the admin endpoint
- All unit and integration tests pass
- `pnpm check` and `pnpm tsc` pass
