# ADR-0001: TanStack Start as the Application Framework

- **Date**: 2026-02-18
- **Status**: Accepted

## Context

The project needed a full-stack React framework that supports SSR, file-based routing, type-safe server functions, and deployment to Cloudflare Workers. The primary goals were strong TypeScript integration, the ability to co-locate server and client code, and alignment with the TanStack ecosystem already chosen for state management.

## Decision

Use **TanStack Start** as the application framework, with file-based routing via **TanStack Router**.

## Consequences

### Positive
- Unified TanStack ecosystem: Router, Query, Form, Store, and Table all integrate seamlessly
- File-based routing with full type safety — no manual route registration
- SSR with streaming out of the box
- `createServerFn` enables type-safe server/client boundary without a separate API layer for most cases
- First-class Cloudflare Workers support via the official Cloudflare Vite plugin

### Negative / Trade-offs
- TanStack Start is relatively young; APIs may change
- Smaller community and ecosystem than Next.js
- Some patterns are still being established; less reference material available

### Neutral
- Auto-generated `routeTree.gen.ts` must never be manually edited
- DevTools (Router, Query, Store) are included and rendered only client-side

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Next.js | Strong React Query / TanStack integration is harder to achieve; less aligned with full TanStack stack |
| Remix | Good SSR story but not aligned with TanStack ecosystem; separate routing paradigm |
| SvelteKit | Different language/framework; team familiarity with React |
