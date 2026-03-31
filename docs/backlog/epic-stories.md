# Epic: AI Illustrated Book Stories

- **Status**: Planned
- **Priority**: Medium

## Goal

A creative app at `/stories/` where the family can read short illustrated stories and generate new ones through a conversational AI chatbot. Stories are persisted and can be revisited. Illustrations are AI-generated images per story scene. Animation is deferred to a future phase.

## Motivation

A fun, personal-use sub-app that showcases AI-generation capabilities while creating real value for the family — especially for children's bedtime stories. Also a strong portfolio showcase of generative AI features in a full-stack app.

---

## AI Integration Options (TanStack Ecosystem)

TanStack Start has two primary AI integration paths:

### Option A — Vercel AI SDK (`ai` + `@ai-sdk/react`)
- `useChat` hook manages chat state, message history, and streaming automatically
- `streamText` on the server streams LLM responses chunk-by-chunk
- `toUIMessageStreamResponse` converts stream to HTTP response
- Tool calling support for structured outputs (e.g., generating story JSON + image prompts)
- **Best fit**: Production-ready, well-documented, works on Cloudflare Workers via `@ai-sdk/anthropic`

### Option B — TanStack AI (`@tanstack/ai`) ← alpha
- Vendor-neutral, type-safe, first-class TanStack integration
- Supports OpenAI, Anthropic, Gemini, Ollama with no lock-in
- AG-UI Protocol with streaming adapters (`fetchServerSentEvents`)
- Streaming reasoning/thinking steps as separate events
- **Best fit**: Cutting-edge, but alpha — evaluate stability before committing

### Recommendation
Start with **Vercel AI SDK** (Option A) for the chat and story generation (proven Cloudflare Workers support). Revisit TanStack AI when it stabilises.

### Image Generation
- Use **Cloudflare AI** (Workers AI — `@cf/stabilityai/stable-diffusion-xl-base-1.0` or `@cf/black-forest-labs/flux-1-schnell`) — zero extra infra, billed per request
- Or **OpenAI DALL-E 3** / **Replicate** for higher quality — requires external API key

---

## Scope

**In:**
- Story library at `/stories/` — list of saved stories with cover image and title
- Story viewer at `/stories/$storyId` — scenes with text + AI illustration per scene
- Story creator — chat interface where user describes a story idea and the AI generates it
- Story persistence — stored in Cloudflare D1 (story metadata + scenes)
- Image storage — Cloudflare R2 for generated images (or base64 in D1 for MVP)
- Auth gate — `/stories/*` restricted to logged-in users (same session as Finance)

**Out (future phases):**
- Animated illustrations (CSS/Lottie/video generation)
- Audio narration (text-to-speech)
- Story sharing / public links
- Multi-language stories (i18n)
- Story editing after creation

---

## Domain Model

```
Story
  id: string
  title: string
  coverImageUrl: string
  createdAt: Date
  createdBy: string (userId)
  scenes: Scene[]

Scene
  id: string
  storyId: string
  order: number
  text: string          // narrative paragraph
  imagePrompt: string   // sent to image model
  imageUrl: string      // stored in R2
```

---

## Tasks

### Phase 1 — Foundation
- [ ] ADR: choose AI SDK (Vercel AI SDK vs TanStack AI) and image provider
- [ ] D1 migration: `stories` and `scenes` tables
- [ ] Domain model: `src/stories/domain/story.ts`
- [ ] Repository: `src/stories/infrastructure/d1-story-repository.ts`
- [ ] Server fns: get all stories, get story by id, save story
- [ ] Route: `/stories/` — story library grid (placeholder cards)
- [ ] Route: `/stories/$storyId` — story viewer with scenes
- [ ] Auth guard on all `/stories/*` routes

### Phase 2 — Story Generation
- [ ] Chat UI at `/stories/new` — conversational story builder
- [ ] API route: `POST /api/stories/generate` — streams story JSON (title + scenes) via AI SDK
- [ ] Tool call or structured output to produce `{ title, scenes: [{ text, imagePrompt }] }`
- [ ] Save generated story + scenes to D1 on completion
- [ ] Redirect to story viewer after save

### Phase 3 — Illustration
- [ ] API route: `POST /api/stories/illustrate` — generates image per scene via Cloudflare AI or DALL-E
- [ ] Upload images to R2, store URL in D1
- [ ] Display illustrations in story viewer
- [ ] Cover image = first scene image

### Phase 4 — Polish
- [ ] Story list with cover images and creation date
- [ ] Skeleton loading states during generation
- [ ] Error handling and retry for failed generations
- [ ] Mobile-optimised story viewer (full-screen scenes)
- [ ] E2E tests for full create → view flow

---

## Completed

_(nothing yet)_

---

## Open Questions

1. **Image model**: Cloudflare Workers AI (free tier, lower quality) vs DALL-E 3 (higher quality, cost)?
2. **TanStack AI stability**: worth adopting alpha, or wait for stable release?
3. **Image storage**: R2 bucket (proper CDN) vs base64 in D1 (MVP simplicity)?
4. **Story length**: fixed 3–5 scenes, or user-configurable?
