# Epic: Image Generation UI + Fal.ai Integration

- **Status**: Backlog
- **Priority**: High
- **Estimated size**: L

## Goal

Build the core product: a franchisee types a short natural-language prompt (e.g., "Água pura para toda a família"), clicks Generate, and receives a brand-compliant social media image within 20 seconds. The image is stored in R2, metadata in D1, and the franchisee can download it directly from the UI.

## Scope

### In
- Frontend: generation page with a text field, a "Gerar Imagem" button, and an image preview area
- Loading state with a progress indicator (generation takes 5–20s)
- Error state: friendly message when Fal.ai fails
- Backend: `POST /api/generate` — builds enriched prompt, calls Fal.ai, uploads to R2, saves metadata to D1, returns image URL
- Fal.ai client in `apps/api/src/image-gen/infrastructure/fal-ai.client.ts`
- R2 uploader in `apps/api/src/image-gen/infrastructure/r2-image.uploader.ts`
- D1 repository in `apps/api/src/image-gen/infrastructure/d1-image.repository.ts`
- `GenerateImageUseCase` in `apps/api/src/image-gen/application/`
- D1 migration: `generations` table
- Download button on the frontend (opens image URL in new tab or triggers download)
- Unit test for `PromptBuilder` integration (already covered in brand-context epic — re-use)
- Integration tests for `POST /api/generate` (mock Fal.ai + D1 + R2)
- Integration test for generation page (mock API, assert image renders)
- E2E test: franchisee types prompt, clicks generate, image appears

### Out
- Image editing or post-processing
- Social media auto-posting
- Multiple image variants per generation
- Custom resolution selection (default: 1024×1024)

## Tasks

- [ ] (S) Create D1 migration: `generations` table
- [ ] (S) Implement `FalAiClient` — wraps `@fal-ai/client`, sends enriched prompt, returns image buffer
- [ ] (S) Implement `R2ImageUploader` — uploads image buffer to R2, returns public/signed URL
- [ ] (S) Implement `D1ImageRepository` — inserts and queries generation records
- [ ] (M) Implement `GenerateImageUseCase` — orchestrates: build prompt → Fal.ai → R2 → D1 → return URL
- [ ] (S) Implement `POST /api/generate` Worker route (validate input, call use case, return response)
- [ ] (S) Integration test: POST /api/generate with mocked Fal.ai client and D1/R2 — assert correct response and D1 record created
- [ ] (M) Build generation page (`/`) with text field, Generate button, image preview, download button
- [ ] (S) Loading state: show spinner/progress bar while waiting for API response
- [ ] (S) Error state: show user-friendly error message on API failure
- [ ] (S) Integration test: generation page — mock API success → assert image renders
- [ ] (S) Integration test: generation page — mock API error → assert error message appears
- [ ] (S) E2E test: full happy path — type prompt, click generate, image appears, download link works
- [ ] (XS) Add `FAL_API_KEY` to `.dev.vars.example` with instructions

## Done When

- Franchisee can type a prompt and receive a generated image in the browser
- Image is stored in R2 and retrievable via the returned URL
- Generation metadata (prompt, image URL, franchisee_id, timestamp) is saved in D1
- Loading and error states are visible and user-friendly
- All integration tests pass
- E2E test passes
- All ship gates green: `pnpm test`, `pnpm check`, `pnpm tsc`, `pnpm knip`
