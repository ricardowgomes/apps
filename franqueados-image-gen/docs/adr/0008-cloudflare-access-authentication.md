# ADR-0008: Cloudflare Access for Franchisee Authentication

- **Date**: 2026-04-10
- **Status**: Accepted

## Context

Only authorised franchisees should be able to access the image generation tool. The authentication requirements are:

- Simple to set up and maintain (no custom user database to build initially)
- Does not require franchisees to create yet another account/password
- Can be tightened (allow-list by email) as the franchise network grows
- Should not add significant latency to the request path
- The product owner should be able to grant/revoke access without a code deploy

Building custom auth (JWT, sessions, OAuth) is significant scope for an MVP. The infrastructure already runs on Cloudflare.

## Decision

Use **Cloudflare Access** as the authentication layer for the franchisee-facing app.

**How it works:**
1. Cloudflare Access sits in front of the Workers URL (configured in the Cloudflare dashboard)
2. Unauthenticated requests are redirected to a login page (OTP via email, or Google/Microsoft SSO)
3. After login, Cloudflare issues a signed JWT (`CF-Access-JWT-Assertion` header) on every request to the Worker
4. The Worker validates the JWT using Cloudflare's JWKS endpoint and extracts `franchisee_id` (the email or sub claim)
5. No session management code; no password storage; no custom auth routes

**Access policy:**
- Start with an email allow-list (one entry per franchisee email)
- Upgrade to Google Workspace SSO if the franchisor uses Google Workspace

## Consequences

### Positive
- Zero custom auth code in the MVP — Cloudflare handles login, session, and JWT issuance
- Access policies are managed in the Cloudflare dashboard — no code deploy needed to add/remove a franchisee
- Supports OTP (email magic link), Google, Microsoft, GitHub — franchisees choose
- JWT validation is a few lines of code using `@cloudflare/workers-types` and the JWKS endpoint
- Free for up to 50 seats on the Cloudflare Zero Trust free tier

### Negative / Trade-offs
- Franchisees are redirected to a Cloudflare-branded login page — not fully white-labelled without a paid plan
- JWT expiry requires refresh; franchisees may be logged out mid-session (acceptable for an MVP)
- Access is all-or-nothing at the app level initially — fine-grained permissions (e.g., admin vs. franchisee) require additional logic in the Worker
- Local development requires bypassing Access (use a test JWT or a dev-only allow-all policy)

### Neutral
- The Worker extracts `franchisee_id` from the JWT and passes it down to use-cases — all downstream code is identity-aware
- Admin routes (`/api/brand/*`) require a separate Access policy restricted to the product owner's email
- JWT verification: `https://<your-team>.cloudflareaccess.com/cdn-cgi/access/certs`

## Migration Path

When a custom auth system is needed (e.g., franchisee self-registration, tiered permissions):
1. Keep Cloudflare Access as the outer gate
2. Add a `franchisees` table in D1 for profile data and permission flags
3. The JWT `sub` claim maps to the D1 record

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Custom JWT auth (email + password) | Significant scope: password hashing, session storage, reset flows — not MVP |
| Auth.js (NextAuth) | Requires a Node.js runtime; Workers use `nodejs_compat` but Auth.js adds complexity |
| Clerk / Auth0 | External service cost; more integration surface; not native to Cloudflare |
| HTTP Basic Auth via Worker | No per-user identity; credentials shared; no revocation without code deploy |
