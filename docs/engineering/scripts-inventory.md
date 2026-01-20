# Scripts Inventory

**Generated:** 2026-01-20
**Purpose:** Catalog all scripts (.sh, .mjs, .js, .py, .sql) with purpose and usage

---

## Shell Scripts (.sh) - 20 total

| Script | Purpose | Referenced By | Duplicates | Decision |
|--------|---------|---------------|------------|----------|
| `.claude/scripts/session-token-report.sh` | Claude session report | .claude hooks | - | **KEEP** (agent tooling) |
| `.claude/scripts/statusline-fixed.sh` | Fix statusline | .claude hooks | `scripts/claude/statusline-fixed.sh` | **DELETE DUPLICATE** |
| `.claude/scripts/task-completed.sh` | Task completion hook | .claude hooks | `scripts/claude/task-completed.sh` | **DELETE DUPLICATE** |
| `.tasks/generate-index.sh` | Generate .tasks/INDEX.md | Manual | - | **KEEP** (workflow) |
| `scripts/claude/install-git-hooks.sh` | Install git hooks | Manual/docs | - | **KEEP** (setup) |
| `scripts/claude/repo-audit.sh` | Repo audit | Manual | - | **KEEP** (maintenance) |
| `scripts/claude/repo-doctor.sh` | Repo health check | Manual | - | **KEEP** (maintenance) |
| `scripts/claude/statusline-fixed.sh` | Fix statusline | DUPLICATE | `.claude/scripts/statusline-fixed.sh` | **DELETE** (duplicate) |
| `scripts/claude/task-completed.sh` | Task completion | DUPLICATE | `.claude/scripts/task-completed.sh` | **DELETE** (duplicate) |
| `scripts/claude/validate-pr-ready.sh` | Validate PR ready | Manual/CI? | - | **KEEP** (validation) |
| `scripts/dev-clean.sh` | Clean dev artifacts | Manual | - | **KEEP** (dev) |
| `scripts/dev-stop.sh` | Stop dev servers | Manual | - | **KEEP** (dev) |
| `scripts/guard-no-global-zoom.sh` | Guard against global zoom | Git hooks? | - | **AUDIT** (used?) |
| `scripts/maintenance/clean-test-artifacts.sh` | Clean test artifacts | package.json (`clean:test-artifacts`) | - | **KEEP** (used ✅) |
| `scripts/maintenance/repo-hygiene.sh` | Repo hygiene check | Manual | - | **KEEP** (maintenance) |
| `scripts/testing/test-form-api.sh` | Test form API | Manual | - | **KEEP** (testing) |
| `scripts/validate-env.sh` | Validate env vars | Manual/docs | - | **KEEP** (setup) |
| `tools/scripts/docs-audit-v4.sh` | Docs audit (v4) | Manual/CI | - | **KEEP** (docs) |
| `tools/scripts/parse-migrations.sh` | Parse migrations | Manual | - | **KEEP** (db tools) |
| `tools/scripts/repo-audit-v2.sh` | Repo audit (v2) | Manual | - | **AUDIT** (vs `scripts/claude/repo-audit.sh`?) |

---

## Duplicates Detected (2 pairs)

| File 1 | File 2 | Diff | Recommendation |
|--------|--------|------|----------------|
| `.claude/scripts/statusline-fixed.sh` | `scripts/claude/statusline-fixed.sh` | Identical? | **DELETE** `scripts/claude/` version |
| `.claude/scripts/task-completed.sh` | `scripts/claude/task-completed.sh` | Identical? | **DELETE** `scripts/claude/` version |

**Rationale:** `.claude/` is canonical source for Claude Code tooling

---

## Audit Required (3 items)

**1. `scripts/guard-no-global-zoom.sh`:**
- Check if referenced in git hooks
- Check if referenced in package.json
- If unused, delete

**2. `tools/scripts/repo-audit-v2.sh` vs `scripts/claude/repo-audit.sh`:**
- Compare functionality (diff)
- Keep canonical version
- Delete or merge duplicate

**3. SQL scripts in supabase/:**
- Not counted here (migrations, legitimate)
- Separate inventory if needed

---

## Summary

| Category | Count | Action |
|----------|-------|--------|
| **KEEP** (in use) | 15 | No action |
| **DELETE** (duplicates) | 2 | Remove scripts/claude/{statusline-fixed,task-completed}.sh |
| **AUDIT** (need investigation) | 3 | Check usage/duplicates |

---

**Next:** Agent/Cache folders audit
