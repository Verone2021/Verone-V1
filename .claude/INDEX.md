# INDEX — `.claude/` Verone Back Office

**Dernière mise à jour** : 2026-05-02 — `[INFRA-LEAN-001]` Niveau 1 : fusion `branch-strategy` → `workflow.md`, fusion `playwright-artifacts` → `playwright.md`, élagage CLAUDE.md racine (221 → 158 lignes).

Sommaire unique de la config agent. Si tu cherches où est une règle, un agent, un playbook, tu commences ici.

---

## 🟢 Point d'entrée agent

1. `CLAUDE.md` (racine) — identité, workflow, interdictions
2. `.claude/rules/communication-style.md` — règle 6 anti-paralysie (agent décide seul sur sujets techniques)
3. `.claude/work/ACTIVE.md` (gitignored, local) — file de tâches active (source unique)

---

## Rules (12 fichiers)

Règles stables lues automatiquement par l'agent.

- `.claude/rules/code-standards.md` — TypeScript, async, composants, API, logout
- `.claude/rules/communication-style.md` — Roméo est utilisateur final non-développeur, français simple sans jargon
- `.claude/rules/database.md` — Migrations, RLS patterns, post-migration
- `.claude/rules/finance.md` — Règles métier devis / factures / proformas (R1 à R7)
- `.claude/rules/playwright.md` — Mode vision, screenshots, workflow + artefacts (fusion `playwright-artifacts.md` 2026-05-02)
- `.claude/rules/responsive.md` — Breakpoints + 5 techniques responsive obligatoires
- `.claude/rules/stock-triggers-protected.md` — Triggers stock IMMUABLES
- `.claude/rules/workflow.md` — Git, PR, merge, 1 PR = 1 bloc cohérent + checklist 4 questions (fusion `branch-strategy.md` 2026-05-02)
- `.claude/rules/no-worktree-solo.md` — Workflow solo, JAMAIS `git worktree add`
- `.claude/rules/data-fetching.md` — TanStack Query, useEffect deps, Supabase select
- `.claude/rules/no-phantom-data.md` — Zéro donnée fantôme en prod
- `.claude/rules/agent-autonomy-external.md` — Agent fait tout lui-même via CLI/MCP

_Note : sous-dossier `.claude/rules/domain/` envisagé dans ADR-004 mais non appliqué (faux positif du check-integrity). Toutes les règles restent à plat dans `.claude/rules/`._

---

## Agents (5 fichiers)

- `.claude/agents/dev-agent.md` — Code + TDD + changelog (**actif**)
- `.claude/agents/reviewer-agent.md` — Code reviewer impartial read-only (**actif**)
- `.claude/agents/verify-agent.md` — Type-check + build + tests (**actif**)
- `.claude/agents/ops-agent.md` — Push, PR, merge après review PASS (**actif**)
- `.claude/agents/perf-optimizer.md` — Audit perf, dead code, bundle, overfetch (**restauré 2026-04-19**, mémoire dans `.claude/agent-memory/perf-optimizer/`)

_Agents supprimés (0 usage en 3 mois — voir `DECISIONS.md` ADR-009)_ : `writer-agent`, `market-agent`.\_

---

## Playbooks (1 fichier — leçons spécifiques Verone)

- `.claude/playbooks/migrate-page-responsive.md` — Migration responsive (pattern pilote v2, capture le fix du bug "Rendered more hooks" du pilote v1 FAIL)

Les playbooks génériques (fix-bug, review-and-merge, handle-ci-failure) ont été supprimés en `[INFRA-DOC-006]` (voir `DECISIONS.md` ADR-011) car ils dupliquaient les capacités natives de Claude Code.

---

## Commands (8 fichiers + références)

Commandes slash disponibles dans Claude Code.

- `.claude/commands/fix-warnings.md` — Workflow 6 phases pour corriger warnings ESLint (restauré 2026-04-18)
- `.claude/commands/db.md` — Opérations Supabase rapides (query/logs/migrations/advisors/schema/types/rls-test/stats) (**restauré 2026-04-19**)
- `.claude/commands/teach.md` — Mode pédagogique : explique concept avant d'implémenter (**restauré 2026-04-19**)
- `.claude/commands/search.md` — Exploration DB + code + RLS
- `.claude/commands/review.md` — Audit qualité code avec rapport
- `.claude/commands/pr.md` — Push + PR vers staging
- `.claude/commands/status.md` — Résumé rapide projet
- `.claude/commands/review-references/performance-rules.md` — Référence performance
- `.claude/commands/review-references/security-rules.md` — Référence sécurité
- `.claude/commands/review-references/size-thresholds.md` — Seuils de taille
- `.claude/commands/review-references/typescript-rules.md` — Règles TypeScript

---

## Skills (3 fichiers)

- `.claude/skills/oneshot/SKILL.md` — Fix rapide (typo, CSS, renommage)
- `.claude/skills/new-component/SKILL.md` — Template composant React
- `.claude/skills/schema-sync/SKILL.md` — Référence rapide schema DB

---

## Guides

- `.claude/guides/cross-app-protection.md` — Protection cross-app (isolation BO/LinkMe)
- `.claude/guides/typescript-errors-debugging.md` — Debug erreurs TypeScript

---

## Templates

- `.claude/templates/component.tsx` — Template composant React
- `.claude/templates/sprint-responsive-template.md` — Template de sprint responsive

---

## Scripts (9 fichiers)

- `.claude/scripts/auto-sync-with-main.sh` — Bloque commit si branche en retard sur staging
- `.claude/scripts/check-open-prs.sh` — Liste PRs ouvertes + conflits + oublis _(créé Phase 1)_
- `.claude/scripts/check-responsive-violations.sh` — Audit anti-patterns responsive
- `.claude/scripts/clarify-before-code.sh` — Hook UserPromptSubmit checklist
- `.claude/scripts/cleanup-active-tasks.sh` — Détecte tâches terminées dans ACTIVE.md
- `.claude/scripts/cleanup-scratchpad.sh` — Nettoyage scratchpad auto (post-merge + post-push). Archive 13 préfixes à 14j, session-\* à 30j, purge archive/ à 90j. Voir ADR-014.
- `.claude/scripts/statusline-debug.sh` — Statusline Claude Code
- `.claude/scripts/validate-git-checkout.sh` — Validation checkout
- `.claude/scripts/validate-playwright-screenshot.sh` — Validation screenshots

**Scripts racine** :

- `scripts/check-config-integrity.sh` — Vérifie intégrité config + ADR _(NOUVEAU Phase 2)_

---

## Hooks

- `.claude/hooks/check-component-creation.sh` — Vérifie création composants
- `.claude/hooks/session-context.sh` — Contexte injecté en session start

---

## Décisions structurelles

- `.claude/DECISIONS.md` — Architecture Decision Records _(NOUVEAU Phase 2)_
  - ADR-001 : Suppression agents « expert »
  - ADR-002 : Workflow 1 PR = 1 bloc
  - ADR-003 : Restructuration en 3 phases
  - ADR-004 : 4 ajustements (queue 2 dossiers, rules/domain/, test CI, audit agents)
  - ADR-005 : Suppression writer-agent + market-agent [différé]
  - ADR-006 : `.claude/work/` reste gitignored [différé]
  - ADR-007 : Pattern pilote v2 responsive validé

---

## Work (sprint courant — gitignored local)

**Note** : `.claude/work/` est gitignored (voir ADR-006). Fichiers visibles uniquement sur la machine de Romeo.

- `.claude/work/ACTIVE.md` — Sprints et tâches actives

Consolidation en 1 seul `SPRINT-CURRENT.md` prévue après merge PR A (voir ADR-006).

---

## Scratchpad

- `docs/scratchpad/` — Plans, rapports, verdicts inter-agents (structure plate par design). Voir `docs/scratchpad/README.md` pour la convention complète (15 préfixes autorisés, cycle de vie, archivage auto). Nettoyage auto via `.claude/scripts/cleanup-scratchpad.sh` (hook PostToolUse).

Références permanentes promues vers `docs/current/` (voir ADR-014) :

- `docs/current/responsive/pilot-v2-template.md` — Template pilote v2 responsive (ex-scratchpad)
- `docs/current/automation-roadmap.md` — Intégrations externes (ex-scratchpad)

Rapports récents clés (actifs dans scratchpad) :

- `audit-2026-04-23-scratchpad-hygiene-proposal.md` — Audit hygiène scratchpad (ADR-014)
- `audit-config-agent-2026-04-19.md` — Audit brutal config
- `plan-restructuration-config.md` — Plan 3 phases
- `audit-agents-2026-04-19.md` — Usage des 6 agents
- `audit-responsive-global-2026-04-19.md` — Inventaire 196 pages

---

## Documentation projet

- `docs/current/database/schema/` — Schema DB par domaine (SOURCE DE VÉRITÉ)
- `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` — Composants et hooks
- `docs/current/DEPENDANCES-PACKAGES.md` — Dépendances inter-packages
- `docs/current/WORKFLOWS-CRITIQUES.md` — 5 workflows critiques + mapping tests E2E
- `docs/current/GUIDE-RESPONSIVE.md` — Guide complet responsive (copier-coller)
- `apps/back-office/CLAUDE.md` — Règles spécifiques back-office
- `apps/linkme/CLAUDE.md` — Règles spécifiques LinkMe
- `apps/site-internet/CLAUDE.md` — Règles spécifiques site-internet

---

## Mémoire persistante

- `~/.claude/projects/.../memory/MEMORY.md` — Index mémoire (feedbacks, projets, références)

---

## Credentials et config

- `.claude/test-credentials.md` — Playwright (BO, LinkMe, Site) — LOCAL ONLY
- `.claude/settings.json` — Permissions + hooks (14 PreToolUse, 2 PostToolUse)
- `.claude/settings.local.json` — Overrides local (non versionné)

---

## Roadmap restructuration

- **Phase 1 — Nettoyage** ✅ (chemins corrigés, script check-open-prs créé, INDEX cohérent, README daté)
- **Phase 2 — Restructuration** ⚠️ partielle (DECISIONS + playbooks + check-config-integrity gardés ; queue/done supprimés en `[INFRA-DOC-006]` ; `autonomy-boundaries.md` supprimé en `[INFRA-LEAN-001]` 2026-05-02 — ADR-026, redondant avec règle 6 anti-paralysie ; ACTIVE.md reste la source unique)
- **Phase 3 — Automation** 🚫 abandonnée (dépendait de queue/, devenue caduque)
- **CLAUDE.md v2** 🔲 (PR `[INFRA-DOC-007]` : passage 250 → 120 lignes via pointeurs vers `rules/`)

Voir `docs/scratchpad/automation-roadmap.md` (historique uniquement).

---

## Regles

| Fichier                                    | Contenu                 |
| ------------------------------------------ | ----------------------- |
| `.claude/rules/no-phantom-data.md`         | No Phantom Data         |
| `.claude/rules/agent-autonomy-external.md` | Agent Autonomy External |
| `.claude/rules/no-worktree-solo.md`        | No Worktree (solo)      |
| `.claude/rules/data-fetching.md`           | Data Fetching           |

---

## Autres

| Fichier                               | Contenu            |
| ------------------------------------- | ------------------ |
| `.claude/local/OPERATIONS-RUNBOOK.md` | Operations Runbook |

---

## Taches en cours

| Fichier                                | Contenu              |
| -------------------------------------- | -------------------- |
| `.claude/work/AGENT-ENTRY-POINT.md`    | Agent Entry Point    |
| `.claude/work/NEXT-SPRINTS.md`         | Next Sprints         |
| `.claude/work/PROMPTS-TO-COPY.md`      | Prompts To Copy      |
| `.claude/work/plan-canaux-de-vente.md` | Plan Canaux De Vente |

---
