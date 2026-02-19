# ADR-0006: Localisation — English and Brazilian Portuguese

- **Date**: 2026-02-18
- **Status**: Accepted

## Context

The site and its sub-applications serve two primary audiences:

1. **English-speaking** — international users, potential employers, and collaborators who discover the portfolio.
2. **Brazilian Portuguese-speaking** — Ricardo's personal network, family, and Brazilian professional contacts who will use both the portfolio and the planned family-facing sub-apps (Finance tracker, File storage).

The scaffold originally included German (`de`) as a second locale, left over from the i18n demo. German has no real audience in this project and should not be maintained going forward.

The i18n infrastructure is already in place: **Paraglide JS** (via `@inlang/paraglide-js`) handles compile-time message extraction and tree-shaken locale bundles. The `project.inlang/settings.json` config and `messages/{locale}.json` source files are the single source of truth.

## Decision

Support exactly **two locales**:

| Tag | Language |
|---|---|
| `en` | English (base locale) |
| `pt-BR` | Brazilian Portuguese |

- `en` remains the `baseLocale` in `project.inlang/settings.json`.
- `pt-BR` replaces `de` as the second locale.
- All user-visible strings must have entries in both `messages/en.json` and `messages/pt-BR.json`.
- The `messages/de.json` file and the generated `src/paraglide/messages/de.js` are removed.
- Language detection follows the existing Paraglide middleware strategy: negotiate from `Accept-Language` header, fall back to `en`.
- No additional locales are added unless a new audience need is explicitly identified and recorded in a future ADR.

## Consequences

### Positive
- Content is accessible to Ricardo's primary real-world audiences without language barriers.
- Keeping exactly two locales minimises translation maintenance burden.
- Paraglide's compile-time approach means each locale bundle is tree-shaken — shipping `pt-BR` adds no runtime overhead for English users.
- Removing unused German strings reduces dead code and simplifies the message files.

### Negative / Trade-offs
- Removing German breaks the existing `de` demo routes and any German demo copy; those must be migrated or deleted.
- Maintaining parity between `en` and `pt-BR` message files is a manual discipline — there is no automated translation or completeness check beyond Paraglide's compile-time errors for missing keys.
- Brazilian Portuguese (`pt-BR`) is a specific regional variant; generic `pt` (European Portuguese) is not targeted and may feel slightly off to European Portuguese speakers.

### Neutral
- The `src/paraglide/` directory is auto-generated and must never be edited manually — regenerated on `vite dev` / `vite build` after changing `project.inlang/settings.json`.
- URL strategy (e.g., `/en/`, `/pt-BR/` path prefixes vs. cookie/header-only) is an implementation detail to be decided when the locale switcher UI is built; this ADR does not mandate it.

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| English only | Excludes Ricardo's Brazilian network and family who will use the family sub-apps |
| English + Spanish | Larger global reach, but Spanish is not Ricardo's native language and not the target family audience |
| English + German + Brazilian Portuguese | Three locales triples translation effort with no real audience for German |
| Generic Portuguese (`pt`) instead of `pt-BR` | Ricardo and the family audience are Brazilian; `pt-BR` is the correct regional tag and avoids European Portuguese idioms |
