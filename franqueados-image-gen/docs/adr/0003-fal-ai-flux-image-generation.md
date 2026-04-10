# ADR-0003: Fal.ai (Flux) for Image Generation

- **Date**: 2026-04-10
- **Status**: Accepted

## Context

The core product requirement is generating brand-compliant social media images from a franchisee's text prompt. The image generation model must:

1. Support high-quality photorealistic output suitable for social media
2. Accept text prompts that describe product placement and brand context
3. Be callable from a Cloudflare Worker via HTTP (no persistent GPU server needed)
4. Have a predictable per-image cost at franchisee scale (dozens to hundreds of images/month)
5. Return results quickly enough for an interactive web UI (< 30s acceptable; < 15s preferred)

## Decision

Use **Fal.ai** as the image generation platform with the **Flux** model (specifically `fal-ai/flux/dev` or `fal-ai/flux-pro` depending on quality requirements).

**Integration pattern:**
- Worker sends a `POST` to `https://fal.run/fal-ai/flux/dev` with the enriched prompt
- Fal.ai returns a synchronous result (image URL) for short jobs, or supports a queue/webhook pattern for longer jobs
- Worker downloads the generated image and stores it in R2, returning the R2 URL to the frontend

**Prompt construction:**
- Brand context (product description, visual style, logo placement instruction) is stored in D1
- `PromptBuilder` (pure function, domain layer) concatenates brand context + user prompt
- Final prompt sent to Fal.ai includes a negative prompt to avoid off-brand results

## Consequences

### Positive
- Fal.ai is an HTTP API — no GPU infrastructure to manage
- Flux produces high-quality, photorealistic results well-suited for product placement imagery
- Fal.ai supports both synchronous and queue-based (async) generation — can start with sync and migrate to queue if needed
- Pay-per-generation pricing: no idle costs
- Official JavaScript/TypeScript SDK (`@fal-ai/client`) simplifies integration

### Negative / Trade-offs
- Image generation takes 5–20s depending on model and resolution — requires loading UI state
- Fal.ai is an external dependency: outages affect the product
- Prompt engineering is critical — brand context must be carefully written to get consistent results
- Model outputs are non-deterministic — the same prompt can yield different images (desirable for variety, harder to QA)
- Cost scales with usage; must monitor to avoid unexpected charges at scale

### Neutral
- `FAL_API_KEY` stored as a Cloudflare Workers secret (not in code)
- Start with `fal-ai/flux/dev` for development, evaluate `fal-ai/flux-pro` for production quality
- Image resolution target: 1024×1024 (square for Instagram) or 1080×1920 (vertical for Stories)

## Prompt Engineering Notes

The system prompt stored in D1 should include:
- Product description (what the purifier looks like, key visual features)
- Placement rule ("the purifier should appear prominently in the foreground/background")
- Logo instruction ("include the [brand] logo in the bottom-right corner")
- Tone ("professional, clean, aspirational — like a premium lifestyle brand ad")
- Negative prompt ("no text overlay, no cartoon style, no competitor products")

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| OpenAI DALL-E 3 | Lower photorealism for product placement; less control over composition |
| Stability AI (DreamStudio) | API reliability and developer experience inferior to Fal.ai; similar pricing |
| Replicate | Valid alternative; Fal.ai has lower latency and better Flux support |
| Self-hosted Flux (RunPod) | Operational overhead; GPU cost management; not AI-friendly to maintain |
| Midjourney | No API (Discord-only); not automatable |
