# Inventaire Pre-Refonte V2 — Configuration Claude Code

**Date** : 2026-04-15
**Branche** : `refonte/verone-v2-claude-config`
**Objectif** : Snapshot complet avant refonte architecture .claude/

---

## Resume

| Categorie                                 | Fichiers | Lignes     |
| ----------------------------------------- | -------- | ---------- |
| `.claude/` (total)                        | 82       | 11 481     |
| Memoire globale (`~/.claude/.../memory/`) | 20       | 393        |
| **TOTAL**                                 | **102**  | **11 874** |

---

## 1. Fichiers .claude/ — Liste complete

### Racine

| Fichier                       | Lignes |
| ----------------------------- | ------ |
| `.claude/INDEX.md`            | 260    |
| `.claude/README.md`           | 71     |
| `.claude/settings.json`       | 251    |
| `.claude/settings.local.json` | 13     |
| `.claude/test-credentials.md` | 16     |

### agent-memory/ (7 fichiers — 657 lignes)

| Fichier                                       | Lignes |
| --------------------------------------------- | ------ |
| `agent-memory/back-office-expert/MEMORY.md`   | 82     |
| `agent-memory/code-reviewer/MEMORY.md`        | 75     |
| `agent-memory/database-architect/MEMORY.md`   | 85     |
| `agent-memory/frontend-architect/MEMORY.md`   | 81     |
| `agent-memory/linkme-expert/MEMORY.md`        | 93     |
| `agent-memory/perf-optimizer/MEMORY.md`       | 170    |
| `agent-memory/site-internet-expert/MEMORY.md` | 81     |

### agents/ (7 fichiers — 1 801 lignes)

| Fichier                          | Lignes |
| -------------------------------- | ------ |
| `agents/back-office-expert.md`   | 119    |
| `agents/code-reviewer.md`        | 443    |
| `agents/database-architect.md`   | 304    |
| `agents/frontend-architect.md`   | 289    |
| `agents/linkme-expert.md`        | 143    |
| `agents/perf-optimizer.md`       | 386    |
| `agents/site-internet-expert.md` | 117    |

### audits/ (2 fichiers — 184 lignes)

| Fichier                               | Lignes |
| ------------------------------------- | ------ |
| `audits/README.md`                    | 62     |
| `audits/security-audit-2026-02-04.md` | 122    |

### commands/ (11 fichiers — 2 523 lignes)

| Fichier                                           | Lignes |
| ------------------------------------------------- | ------ |
| `commands/README.md`                              | 67     |
| `commands/db.md`                                  | 446    |
| `commands/fix-warnings.md`                        | 708    |
| `commands/implement.md`                           | 89     |
| `commands/plan.md`                                | 116    |
| `commands/pr.md`                                  | 150    |
| `commands/review.md`                              | 240    |
| `commands/search.md`                              | 108    |
| `commands/status.md`                              | 38     |
| `commands/teach.md`                               | 88     |
| `commands/review-references/performance-rules.md` | 213    |
| `commands/review-references/security-rules.md`    | 209    |
| `commands/review-references/size-thresholds.md`   | 179    |
| `commands/review-references/typescript-rules.md`  | 237    |

### guides/ (3 fichiers — 1 407 lignes)

| Fichier                                 | Lignes |
| --------------------------------------- | ------ |
| `guides/cross-app-protection.md`        | 579    |
| `guides/expert-workflow.md`             | 438    |
| `guides/typescript-errors-debugging.md` | 390    |

### hooks/ (2 fichiers — 49 lignes)

| Fichier                             | Lignes |
| ----------------------------------- | ------ |
| `hooks/check-component-creation.sh` | 33     |
| `hooks/session-context.sh`          | 16     |

### patterns/ (1 fichier — 66 lignes)

| Fichier                   | Lignes |
| ------------------------- | ------ |
| `patterns/auth-logout.md` | 66     |

### research/ (9 fichiers — 1 124 lignes)

| Fichier                                         | Lignes |
| ----------------------------------------------- | ------ |
| `research/INDEX.md`                             | 24     |
| `research/01-orchestration-agent-first.md`      | 108    |
| `research/02-strategie-flux-agentiques.md`      | 115    |
| `research/03-optimisation-environnement-pro.md` | 95     |
| `research/04-masterclass-7-piliers.md`          | 121    |
| `research/05-guide-strategique-agentique.md`    | 143    |
| `research/06-turborepo-multi-apps.md`           | 158    |
| `research/07-architecture-agentique-verone.md`  | 122    |
| `research/08-audit-complet-refonte.md`          | 238    |

### rules/ (17 fichiers — 824 lignes)

| Fichier                                 | Lignes |
| --------------------------------------- | ------ |
| `rules/backend/api.md`                  | 64     |
| `rules/database/post-migration.md`      | 26     |
| `rules/database/rls-patterns.md`        | 257    |
| `rules/database/supabase.md`            | 37     |
| `rules/dev/build-commands.md`           | 14     |
| `rules/dev/clean-code.md`               | 33     |
| `rules/dev/component-safety.md`         | 44     |
| `rules/dev/context-loading.md`          | 49     |
| `rules/dev/deployment-verification.md`  | 26     |
| `rules/dev/git-workflow.md`             | 74     |
| `rules/dev/hooks-bloquants.md`          | 28     |
| `rules/dev/multi-agent.md`              | 18     |
| `rules/dev/playwright-large-pages.md`   | 49     |
| `rules/dev/playwright-screenshots.md`   | 32     |
| `rules/dev/servers.md`                  | 9      |
| `rules/dev/stock-triggers-protected.md` | 47     |
| `rules/frontend/async-patterns.md`      | 61     |

### scripts/ (6 fichiers — 189 lignes)

| Fichier                                     | Lignes |
| ------------------------------------------- | ------ |
| `scripts/auto-sync-with-main.sh`            | 31     |
| `scripts/clarify-before-code.sh`            | 24     |
| `scripts/cleanup-active-tasks.sh`           | 20     |
| `scripts/statusline-debug.sh`               | 15     |
| `scripts/validate-git-checkout.sh`          | 48     |
| `scripts/validate-playwright-screenshot.sh` | 21     |

### skills/ (4 fichiers — 702 lignes)

| Fichier                         | Lignes |
| ------------------------------- | ------ |
| `skills/new-component/SKILL.md` | 102    |
| `skills/oneshot/SKILL.md`       | 37     |
| `skills/rls-patterns/SKILL.md`  | 257    |
| `skills/schema-sync/SKILL.md`   | 86     |

### templates/ (2 fichiers — 519 lignes)

| Fichier                                | Lignes |
| -------------------------------------- | ------ |
| `templates/component.tsx`              | 339    |
| `templates/supabase-client-pattern.md` | 180    |

### work/ (3 fichiers — 636 lignes)

| Fichier                        | Lignes |
| ------------------------------ | ------ |
| `work/ACTIVE.md`               | 369    |
| `work/MEGA-PLAN-REFONTE.md`    | 194    |
| `work/plan-canaux-de-vente.md` | 93     |

---

## 2. Memoire globale — Liste complete

**Chemin** : `~/.claude/projects/-Users-romeodossantos-verone-back-office-V1/memory/`

| Fichier                                       | Lignes | Type      |
| --------------------------------------------- | ------ | --------- |
| `MEMORY.md` (index)                           | 14     | index     |
| `architecture_db.md`                          | 30     | reference |
| `code_review_hotspots.md`                     | 23     | reference |
| `feedback_channel_pricing_site_source.md`     | 16     | feedback  |
| `feedback_ci_workflow.md`                     | 15     | feedback  |
| `feedback_documentation_overload.md`          | 18     | feedback  |
| `feedback_hooks_and_rules_optimization.md`    | 22     | feedback  |
| `feedback_invoice_org_matching.md`            | 14     | feedback  |
| `feedback_invoice_types_workflow.md`          | 17     | feedback  |
| `feedback_linkme_not_site.md`                 | 11     | feedback  |
| `feedback_never_create_order_from_invoice.md` | 16     | feedback  |
| `feedback_never_delete_rules.md`              | 14     | feedback  |
| `feedback_never_disable_eslint.md`            | 20     | feedback  |
| `feedback_never_swap_components.md`           | 14     | feedback  |
| `feedback_no_local_quotes.md`                 | 23     | feedback  |
| `perf_bottlenecks.md`                         | 39     | reference |
| `project_ambassador_system.md`                | 23     | project   |
| `project_meta_commerce_config.md`             | 36     | project   |
| `project_pending_org_form_fixes.md`           | 15     | project   |
| `reference_deploy_urls.md`                    | 13     | reference |

---

## 3. Hooks actifs (settings.json)

### SessionStart (2 hooks)

1. **Compaction context** — rappel post-compaction avec contexte Verone
2. **session-context.sh** — charge contexte session (rappels critiques)

### UserPromptSubmit (1 hook)

1. **clarify-before-code.sh** — checklist obligatoire avant de coder

### PreToolUse (13 hooks)

1. **Write** → check-component-creation.sh (anti-duplication)
2. **Edit/Write sur main** → bloque ecriture sur main
3. **git checkout** → validate-git-checkout.sh
4. **git --no-verify** → bloque bypass hooks
5. **git commit** → verifie branche + format commit [APP-XXX-NNN]
6. **git commit** → auto-sync-with-main.sh
7. **git push main** → bloque push direct sur main
8. **gh pr create --base main** → bloque PR vers main
9. **pnpm/npm dev/start** → bloque lancement serveurs
10. **Write Modal/Form orders/customers/apps** → alerte duplication
11. **Edit middleware** → alerte middleware critique
12. **Edit _rls_** → alerte RLS critique
13. **Edit/Write .ts/.tsx** → bloque TypeScript `any`
14. **Playwright screenshot** → validate path

### PostToolUse (2 hooks)

1. **Edit/Write .ts/.tsx** → type-check automatique par app
2. **git commit** → cleanup ACTIVE.md + rappel Playwright

---

## 4. Repartition par categorie

| Categorie                      | Fichiers | Lignes | % du total |
| ------------------------------ | -------- | ------ | ---------- |
| Agents + agent-memory          | 14       | 2 458  | 21.4%      |
| Commands + review-references   | 14       | 2 523  | 22.0%      |
| Rules                          | 17       | 824    | 7.2%       |
| Research                       | 9        | 1 124  | 9.8%       |
| Guides                         | 3        | 1 407  | 12.3%      |
| Skills                         | 4        | 702    | 6.1%       |
| Work (plans/taches)            | 3        | 636    | 5.5%       |
| Scripts + hooks                | 8        | 238    | 2.1%       |
| Templates                      | 2        | 519    | 4.5%       |
| Config (settings, index, etc.) | 5        | 611    | 5.3%       |
| Audits + patterns              | 3        | 250    | 2.2%       |
| Memoire globale                | 20       | 393    | 3.4%       |
