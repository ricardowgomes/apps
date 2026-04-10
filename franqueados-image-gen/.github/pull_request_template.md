## Summary

<!-- 2-4 bullet points describing what changed and why -->

- 
- 

<!-- If closing a GitHub Issue: -->
<!-- Closes #<issue-number> -->

## Ship gates

<!-- All must be green before merging -->

- [ ] `pnpm test` — all Vitest tests pass
- [ ] `pnpm check` — Biome lint + format clean
- [ ] `pnpm tsc` — TypeScript strict, no errors
- [ ] `pnpm knip` — no dead exports or unused imports

## Testing

<!-- How was this tested? Check all that apply -->

- [ ] Unit tests added / updated
- [ ] Integration tests added / updated
- [ ] E2E test added / updated (required for every production feature)
- [ ] Manually tested in `pnpm dev`

## Notes for reviewer

<!-- Anything the reviewer should pay special attention to, or decisions made during implementation -->
