# ADR-0007: AI-First Project Management — In-Repo Backlog

- **Date**: 2026-04-10
- **Status**: Accepted

## Context

This is an AI-first project: Claude writes most code, proposes architecture, and makes implementation decisions within bounds set by the product owner. This creates a project management challenge:

- Claude starts each session with no memory of prior work. It needs self-contained, structured task specs to pick up where the last session ended.
- The overhead of a full PM tool (Linear, Jira) is unjustified for a single-developer project.
- Task descriptions that live in the repo can reference real file paths, domain patterns, and ADRs without re-explaining them.

## Decision

Use **markdown files in `docs/backlog/`** as the primary source of planned work, with GitHub Issues as a preferred alternative when available in the session.

### Backlog structure

```
docs/backlog/
  README.md                    ← format reference and working conventions
  epic-monorepo-setup.md       ← Turborepo + scaffold
  epic-brand-context.md        ← Brand document upload + system prompt
  epic-image-generation.md     ← Generation UI + Fal.ai integration
  epic-authentication.md       ← Cloudflare Access setup
```

### Epic format

Each epic file contains:

- **Status** — `Backlog | In Progress | Done`
- **Priority** — `High | Medium | Low`
- **Goal** — one paragraph: the problem and why it matters
- **Scope** — explicit In / Out lists to prevent scope creep
- **Tasks** — checkbox list with size labels: `(XS)` `(S)` `(M)` `(L)`
- **Done When** — acceptance criteria (testable)

### Task sizes

| Label | Scope | Claude's approach |
|-------|-------|-------------------|
| XS | Single file, zero ambiguity | Execute immediately, no planning |
| S | 2–4 files, clear requirements | Execute immediately |
| M | Multi-file, one domain, minor design decisions | Brief plan, then execute |
| L | Multi-domain or unclear scope | Break down into smaller tasks first — do not execute blind |

### Session start convention

At the start of each session, Claude reads `docs/backlog/` to understand active epics and pending tasks. `CLAUDE.md` references this location.

### GitHub Issues (when MCP tools are available)

If the GitHub MCP server is available in the session, prefer Issues over backlog files:

```
status: in story writing  →  (Claude plans)  →  status: ready to pull
status: ready to pull     →  (Claude starts)  →  status: in progress
status: in progress       →  (PR merged)      →  closed (auto via "Closes #N")
```

## Consequences

### Positive
- No context-switching — everything Claude needs is in the repo
- Claude reads and writes backlog files using the same tools it uses for code
- Task descriptions evolve alongside the codebase; they can reference real file paths
- Simple enough to sustain discipline over the long term

### Negative / Trade-offs
- No notification system, timeline views, or multi-user features
- Requires Claude to update task status diligently within each session
- GitHub Issues are preferred but require MCP server access

### Neutral
- `docs/logs/` records what was shipped and why — used as historical reference, not for planning

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| GitHub Issues only | Requires MCP server access which may not always be available |
| Linear / Jira | Heavy overhead; external; no native Claude access |
| TODO/FIXME comments | Too scattered; no overview; gets stale as code moves |
| Single `backlog.md` | Becomes unwieldy as epics grow |
