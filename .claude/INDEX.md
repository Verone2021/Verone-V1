# INDEX — `.claude/` Verone Back Office

**Dernière mise à jour** : 2026-04-19 (Phase 2 restructuration)

Sommaire unique de la config agent. Si tu cherches où est une règle, un agent, un playbook, tu commences ici.

---

## 🟢 Point d'entrée agent

1. `CLAUDE.md` (racine) — identité, workflow, interdictions
2. `.claude/rules/autonomy-boundaries.md` — feu vert / orange / rouge par action
3. `.claude/work/ACTIVE.md` (gitignored, local) — file de tâches active (source unique)

---

## Rules (8 fichiers)

Règles stables lues automatiquement par l'agent.

- `.claude/rules/autonomy-boundaries.md` — Quand l'agent agit seul vs attend Romeo _(NOUVEAU Phase 2)_
- `.claude/rules/code-standards.md` — TypeScript, async, composants, API, logout
- `.claude/rules/database.md` — Migrations, RLS patterns, post-migration
- `.claude/rules/finance.md` — Règles métier devis / factures / proformas (R1 à R7)
- `.claude/rules/playwright.md` — Mode vision, screenshots, workflow
- `.claude/rules/responsive.md` — Breakpoints + 5 techniques responsive obligatoires
- `.claude/rules/stock-triggers-protected.md` — Triggers stock IMMUABLES
- `.claude/rules/workflow.md` — Git, PR, merge, 1 PR = 1 bloc cohérent

**Note** : sous-dossier `.claude/rules/domain/` prévu pour `finance.md`, `stock-triggers-protected.md`, `responsive.md` — déplacement après merge PR A (voir `DECISIONS.md` ADR-004).

---

## Agents (5 fichiers)

- `.claude/agents/dev-agent.md` — Code + TDD + changelog (**actif**)
- `.claude/agents/reviewer-agent.md` — Code reviewer impartial read-only (**actif**)
- `.claude/agents/verify-agent.md` — Type-check + build + tests (**actif**)
- `.claude/agents/ops-agent.md` — Push, PR, merge après review PASS (**actif**)
- `.claude/agents/perf-optimizer.md` — Audit perf, dead code, bundle, overfetch (**restauré 2026-04-19**, mémoire dans `.claude/agent-memory/perf-optimizer/`)

_Agents supprimés (0 usage en 3 mois — voir `DECISIONS.md` ADR-009)_ : `writer-agent`, `market-agent`.\_

---

## Playbooks (recettes réutilisables)

- `.claude/playbooks/migrate-page-responsive.md` — Migration responsive (pattern pilote v2 validé)
- `.claude/playbooks/fix-bug.md` — Correction de bug : reproduire + fix + test runtime
- `.claude/playbooks/review-and-merge.md` — Workflow PR prête → mergée
- `.claude/playbooks/handle-ci-failure.md` — CI rouge : diagnostic + fix + re-push

Référencés depuis `.claude/rules/workflow.md` (section Playbooks). Une tâche dans `ACTIVE.md` peut pointer vers une recette via `playbook: <nom>`.

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

## Scripts (8 fichiers)

- `.claude/scripts/auto-sync-with-main.sh` — Bloque commit si branche en retard sur staging
- `.claude/scripts/check-open-prs.sh` — Liste PRs ouvertes + conflits + oublis _(créé Phase 1)_
- `.claude/scripts/check-responsive-violations.sh` — Audit anti-patterns responsive
- `.claude/scripts/clarify-before-code.sh` — Hook UserPromptSubmit checklist
- `.claude/scripts/cleanup-active-tasks.sh` — Détecte tâches terminées dans ACTIVE.md
- `.claude/scripts/cleanup-scratchpad.sh` — Nettoyage scratchpad post-merge
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
- `.claude/work/AGENT-ENTRY-POINT.md` — Point d'entrée agent (sprint responsive)
- `.claude/work/NEXT-SPRINTS.md` — Plan détaillé des sprints à venir
- `.claude/work/PROMPTS-TO-COPY.md` — Prompts à copier-coller
- `.claude/work/plan-canaux-de-vente.md` — Plan canaux de vente

Consolidation en 1 seul `SPRINT-CURRENT.md` prévue après merge PR A (voir ADR-006).

---

## Scratchpad

- `docs/scratchpad/` — Plans, rapports, verdicts inter-agents (versionnés)

Rapports récents clés :

- `audit-config-agent-2026-04-19.md` — Audit brutal config
- `plan-restructuration-config.md` — Plan 3 phases
- `automation-roadmap.md` — Intégrations externes
- `audit-agents-2026-04-19.md` — Usage des 6 agents
- `BO-UI-RESP-LISTS-pilot-v2-template.md` — Template pilote v2 responsive
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
- **Phase 2 — Restructuration** ⚠️ partielle (DECISIONS + autonomy-boundaries + playbooks + check-config-integrity gardés ; queue/done supprimés en `[INFRA-DOC-006]` car jamais utilisés — ACTIVE.md reste la source unique)
- **Phase 3 — Automation** 🚫 abandonnée (dépendait de queue/, devenue caduque)
- **CLAUDE.md v2** 🔲 (PR `[INFRA-DOC-007]` : passage 250 → 120 lignes via pointeurs vers `rules/`)

Voir `docs/scratchpad/automation-roadmap.md` (historique uniquement).

---
