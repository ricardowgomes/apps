# ADR-0011: TanStack AI for Stories Generation

- **Status**: Accepted
- **Date**: 2026-04-06

## Context

The Stories feature requires an AI SDK for generating story content (title + scenes). Two options were considered:

- **Option A**: Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) — stable, well-documented, proven Cloudflare Workers support.
- **Option B**: `@tanstack/ai` + `@tanstack/ai-anthropic` — TanStack-native, type-safe, vendor-neutral adapters, first-class structured output via `outputSchema`.

## Decision

Use **`@tanstack/ai` (Option B)** for story generation.

Using `@tanstack/ai` keeps the entire stack within the TanStack ecosystem. The `chat()` function with `outputSchema` supports structured generation directly (Zod v4 schemas), and `AnthropicTextAdapter` allows passing the API key at call time — important for Cloudflare Workers where `process.env` is unavailable.

TanStack ecosystem libraries (Query, Store, Form, Router) continue to be used for all client-side state management and UI concerns.

## Consequences

- `@tanstack/ai` and `@tanstack/ai-anthropic` added as production dependencies.
- Story generation uses `chat({ adapter, messages, outputSchema })` — structured, no extra parsing needed.
- Upgrade path to other providers (OpenAI, Gemini) requires only swapping the adapter.
