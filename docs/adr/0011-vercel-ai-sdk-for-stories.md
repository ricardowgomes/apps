# ADR-0011: Vercel AI SDK for Stories Generation

- **Status**: Accepted
- **Date**: 2026-04-04

## Context

The Stories feature requires an AI SDK for generating story content (title + scenes). Two options were considered:

- **Option A**: Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) — stable, well-documented, proven Cloudflare Workers support, first-class `generateObject` / `streamObject` with Zod schemas.
- **Option B**: `@tanstack/ai` — alpha, TanStack-native, AG-UI protocol.

## Decision

Use **Vercel AI SDK** for story generation server functions.

`@tanstack/ai` is still in alpha as of the decision date and has limited documentation for Cloudflare Workers deployment. The Vercel AI SDK has first-class `generateObject` support which maps perfectly to the structured story schema (title + scenes array), and it has documented compatibility with Cloudflare Workers via the `@ai-sdk/anthropic` provider.

TanStack ecosystem libraries (Query, Store, Form, Router) continue to be used for all client-side state management and UI concerns.

## Consequences

- `ai` and `@ai-sdk/anthropic` added as production dependencies.
- Story generation is a single server function call (`createServerFn`), not a streaming endpoint for MVP.
- If `@tanstack/ai` stabilises, the server function can be migrated without touching the UI layer.
