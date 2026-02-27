# Architecture Overview

## Project Identity

- **Name**: exponencial
- **Type**: Full-stack web application
- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19, SSR, file-based routing)
- **Runtime**: Cloudflare Workers (edge SSR + API)
- **Package manager**: pnpm
- **Language**: TypeScript (strict mode)

---

## High-Level Structure

```
exponencial/
├── src/
│   ├── routes/          # File-based routing (pages + API endpoints)
│   ├── components/      # Shared React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Client-side utilities and integrations
│   ├── data/            # Static/hardcoded data
│   ├── db-collections/  # TanStack DB client-side collections
│   ├── integrations/    # Third-party provider setup (React Query)
│   ├── utils/           # Server-side utilities
│   ├── paraglide/       # Auto-generated i18n runtime (do not edit)
│   ├── router.tsx       # Router instance
│   ├── routeTree.gen.ts # Auto-generated route tree (do not edit)
│   └── styles.css       # Global Tailwind styles
├── docs/
│   ├── architecture.md  # This file
│   ├── adr/             # Architecture Decision Records
│   └── plans/           # Future application ideas and specs
├── messages/            # i18n message files (en.json, de.json)
├── public/              # Static assets
└── project.inlang/      # Paraglide i18n project config
```

---

## Routing

TanStack Router with **file-based routing**. Route files live in `src/routes/`.

| Pattern | Meaning |
|---|---|
| `index.tsx` | `/` (home) |
| `about.tsx` | `/about` |
| `demo/ai-chat.tsx` | `/demo/ai-chat` |
| `demo/guitars/$guitarId.tsx` | `/demo/guitars/:guitarId` |
| `__root.tsx` | Root layout (wraps all routes) |
| `api.*.ts` | API-only route (no UI) |

**Route tree** is auto-generated in `src/routeTree.gen.ts` — never edit this file directly.

### Root Layout (`src/routes/__root.tsx`)

Wraps every page with:
- `TanStackQueryProvider` (React Query context)
- `Header` (navigation)
- TanStack DevTools (Router, Query, Store)

---

## Rendering Model

TanStack Start uses **SSR with streaming** on Cloudflare Workers. Each route can define:
- `loader` — server-side data fetching (runs before render)
- `component` — the React component to render
- Server functions via `createServerFn` — type-safe server-only functions callable from the client

API-only routes export HTTP handlers (`GET`, `POST`, etc.) directly.

---

## State Management

| Layer | Tool | Use Case |
|---|---|---|
| Server state / async | TanStack Query | Data fetching, caching, mutations |
| Local app state | TanStack Store | Synchronous, reactive client state |
| Form state | TanStack Form | Form values, validation, submission |
| Client-side DB | TanStack DB | Structured local collections (e.g., messages) |

---

## AI Integration

Multiple LLM providers supported via `@tanstack/ai`:

| Provider | Trigger |
|---|---|
| Anthropic (Claude) | `ANTHROPIC_API_KEY` set |
| OpenAI | `OPENAI_API_KEY` set |
| Google Gemini | `GEMINI_API_KEY` set |
| Ollama (local) | Default fallback |

AI chat uses a **streaming server-sent events** pattern. The server runs an agent loop (max 5 iterations) to handle tool calls before streaming the final response.

**MCP (Model Context Protocol)** is also integrated — the app exposes an MCP server at `/mcp` that AI clients can connect to.

---

## Styling

- **Tailwind CSS v4** — utility classes, configured via Vite plugin
- **shadcn/ui** (new-york style, zinc base) — copy-paste component primitives
- **Radix UI** — accessible headless primitives underlying shadcn
- **class-variance-authority** — component variant patterns
- **OKLCH color space** — CSS custom properties for light/dark themes
- **tw-animate-css** — animation utilities

Global styles: `src/styles.css`
Component config: `components.json`

---

## Internationalization

**Paraglide JS** (`@inlang/paraglide-js`) with compile-time message extraction:
- Locales: `en` (base), `de`
- Message files: `messages/{locale}.json`
- Runtime output: `src/paraglide/` (auto-generated — do not edit)
- Strategy: URL-based locale detection with base-locale fallback

---

## Data Persistence

| Approach | Where | Used For |
|---|---|---|
| Cloudflare D1 | Edge SQLite | Finance transactions |
| TanStack DB (client) | Browser memory | Chat messages (demo) |
| In-memory store | Server process | MCP todos (resets on restart) |
| Static files | `src/data/` | Guitar inventory, table demo data |
| File system | `mcp-todos.json` | MCP todo persistence |

The Files sub-app will require **Cloudflare R2** (blob storage) when built.

---

## Code Quality Standards

### Testing Strategy

Three layers, outermost to innermost:

| Layer | Tool | Scope | Location |
|---|---|---|---|
| E2E | **Cypress** | Full user flows against a running Wrangler local server | `cypress/e2e/{domain}/` |
| Integration | **Vitest** + Testing Library | Application-layer logic (filters, stores, calculations) | `src/{domain}/tests/` |
| Unit | **Vitest** | Domain entities, pure functions, validation | `src/{domain}/domain/__tests__/` |

**Rule: every production feature must ship with at least one Cypress E2E test.** See [ADR-0009](adr/0009-cypress-e2e-testing.md).

- `npm run cy:run` — headless E2E suite (requires Wrangler local server running)
- `npm run cy:open` — interactive Cypress Test Runner
- `npm run test` — Vitest unit + integration suite

### Style & Formatting
- **Biome** for linting and formatting (replaces ESLint + Prettier)
- Double quotes, tab indentation
- `pnpm check` runs all Biome checks
- No unused locals or parameters (enforced by TypeScript strict mode)

### Architecture Principles
- **Domain-Driven Design** — organise code around business domains, not technical layers
- **ADRs** — significant decisions are documented in `docs/adr/`
- Keep `demo/` routes clearly separated from production features

---

## Deployment

```
pnpm run deploy
  └─ vite build
  └─ wrangler deploy → Cloudflare Workers
```

Entry point for the worker: `@tanstack/react-start/server-entry`
Wrangler config: `wrangler.jsonc`

---

## Key Configuration Files

| File | Purpose |
|---|---|
| `vite.config.ts` | Build configuration, all Vite plugins |
| `tsconfig.json` | TypeScript settings (`@/*` path alias) |
| `biome.json` | Linting and formatting rules |
| `components.json` | shadcn component generator config |
| `wrangler.jsonc` | Cloudflare Workers deployment config |
| `project.inlang/settings.json` | Paraglide i18n project settings |
| `.env.local` | Local environment variables (API keys, not committed) |

---

## Path Aliases

| Alias | Resolves to |
|---|---|
| `@/*` | `./src/*` |
