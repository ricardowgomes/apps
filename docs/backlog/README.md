# Backlog

Task tracking for the exponencial project.

**Primary source of truth: [GitHub Issues](https://github.com/ricardowgomes/apps/issues)**

Epic files in this directory provide high-level scope and context. Individual tasks live as GitHub Issues.

See [ADR-0008](../adr/0008-ai-first-project-management.md) for the full rationale.

---

## GitHub Issue Labels

### Status labels (workflow)

| Label | Meaning |
|---|---|
| `status: in story writing` | Ricardo is writing the spec — not ready for Claude yet |
| `status: ready to pull` | Spec complete — Claude picks this up autonomously |
| `status: in progress` | Claude is actively implementing |
| *(closed)* | Done — PR merged, issue auto-closed via `Closes #N` |

### Priority labels

| Label | Meaning |
|---|---|
| `priority: high` | Work on this first |
| `priority: medium` | Normal queue |
| `priority: low` | Nice to have |

---

## How It Works

### Fully automated path
1. Ricardo creates an issue and sets `status: in story writing`
2. Ricardo writes the spec in the issue body, then applies `status: ready to pull`
3. GitHub Actions (`feature-manager.yml`) triggers automatically:
   - Moves issue to `status: in progress`
   - Claude Code implements the feature on a new branch
   - Opens a PR with `Closes #N`
4. PR is reviewed and merged → issue auto-closes

### Interactive path (Claude Code session)
1. Say "go" or "pick up the next task"
2. Claude reads open issues with `status: ready to pull` via MCP tools
3. Picks highest-priority one, moves to `status: in progress`, implements
4. Opens PR with `Closes #N`

---

## Task Sizes (for issue labels)

| Label | Scope | Approach |
|---|---|---|
| `size: XS` | Single file, zero ambiguity | Execute immediately |
| `size: S` | 2–4 files, clear requirements | Execute immediately |
| `size: M` | Multi-file, one domain, minor design choices | Brief plan, then execute |
| `size: L` | Multi-domain or unclear scope | Break down first — do not execute blind |

---

## Epics (high-level plans)

| File | Epic | Status | Priority |
|---|---|---|---|
| [epic-devops.md](epic-devops.md) | DevOps & CI/CD | Backlog | High |
| [epic-finance.md](epic-finance.md) | Finance Tracker | In Progress | High |
| [epic-portfolio.md](epic-portfolio.md) | Portfolio Showcase | Backlog | Medium |
| [epic-files.md](epic-files.md) | File Storage & Indexing | Backlog | Low |
| [epic-stories.md](epic-stories.md) | AI Illustrated Stories | Planned | Medium |
