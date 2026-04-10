# Backlog — Gerador de Imagens para Franqueados

This directory contains the feature backlog as markdown epic files. Claude reads this at the start of each session to understand what to work on next.

## Format

Each epic file follows this template:

```markdown
# Epic: [Title]

- **Status**: Backlog | In Progress | Done
- **Priority**: High | Medium | Low
- **Estimated size**: S | M | L | XL

## Goal
One paragraph: the problem and why it matters.

## Scope

### In
- ...

### Out (explicitly not doing)
- ...

## Tasks
- [ ] (S) Task description
- [ ] (M) Task description
- [x] (XS) Completed task

## Done When
- Acceptance criterion 1
- Acceptance criterion 2
```

## Task Size Guide

| Label | Scope | Claude's approach |
|-------|-------|-------------------|
| XS | Single file, zero ambiguity | Execute immediately |
| S | 2–4 files, clear requirements | Execute immediately |
| M | Multi-file, one domain | Brief plan, then execute |
| L | Multi-domain or unclear | Break down first — do not execute blind |

## Epic Priority Order

1. `epic-monorepo-setup.md` — **High** — nothing else can start without the scaffold
2. `epic-brand-context.md` — **High** — needed before image generation works correctly
3. `epic-image-generation.md` — **High** — the core product feature
4. `epic-authentication.md` — **Medium** — needed before giving access to franchisees
