# ADR-0002: Cloudflare Deployment Stack (Pages + Workers + D1 + R2)

- **Date**: 2026-04-10
- **Status**: Accepted

## Context

The project needs:
- A CDN-hosted frontend (SPA)
- An edge API that can call Fal.ai and manage data
- A relational database for generation history and brand config
- Object storage for generated images and brand assets (logo, reference product photos)

The entire stack must run at the edge for low latency, have a generous free tier suitable for a franchisee tool at moderate scale, and be manageable by a single developer (or Claude) without DevOps overhead.

## Decision

Use the full Cloudflare stack:

| Need | Cloudflare product |
|------|-------------------|
| Frontend hosting | **Cloudflare Pages** — SPA deploy via `wrangler pages deploy` |
| API / backend logic | **Cloudflare Workers** — TypeScript, runs at the edge |
| Relational data | **Cloudflare D1** — SQLite compatible, bound to the Worker |
| File / image storage | **Cloudflare R2** — S3-compatible object store, no egress fees |

All products are within the same Cloudflare account and accessed via Worker bindings — no extra SDK credentials for DB or storage in production.

## Consequences

### Positive
- Zero-config connectivity between Workers, D1, and R2 via bindings (no connection strings)
- R2 has no egress fees — serving generated images is cost-free
- Generous free tier: 100k Worker requests/day, 5GB D1 storage, 10GB R2 storage
- `wrangler dev` runs the full backend locally, including D1 and R2 via local emulation
- Pages deploy is as simple as `wrangler pages deploy dist/`
- Single provider = single dashboard, single billing, simpler for a small team

### Negative / Trade-offs
- Workers CPU time limit (10ms on free, 30s on paid) — Fal.ai calls are async so this is not an issue, but long-running synchronous work is constrained
- D1 is SQLite — no advanced Postgres features (e.g., full-text search, JSON operators)
- R2 objects are not publicly accessible by default — must configure a custom domain or use signed URLs
- `nodejs_compat` flag needed for some Node.js modules in Workers

### Neutral
- D1 migrations managed via `wrangler d1 migrations`
- R2 bucket names and D1 database names are configured in `wrangler.jsonc`
- Local dev uses `.dev.vars` for secrets (mirrors Cloudflare Workers secrets in production)

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Vercel + PlanetScale + S3 | Multi-provider complexity; egress costs on S3; no edge-native binding model |
| Supabase + Vercel | PostgreSQL is overkill for this domain; adds auth complexity that Cloudflare Access already solves |
| Railway / Fly.io | Container-based; more DevOps surface; no edge distribution without extra CDN |
| AWS (Lambda + RDS + S3) | Heavy operational overhead; complex IAM; not AI-friendly to configure |
