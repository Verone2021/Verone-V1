# Repo Root Audit

**Generated:** 2026-01-20
**Purpose:** Inventory top-level folders/files with purpose, owner, references

---

## Top-Level Items (47 total)

| Item | Type | Purpose | Owner | Referenced By | Decision |
|------|------|---------|-------|---------------|----------|
| `.claude/` | Folder | Agent configs (commands, agents, plans) | Infra | Claude Code CLI | **KEEP** (config) |
| `.env.example` | File | Example env vars | Infra | Docs | **KEEP** (template) |
| `.env.local` | File | Local env vars | Dev | .gitignore | **KEEP** (local only) |
| `.eslintignore` | File | ESLint ignore patterns | Infra | ESLint | **KEEP** (config) |
| `.eslintrc.json` | File | ESLint config | Infra | package.json | **KEEP** (config) |
| `.git/` | Folder | Git database | Git | - | **KEEP** (git) |
| `.github/` | Folder | GitHub workflows + templates | CI/CD | Actions | **KEEP** (CI) |
| `.gitignore` | File | Git ignore patterns | Infra | Git | **KEEP** (config) |
| `.markdownlint.json` | File | Markdown lint config | Infra | VS Code? | **KEEP** (config) |
| `.mcp.env` | File | MCP server credentials | Infra | .mcp.json | **KEEP** (local only) |
| `.mcp.json` | File | MCP server config | Infra | Claude Code | **KEEP** (config) |
| `.playwright-mcp/` | Folder | MCP Playwright cache | Cache | MCP server | **GITIGNORE** (cache) |
| `.prettierignore` | File | Prettier ignore patterns | Infra | Prettier | **KEEP** (config) |
| `.prettierrc` | File | Prettier config | Infra | package.json | **KEEP** (config) |
| `.serena/` | Folder | Serena MCP memories | Cache | Serena MCP | **KEEP+IGNORE** (gitignored ✅) |
| `.tasks/` | Folder | Task management (.md files) | Docs | .tasks/INDEX.md | **KEEP** (workflow) |
| `.turbo/` | Folder | Turborepo cache | Cache | turbo.json | **KEEP+IGNORE** (gitignored ✅) |
| `.vercel/` | Folder | Vercel deployment cache | Cache | vercel.json | **KEEP+IGNORE** (gitignored ✅) |
| `.vercelignore` | File | Vercel ignore patterns | Infra | Vercel | **KEEP** (config) |
| `.vscode/` | Folder | VS Code settings | Dev | - | **KEEP** (editor) |
| `CHANGELOG.md` | File | Version history | Docs | - | **KEEP** (docs) |
| `CLAUDE.md` | File | Claude Code instructions | Docs | Claude Code | **KEEP** (docs) |
| `PROTECTED_FILES.json` | File | Protected files list | Infra | Git hooks? | **AUDIT** (what uses this?) |
| `README.md` | File | Project README | Docs | GitHub | **KEEP** (docs) |
| `apps/` | Folder | Next.js apps | Source | turbo.json | **KEEP** (source) |
| `archive/` | Folder | Archive (check if empty) | Archive | - | **AUDIT** (empty?) |
| `components.json` | File | shadcn/ui config | Infra | shadcn CLI | **KEEP** (config) |
| `docs/` | Folder | Documentation | Docs | README.md | **KEEP** (docs) |
| `next-env.d.ts` | File | Next.js types | Generated | Next.js | **KEEP** (generated) |
| `node_modules/` | Folder | Dependencies | Cache | package.json | **KEEP+IGNORE** (gitignored ✅) |
| `package.json` | File | Root package config | Infra | pnpm | **KEEP** (config) |
| `packages/` | Folder | Shared packages | Source | turbo.json | **KEEP** (source) |
| `playwright-ct.config.ts` | File | Playwright CT config | Test | package.json? | **AUDIT** (used?) |
| `playwright.config.ts` | File | Playwright E2E config | Test | package.json | **KEEP** (test) |
| `pnpm-lock.yaml` | File | pnpm lockfile | Infra | pnpm | **KEEP** (lock) |
| `pnpm-workspace.yaml` | File | pnpm workspace config | Infra | pnpm | **KEEP** (config) |
| `postcss.config.js` | File | PostCSS config | Infra | Tailwind | **KEEP** (config) |
| `scripts/` | Folder | Utility scripts | Scripts | - | **AUDIT** (inventory below) |
| `supabase/` | Folder | Supabase migrations + config | DB | Supabase CLI | **KEEP** (source) |
| `tailwind.config.js` | File | Tailwind config | Infra | PostCSS | **KEEP** (config) |
| `test-results/` | Folder | Playwright results | Artifacts | Playwright | **DELETE** (gitignored, shouldn't exist) |
| `tests/` | Folder | E2E tests | Test | playwright.config.ts | **KEEP** (test) |
| `tools/` | Folder | Tools + reports | Scripts | - | **AUDIT** (inventory below) |
| `tsconfig.json` | File | TypeScript config | Infra | tsc | **KEEP** (config) |
| `tsconfig.tsbuildinfo` | File | TypeScript build cache | Cache | tsc | **KEEP+IGNORE** (should be gitignored) |
| `turbo.json` | File | Turborepo config | Infra | turbo | **KEEP** (config) |
| `vercel.json` | File | Vercel config | Infra | Vercel | **KEEP** (config) |

---

## Summary

| Category | Count | Action |
|----------|-------|--------|
| **KEEP** (source/config) | 38 | No action |
| **KEEP+IGNORE** (gitignored) | 5 | Verify .gitignore |
| **DELETE** (artifacts) | 1 | `test-results/` |
| **AUDIT** (need investigation) | 3 | `PROTECTED_FILES.json`, `playwright-ct.config.ts`, `archive/` |

---

## Actions Required

### 1. Delete Artifacts
```bash
rm -rf test-results/  # Should be gitignored, remove if present
```

### 2. Audit Items

**PROTECTED_FILES.json:**
- Check what uses this file
- If unused, delete
- If used by git hooks, document

**playwright-ct.config.ts:**
- Check if referenced in package.json
- If unused, delete
- If used, keep

**archive/:**
- Check if empty or contains files
- If empty, delete folder
- If contains files, document or move to docs/archive/

### 3. Verify Gitignore

Check these are gitignored:
```bash
git check-ignore -v .playwright-mcp .serena .turbo .vercel tsconfig.tsbuildinfo test-results
```

Expected: All should be ignored ✅

---

**Next:** Scripts inventory
