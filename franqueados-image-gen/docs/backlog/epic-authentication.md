# Epic: Franchisee Authentication (Cloudflare Access)

- **Status**: Backlog
- **Priority**: Medium
- **Estimated size**: S

## Goal

Restrict access to the image generation tool to authorised franchisees only. Use Cloudflare Access as the gate — no custom auth code needed in the MVP. Each franchisee's email is added to an allow-list in the Cloudflare dashboard, and the Worker extracts their identity from the Access JWT on every request.

This epic is marked Medium priority because the tool can be developed and tested without auth (localhost has no Access gate), but it must be in place before sharing with real franchisees.

## Scope

### In
- Document Cloudflare Access setup steps (dashboard configuration, not code)
- Worker middleware that validates the `CF-Access-JWT-Assertion` header and extracts `franchisee_id`
- Pass `franchisee_id` into all use cases (so generation history is per-franchisee)
- 401 response for missing or invalid JWT (for the dev/test environment without Access)
- Integration test: Worker middleware rejects request with no/invalid JWT, passes request with valid JWT
- Local dev bypass: env variable `DEV_FRANCHISEE_ID` that skips JWT validation when set

### Out
- Custom login page (Cloudflare Access provides its own)
- Per-franchisee permissions beyond allow/deny (future: D1 franchisee table with role column)
- Franchisee self-registration

## Tasks

- [ ] (XS) Write `docs/cloudflare-access-setup.md` with step-by-step dashboard instructions
- [ ] (S) Implement `validateAccessJwt` middleware in `apps/api/src/shared/middleware/`
- [ ] (XS) Wire middleware into the Worker router — applies to all `/api/*` routes except `/api/health`
- [ ] (S) Pass extracted `franchisee_id` as context through to use cases
- [ ] (S) Integration test: middleware — valid JWT passes, missing JWT returns 401, invalid JWT returns 401
- [ ] (XS) Add `DEV_FRANCHISEE_ID` to `.dev.vars.example` for local dev bypass
- [ ] (S) Update `GenerateImageUseCase` and `D1ImageRepository` to use `franchisee_id` for history scoping
- [ ] (S) Update `GET /api/history` to filter by `franchisee_id` from JWT
- [ ] (XS) Verify all existing integration tests still pass with the middleware in place

## Done When

- Requests to `/api/generate` and `/api/history` without a valid Cloudflare Access JWT return 401
- Requests with a valid JWT proceed, with `franchisee_id` correctly extracted from the JWT
- Local dev can be run with `DEV_FRANCHISEE_ID` set in `.dev.vars` to bypass JWT validation
- Generation history is scoped per-franchisee (each franchisee only sees their own images)
- All integration tests pass
- Documentation exists for the product owner to add/remove franchisee emails in Cloudflare Access
