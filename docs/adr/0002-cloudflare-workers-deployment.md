# ADR-0002: Cloudflare Workers as Deployment Target

- **Date**: 2026-02-18
- **Status**: Accepted

## Context

The application needs a hosting platform for both the SSR server and future API routes. The platform must support edge deployment, low latency, and the full TanStack Start server runtime. Cost efficiency and a generous free tier are also considerations for a personal/family project.

## Decision

Deploy to **Cloudflare Workers** using the `@cloudflare/vite-plugin` and `wrangler` CLI.

## Consequences

### Positive
- Edge deployment — low latency globally
- Generous free tier suitable for personal/family use
- R2 (object storage) and D1 (SQLite) are natural extensions for future apps, all within the Cloudflare ecosystem
- `nodejs_compat` flag provides Node.js API compatibility in Workers
- Official TanStack Start integration via Cloudflare Vite plugin

### Negative / Trade-offs
- Workers have a 100MB request body limit — relevant for file upload in the Files app
- Cold start behaviour differs from traditional servers
- Some Node.js APIs not available even with `nodejs_compat`
- Local development requires `wrangler dev` or the Cloudflare Vite plugin's dev mode

### Neutral
- `wrangler.jsonc` manages all deployment configuration
- Deploy command: `pnpm run deploy` (build + wrangler deploy)

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Vercel | No native Cloudflare R2/D1 ecosystem; more expensive at scale |
| Fly.io | Container-based; more operational overhead for a personal project |
| Node.js VPS | Self-managed infra; unnecessary complexity |
