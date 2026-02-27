# Backlog

Active epics and tasks for the exponencial project. This replaces external PM tools — everything lives in the repo, close to the code.

See [ADR-0008](../adr/0008-ai-first-project-management.md) for the full rationale.

---

## Epics

| File | Epic | Status | Priority |
|---|---|---|---|
| [epic-devops.md](epic-devops.md) | DevOps & CI/CD | Backlog | High |
| [epic-finance.md](epic-finance.md) | Finance Tracker | In Progress | High |
| [epic-portfolio.md](epic-portfolio.md) | Portfolio Showcase | Backlog | Medium |
| [epic-files.md](epic-files.md) | File Storage & Indexing | Backlog | Low |

---

## Task Sizes

| Label | Scope | Approach |
|---|---|---|
| XS | Single file, zero ambiguity | Execute immediately |
| S | 2–4 files, clear requirements | Execute immediately |
| M | Multi-file, one domain, minor design choices | Brief plan, then execute |
| L | Multi-domain or unclear scope | Break down first — do not execute blind |

---

## How It Works

1. **Ricardo** picks the next task and names it at the start of a session
2. **Claude** reads the epic file, executes the task, updates the checkbox when done
3. If a task turns out larger than its label, Claude flags it and proposes a breakdown before continuing
4. When all tasks in an epic are checked, update its Status to `Done`

---

## Adding a New Epic

Create `docs/backlog/epic-{slug}.md` using this template:

```markdown
# Epic: {Name}

- **Status**: Backlog
- **Priority**: High | Medium | Low

## Goal

One paragraph: what problem this solves and why it matters.

## Scope

**In:**
- ...

**Out:**
- ...

## Tasks

- [ ] (S) Task description

## Done When

- [ ] Criterion
```

Then add a row to the table above.
