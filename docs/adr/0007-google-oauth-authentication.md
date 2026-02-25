# ADR-0007: Google OAuth Authentication with Session-Based Access Control

**Date**: 2026-02-23
**Status**: Accepted

## Context

The finance tracker and future sub-apps require authentication to prevent public access. The app is a personal/family project where only a known set of email addresses should be permitted. We need a cost-free, low-maintenance solution that works on Cloudflare Workers (edge runtime).

## Decision

Implement Google Sign-In via OAuth 2.0 (PKCE flow) using the `arctic` library. Sessions are stored in Cloudflare D1. Access is gated by a pre-authorized email allowlist stored as an environment variable.

### Why Google OAuth

- **Free**: No usage limits or fees for standard identity/authentication
- **Zero user management**: No passwords to store or reset; Google handles identity verification
- **Familiar UX**: "Sign in with Google" is universally understood
- **Personal scope**: Only pre-authorized emails can access the app — others receive a 403

### Why `arctic`

- Thin (~5 KB), edge-compatible OAuth client — no Node.js dependencies
- Works identically in Cloudflare Workers and local dev (Miniflare)
- Supports PKCE natively, avoiding client-secret exposure in browser
- Minimal surface area: does one thing (OAuth flows) and does it well

### Why Session-Based (not JWT)

- Sessions stored in D1 can be revoked server-side (e.g., by deleting the row)
- No JWT signing secret to manage
- Session expiry is enforced at the DB layer (`expires_at` column), not trusting client-provided tokens
- D1 is already in use for the finance domain — no extra infrastructure needed

### Why email allowlist as an env var (not DB table)

- The set of authorized users changes very rarely for a personal/family app
- Updating via Cloudflare dashboard or `wrangler.jsonc` is simpler than a DB admin UI
- Keeps the auth check in application code, not a DB join on every callback

## Implementation

### OAuth Flow (PKCE)

```
User → /api/auth/google → set PKCE cookies → 302 → Google consent
Google → /api/auth/callback/google?code&state
       → validate state, exchange code+verifier for tokens
       → check email in ALLOWED_EMAILS
       → create D1 session, set session cookie
       → 302 → /finance
```

### Session Cookie

- Name: `session_id`
- HttpOnly, Secure, SameSite=Lax
- 30-day expiry (Max-Age)
- Session ID is a UUID; the real data lives in D1

### Route Protection

- Root `beforeLoad` in `__root.tsx` calls `getSessionFn()` on every request
- Returns `SessionUser | null`, injected into the router context as `context.user`
- Protected routes check `context.user` in their own `beforeLoad` and redirect to `/login` if null
- Public routes (e.g., `/`) never check auth — the root context load is passive

### Environment Variables

| Variable | Kind | Location |
|---|---|---|
| `ALLOWED_EMAILS` | var | `wrangler.jsonc` + `.dev.vars` |
| `GOOGLE_REDIRECT_URI` | var | `wrangler.jsonc` + `.dev.vars` |
| `GOOGLE_CLIENT_ID` | secret | `wrangler secret put` + `.dev.vars` |
| `GOOGLE_CLIENT_SECRET` | secret | `wrangler secret put` + `.dev.vars` |

## Consequences

### Positive

- Zero ongoing cost
- Sessions are revocable
- No password storage or recovery flows
- Allowlist check is a single O(n) string comparison (n = number of allowed emails, typically < 5)

### Negative

- Requires a Google Cloud project with OAuth credentials set up once
- Users must have a Google account
- `getSessionFn()` fires a D1 query on every page load (acceptable at personal-app scale)

### Neutral

- Session cleanup (expired rows) is lazy — rows linger until next logout. A Cloudflare Cron Trigger could automate this if needed.
- The allowlist is case-sensitive; emails must match exactly as Google returns them (lowercase).
