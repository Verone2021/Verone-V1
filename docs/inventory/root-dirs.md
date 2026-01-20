# Inventory Root Directories - VERONE-BACK-OFFICE-V1

**Date**: 2026-01-20
**Objectif**: Tolerance Zero - Décision KEEP / MOVE / DELETE / GITIGNORE pour chaque dossier racine

## Méthode

```bash
# Audit commands
find . -maxdepth 1 -type d -print
git ls-files | cut -d'/' -f1 | sort -u
git status --porcelain
rg --files | rg "PATTERN"
```

---

## Tracked Directories (Git)

| Directory | Decision | New Path | Why | Evidence |
|-----------|----------|----------|-----|----------|
| `.claude/` | **KEEP** | - | Structure canonique pour Claude Code: agents, commands, scripts | `git ls-files \| rg "^\.claude/" → 17 files tracked` ✅ |
| `.github/` | **KEEP** | - | CI/CD workflows standard (GitHub Actions) | Standard directory pour GitHub workflows |
| `.playwright-mcp/` | **KEEP DIR** + **GITIGNORE OUTPUTS** | - | Config MCP Playwright valide (README.md), outputs (*.png) déjà gitignored | `.gitignore` lines 100-107 ✅ |
| `.tasks/` | **KEEP** | - | Task management validé dans CLAUDE.md section "Task Management" | Structure documentée dans CLAUDE.md |
| `apps/` | **KEEP** | - | Source code principal (back-office, linkme, site-internet) | Core monorepo structure (Turborepo) |
| `archive/` | **DELETE** | - | Archive temporaire (2026-01), 0 fichiers Git tracked, déjà gitignored | `git ls-files \| rg "^archive/" → 0 files`, `.gitignore` line 114 ✅ |
| `docs/` | **KEEP** | - | Source de vérité unique pour documentation (objectif Phase 3B) | Nouvelle structure canonique target |
| `manifests/` | **MIGRATE → DELETE** | `docs/` | Redondant avec docs/, utilisé dans 13 fichiers code (PRD refs), migration nécessaire | `rg manifests/ → 13 files` (voir Phase 3B) |
| `packages/` | **KEEP** | - | Shared packages monorepo (@verone/ui, @verone/utils, etc.) | Core monorepo structure (Turborepo) |
| `scripts/` | **KEEP** | - | Automation scripts (dev-clean.sh, validate-env.sh, claude/) | Référencés dans package.json + CLAUDE.md |
| `supabase/` | **KEEP** | - | Database migrations + config (standard Supabase structure) | Standard Supabase directory |
| `test-results/` | **KEEP DIR** + **CLEANUP** | - | Playwright outputs (déjà gitignored), nettoyage automatique requis | `.gitignore` line 70, voir Phase 3D |
| `tests/` | **KEEP** | - | E2E tests Playwright (*.spec.ts), `tests/reports/` gitignored | Core testing infrastructure |
| `tools/` | **KEEP** + **AUDIT SCRIPTS** | - | Scripts utilitaires (analyze-hooks-components.js), `tools/reports/` gitignored | `.gitignore` line 111, 6 scripts tracked |

---

## Untracked Directories (Local Only)

| Directory | Decision | Why | Evidence |
|-----------|----------|-----|----------|
| `.serena/` | **GITIGNORE ✅** (déjà fait) + **SECURITY AUDIT** | Cache MCP Serena + memories avec **SECRETS** | **SECURITY RISK** détecté (voir Phase 3C) |
| `.turbo/` | **GITIGNORE ✅** | Cache Turborepo (déjà dans .gitignore line 23) | Standard build cache |
| `.vercel/` | **GITIGNORE ✅** | Cache Vercel CLI (déjà dans .gitignore line 67) | Standard deployment cache |
| `.vscode/` | **GITIGNORE ✅** | IDE settings (déjà dans .gitignore line 41) | Standard IDE directory |
| `node_modules/` | **GITIGNORE ✅** | Dependencies npm (déjà dans .gitignore line 2) | Standard dependencies |

---

## Tracked Files (Root Hidden Files)

| File | Decision | Why | Evidence |
|------|----------|-----|----------|
| `.deploy-trigger` | **DELETE après audit** | Trigger manuel deploy (utilisé 1x dans .gitignore pattern), obsolète si CI/CD complet | Content: `# Deploy trigger 2025-12-12_03:47:50` |
| `.vercel-trigger` | **DELETE après audit** | Trigger manuel Vercel (utilisé 1x dans .gitignore pattern), obsolète si CI/CD complet | Content: `# Force deploy after Sentry + Qonto env vars Sat Jan 17 22:46:13 CET 2026` |
| `.env.example` | **KEEP** | Template env vars (standard practice) | Standard config file |
| `.eslintrc.json` | **KEEP** | ESLint config (referenced in scripts/.eslintrc.js) | Standard linting config |
| `.gitignore` | **KEEP** | Git ignore rules (150 lignes, tolérance zéro déjà appliquée) | Core Git file |
| `.markdownlint.json` | **KEEP** | Markdown linting config | Standard docs linting |
| `.mcp.json` | **KEEP** | MCP servers config (Playwright, Serena, Context7) | Required for Claude Code MCP |
| `.prettierignore` + `.prettierrc` | **KEEP** | Prettier config (standard) | Standard formatting config |
| `.vercelignore` | **KEEP** | Vercel deployment ignore rules | Required for Vercel |

---

## Phase 3A Summary

### Actions Immédiates

1. **archive/** → DELETE (0 fichiers tracked, déjà gitignored)
2. **manifests/** → MIGRATE to docs/ puis DELETE (voir Phase 3B)
3. **.serena/** → SECURITY AUDIT (voir Phase 3C)
4. **test-results/** + **tests/reports/** → CLEANUP automation (voir Phase 3D)
5. **.deploy-trigger** + **.vercel-trigger** → DELETE après vérification workflows

### Actions Phase 3B (manifests/)

Migrer 19 fichiers manifests/ vers docs/ :
- `manifests/prd/` → `docs/prd/`
- `manifests/architecture/` → `docs/architecture/`
- `manifests/technical-specs/` → `docs/technical-specs/`
- `manifests/features/` → `docs/features/`
- Mettre à jour 13 références code vers nouveau path
- Supprimer manifests/ après migration

### Actions Phase 3C (.serena/)

**CRITICAL SECURITY ISSUE DETECTED**:
- `.serena/memories/back-office-login-credentials-2026-01.md` contient **credentials production**
- `.serena/memories/sentry-auth-token-2026-01.md` contient **SENTRY_AUTH_TOKEN**

**Bonne nouvelle**: `.serena/` déjà dans `.gitignore` (line 129) ✅

**Actions requises**:
1. Vérifier `git log` que ces secrets n'ont JAMAIS été commit
2. Migrer infos non-sensibles vers `docs/` si nécessaire
3. Garder .serena/ en local only (cache MCP)

### Actions Phase 3D (Playwright Outputs)

Patterns à nettoyer automatiquement:
- `test-results/`
- `tests/reports/`
- `playwright-report/`
- `.playwright-mcp/*.png` (déjà gitignored)

Script cleanup à créer: `scripts/maintenance/clean-test-artifacts.sh`

---

## Evidence Commands

```bash
# Tracked directories count
git ls-files | cut -d'/' -f1 | sort -u | wc -l  # → 14 directories

# Untracked local directories
ls -la | rg "^d" | rg -v "^\."  # → node_modules, test-results, archive

# manifests/ usage in code
rg "manifests/" --files-with-matches  # → 13 files

# .serena/ security check
git ls-files | rg "^\.serena/"  # → 0 (GOOD, never tracked)

# Test outputs gitignore status
git status --porcelain | rg "test-results|playwright-report"  # → none (GOOD)
```

---

## Next Steps

1. **Phase 3B**: Migrate manifests/ → docs/ (détails dans section suivante)
2. **Phase 3C**: Security audit .serena/ (git log check)
3. **Phase 3D**: Create cleanup automation for test artifacts
4. **Phase 3E**: Audit .deploy-trigger + .vercel-trigger usage in workflows

**Source de Vérité Unique**: Ce fichier `docs/inventory/root-dirs.md` est la référence canonique pour les décisions de structure racine.
