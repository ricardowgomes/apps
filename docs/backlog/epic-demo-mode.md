# Epic: Demo Mode for Signed-Out Users

- **Status**: Planned
- **Priority**: Medium

## Goal

Allow signed-out users to explore all finance features (transactions, categories, portfolio) using mock data — no account required. Real user data must never be accessible to demo users.

## Scope

**In:**
- Remove auth redirect from `/finance/*` — unauthenticated users land on finance instead of `/login`
- Mock data fixtures (realistic transactions, categories, portfolio entries)
- Hooks return mock data when `user = null`, skipping server fn calls entirely
- Mutations are client-side-only no-ops when `user = null` (optimistic cache update, never hits the server, resets on refresh)
- Demo banner shown when `user = null` with a sign-in link

**Out:**
- Persisting demo data across sessions (intentional — demo resets on refresh)
- Per-user demo sandboxes
- DB changes or migrations of any kind
- Server function changes

## Design Decisions

- **No DB changes** — demo is purely client-side; server functions are never called in demo mode
- **Two data scopes only**: demo (`user = null`, mock fixtures) and real (`user` present, D1 data). No per-user isolation within signed-in users — all whitelisted users share the same real data, as before.
- **Mock data lives in a fixture file** — realistic enough to showcase the app (3 months of transactions, a few portfolio entries, default categories)
- **Mutations update the local TanStack Query cache only** — the UI feels fully interactive in demo mode; data simply resets on page refresh

## Tasks

- [ ] (S) Remove `beforeLoad` auth guard from `/finance`, `/finance/categories`, `/finance/portfolio` — allow `user = null` through; keep `/login` redirect as an option the user can choose
- [ ] (S) Create mock data fixture file at `src/finance/demo/fixtures.ts` — transactions (3 months), categories (reuse defaults), portfolio entries (2–3 investments, 1 debt)
- [ ] (M) Update `useTransactions`, `useCategories`, `usePortfolioEntries` hooks — when `!user`, return fixture data via `initialData` / conditional early return; skip server fn call
- [ ] (M) Update mutation hooks (`useCreateTransaction`, `useRemoveTransaction`, etc.) — when `!user`, perform optimistic cache update only; do not call server fn
- [ ] (S) `DemoBanner` component — shown in the finance layout when `!user`; brief message + "Sign in" link; dismissible for the session
- [ ] (S) E2E test — demo flow: visit `/finance` signed out, verify mock data is visible, verify add/delete works in the UI, verify banner is present

## Done When

- [ ] Signed-out user can visit `/finance` and see realistic mock data without being redirected to `/login`
- [ ] Signed-out user can add, edit, and delete transactions — changes reflect in the UI but reset on refresh
- [ ] Demo banner is visible with a working sign-in link
- [ ] Real user data is unreachable without a valid session (server functions still require auth for D1 access)
- [ ] All tests pass (`npm run test`, `npm run check`, `npx tsc --noEmit`)
