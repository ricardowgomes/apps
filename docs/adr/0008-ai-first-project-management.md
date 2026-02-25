# ADR-0008: AI-First Project Management — In-Repo Backlog

- **Date**: 2026-02-24
- **Status**: Accepted

## Context

exponencial is an AI-first project: Claude writes most code, proposes architecture, and makes the majority of implementation decisions within bounds set by Ricardo. This creates a challenge for project management:

- Claude starts each session with no memory of prior work. It needs structured, self-contained task specifications to pick up where the last session left off.
- External PM tools (Linear, Jira, GitHub Issues) require context-switching out of the terminal, and Claude has no native write access to them.
- Task descriptions that live close to the code are easier to keep accurate — they can reference real file paths, domain patterns, and architectural decisions without re-explaining them.
- The project has no team, no sprints, and no deadlines. The overhead of a full PM tool is unjustified.

## Decision

Use **markdown files in `docs/backlog/`** as the single source of truth for planned work.

### Structure

```
docs/backlog/
  README.md            ← format reference and working conventions
  epic-{slug}.md       ← one file per epic
```

### Epic format

Each epic file contains:

- **Status** — `Backlog | In Progress | Done`
- **Priority** — `High | Medium | Low`
- **Goal** — one paragraph explaining the problem and why it matters
- **Scope** — explicit In / Out lists to prevent creep
- **Tasks** — checkbox list with size labels: `(XS)` `(S)` `(M)` `(L)`
- **Done When** — acceptance criteria

### Task sizes

| Label | Scope | Claude's approach |
|---|---|---|
| XS | Single file, zero ambiguity | Execute immediately, no planning |
| S | 2–4 files, clear requirements | Execute immediately |
| M | Multi-file, one domain, minor design decisions | Brief plan, then execute |
| L | Multi-domain or unclear scope | Break down into smaller tasks first — do not execute blind |

### Roles

- **Ricardo** — product owner: sets priority, approves epics, makes product decisions
- **Claude** — primary implementer and co-author: proposes task sizes and scope boundaries, executes tasks, updates task status as work progresses, flags blockers

### Session start convention

At the start of each session, Claude checks `docs/backlog/` to understand active epics and pending tasks. `CLAUDE.md` references this location so it is never missed.

## Consequences

### Positive

- No context-switching — everything Claude needs is in the repo
- Claude reads task files natively using the same tools it uses for code
- Backlog evolves alongside the code; task descriptions can reference real file paths
- Simple enough to sustain discipline over the long term

### Negative / Trade-offs

- No notifications, timeline views, or multi-user collaboration features
- Requires Claude to diligently update task status within each session
- No automated tracking — a task only moves to Done when Claude or Ricardo updates the file

### Neutral

- The `docs/plans/` directory is superseded by `docs/backlog/` for active work; plan files are kept as historical reference and domain specs

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| GitHub Issues | Claude has no write access; requires browser; disconnected from code context |
| Linear / Jira | Heavy overhead; external; no native Claude access; unjustified for a one-person project |
| TODO/FIXME comments | Too scattered; no overview; gets stale as code moves |
| Single `backlog.md` | Becomes unwieldy as epics grow; one file per epic is easier to navigate |
