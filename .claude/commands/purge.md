# /purge — Clean Dead Code, Packages, and Abandoned Artifacts

Audit the codebase for unused files, dead exports, stale packages, and abandoned config artifacts. Remove what is safe. Report what needs a human decision.

---

## Phase 1 — Dead Code (knip)

Run:
```bash
npm run knip
```

Capture and categorize the output into:
- **Unused files** — source files with no importers
- **Unused exports** — symbols exported but never consumed
- **Unused dependencies** — packages in package.json not imported anywhere
- **Unused devDependencies** — same for devDependencies

Print a table with counts per category. If knip exits zero (nothing found), skip to Phase 3.

---

## Phase 2 — Remove What knip Flags as Safe

### Unused exports
For each unused export:
- Read the file.
- If the export is a named export and removing it does not break the file's default export or other exports, remove the `export` keyword or the entire declaration.
- If the file becomes empty after removal, delete the file.
- Do NOT auto-remove exports from files in `src/paraglide/` (auto-generated) or `src/routeTree.gen.ts`.

### Unused files
For each unused file flagged by knip:
- Read the file.
- If it is auto-generated (`src/paraglide/`, `src/routeTree.gen.ts`), skip it.
- If it is a test file with no corresponding source file, delete it.
- If it is a source file, delete it.

### Unused dependencies
For each unused package flagged by knip:
- Before removing, search for any dynamic import or string reference that knip may have missed:
  ```bash
  grep -r "<package-name>" src/ --include="*.ts" --include="*.tsx" --include="*.json" -l
  ```
- If no references found, remove with:
  ```bash
  npx pnpm remove <package-name>
  ```
- List every removed package.

---

## Phase 3 — Scan for Known Abandoned Artifacts

Check for these patterns that knip cannot detect (config dirs, non-JS assets):

### 3a. Orphaned config directories
Look for directories in the repo root that have a corresponding package in `package.json` that is flagged unused, OR where the tool they configure is not referenced in any script or source file.

For each directory found:
- Print its name and purpose.
- Check if any `vite.config.ts`, `package.json` script, or `src/` file references it.
- If zero references: mark as **safe to remove**.
- If references exist: mark as **in use** and explain where.

### 3b. Unreferenced message/locale files
Check `messages/` directory (if it exists at repo root):
```bash
ls messages/ 2>/dev/null
```
For each locale file, check if that locale appears in `project.inlang/settings.json` under `locales`. If not listed, it is orphaned — mark for removal.

### 3c. Stale migration files
List `migrations/` files. For each, check if the corresponding table is referenced anywhere in `src/`. Flag (do NOT auto-delete) any migration whose table name appears nowhere in the source.

---

## Phase 4 — Apply Safe Removals

After analysis, present a removal plan:

```
SAFE TO REMOVE (will execute):
  - [list files/dirs/packages]

NEEDS REVIEW (will NOT touch):
  - [list with reason]
```

Ask: "Execute the safe removals? (yes/no)"

If yes:
- Delete all files/dirs marked safe.
- Run package removal commands.
- Run `npm run check` and `npx tsc --noEmit` to verify nothing broke.
- If either fails, print the error, restore what was deleted (if possible), and abort.

---

## Phase 5 — Verify

Run:
```bash
npm run knip     # should exit 0 or fewer findings than before
npm run check    # Biome must pass
npx tsc --noEmit # TypeScript must pass
npm run test     # tests must pass
```

If all pass: print a summary of what was removed and the before/after knip finding counts.
If any fail: print the failure, list what was changed, and suggest rollback via `git checkout -- .` for file changes or `git stash` if packages were also changed.

---

## Phase 6 — Commit

If changes were made and all checks pass:
```bash
git add -A
git commit -m "chore: purge dead code and unused dependencies"
```

Report: "Purge complete. X files removed, Y exports cleaned, Z packages uninstalled."
