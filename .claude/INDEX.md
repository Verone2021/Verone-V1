# INDEX CENTRALISE — Verone Back Office

**Derniere mise a jour** : 2026-04-09 (nettoyage Serena, ajout regles manquantes, mise a jour MCP)

Ce fichier est le sommaire unique pour trouver toute l'information du repository.
Tout agent ou commande doit commencer par consulter cet index.

---

## Taches en cours

- **`.claude/work/ACTIVE.md`** — Sprints, taches, bugs en cours. LIRE EN PREMIER.
- **`.claude/work/plan-canaux-de-vente.md`** — Plan developpement canaux de vente (site-internet, LinkMe).

---

## Commandes Slash

| Commande        | Description                                                                 | Fichier                                                   |
| --------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| `/search`       | Exploration exhaustive codebase + DB + RLS (remplace /explore et /research) | `.claude/commands/search.md`                              |
| `/implement`    | Feature implementation (search → plan → code → verify)                      | `.claude/commands/implement.md`                           |
| `/plan`         | Transformer observations en checklist dans ACTIVE.md                        | `.claude/commands/plan.md`                                |
| `/db`           | Operations Supabase rapides                                                 | `.claude/commands/db.md`                                  |
| `/pr`           | Push + PR (**sur ordre Romeo uniquement**)                                  | `.claude/commands/pr.md`                                  |
| `/review`       | Audit code complet avec rapport                                             | `.claude/commands/review.md`                              |
|                 | — Reference: performance rules                                              | `.claude/commands/review-references/performance-rules.md` |
|                 | — Reference: security rules                                                 | `.claude/commands/review-references/security-rules.md`    |
|                 | — Reference: size thresholds                                                | `.claude/commands/review-references/size-thresholds.md`   |
|                 | — Reference: typescript rules                                               | `.claude/commands/review-references/typescript-rules.md`  |
| `/fix-warnings` | ESLint auto-fix                                                             | `.claude/commands/fix-warnings.md`                        |
| `/teach`        | Mode pedagogique (expliquer avant implementer)                              | `.claude/commands/teach.md`                               |
| `/status`       | Resume rapide (branche, taches, fichiers non commites)                      | `.claude/commands/status.md`                              |

---

## Agents Specialises

### Agents par application (utiliser en priorite)

| Agent                  | App           | Fichier                                  | Quand l'utiliser                                                               |
| ---------------------- | ------------- | ---------------------------------------- | ------------------------------------------------------------------------------ |

### Agents transversaux

| Agent                | Role               | Fichier                                | Quand l'utiliser                             |
| -------------------- | ------------------ | -------------------------------------- | -------------------------------------------- |
| `.claude/agents/dev-agent.md` | Dev Agent |
| `.claude/agents/market-agent.md` | Market Agent |
| `.claude/agents/ops-agent.md` | Ops Agent |
| `.claude/agents/reviewer-agent.md` | Reviewer Agent |
| `.claude/agents/verify-agent.md` | Verify Agent |
| `.claude/agents/writer-agent.md` | Writer Agent |

---

## Skills (charges on-demand)

| Skill           | Usage                                                  | Fichier                                 |
| --------------- | ------------------------------------------------------ | --------------------------------------- |
| `rls-patterns`  | Reference patterns RLS Supabase                        | `.claude/skills/rls-patterns/SKILL.md`  |
| `schema-sync`   | Reference rapide schema DB (tables, colonnes, FK, RLS) | `.claude/skills/schema-sync/SKILL.md`   |
| `oneshot`       | Correctif rapide (bug isole, typo, ajustement CSS)     | `.claude/skills/oneshot/SKILL.md`       |
| `new-component` | Template creation composant React standard             | `.claude/skills/new-component/SKILL.md` |

---

## Regles (auto-discovered par Claude Code)

| Fichier                                         | Contenu                                                        |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `.claude/rules/dev/git-workflow.md`             | Branches, commits, PR — **STOP avant commit/push/PR**          |
| `.claude/rules/dev/context-loading.md`          | **OBLIGATOIRE** — consulter contexte avant de coder            |
| `.claude/rules/dev/build-commands.md`           | Toujours filtrer `pnpm --filter @verone/[app]`                 |
| `.claude/rules/dev/hooks-bloquants.md`          | Documentation des hooks actifs                                 |
| `.claude/rules/dev/servers.md`                  | Ports 3000/3001/3002 — JAMAIS lancer dev                       |
| `.claude/rules/dev/multi-agent.md`              | Coordination multi-agents                                      |
| `.claude/rules/dev/deployment-verification.md`  | Checklist post-deploiement                                     |
| `.claude/rules/dev/playwright-screenshots.md`   | Screenshots dans `.playwright-mcp/screenshots/`                |
| `.claude/rules/frontend/async-patterns.md`      | Promesses, handlers async, invalidateQueries                   |
| `.claude/rules/backend/api.md`                  | Route handlers, validation Zod, JAMAIS modifier API existantes |
| `.claude/rules/database/supabase.md`            | Migrations, RLS, queries, types                                |
| `.claude/rules/database/rls-patterns.md`        | Patterns RLS complets (staff, affilies, public)                |
| `.claude/rules/dev/clean-code.md`               | Fichier > 400 lignes = refactoring obligatoire                 |
| `.claude/rules/dev/component-safety.md`         | Zero swap composants, fixes cibles uniquement                  |
| `.claude/rules/dev/stock-triggers-protected.md` | Triggers stock IMMUABLES — JAMAIS modifier                     |
| `.claude/rules/database/post-migration.md`      | Mise a jour doc DB apres chaque migration                      |
| `.claude/rules/dev/playwright-large-pages.md`   | Mode screenshot only (vision) — ZERO snapshot                  |
| `.claude/rules/code-standards.md` | Code Standards |
| `.claude/rules/database.md` | Database |
| `.claude/rules/playwright.md` | Playwright |
| `.claude/rules/stock-triggers-protected.md` | Stock Triggers Protected |
| `.claude/rules/workflow.md` | Workflow |

---

## Guides

| Fichier                                         | Contenu                                                     |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `.claude/guides/cross-app-protection.md`        | Pattern protection cross-app (isolation back-office/linkme) |
| `.claude/guides/expert-workflow.md`             | Workflow expert — bonnes pratiques developpement            |
| `.claude/guides/typescript-errors-debugging.md` | Guide debugging erreurs TypeScript apres corrections ESLint |

---

## Patterns

| Fichier                           | Contenu                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `.claude/patterns/auth-logout.md` | Pattern logout standard (`window.location.href` obligatoire) |

---

## Templates

| Fichier                                        | Contenu                                             |
| ---------------------------------------------- | --------------------------------------------------- |
| `.claude/templates/supabase-client-pattern.md` | Pattern client Supabase type — eliminer warnings TS |

---

## Credentials de test

- **`.claude/test-credentials.md`** — Credentials de test Playwright (BO, LinkMe, Site). **LOCAL ONLY — never commit.**

---

## Audits

| Fichier                                       | Contenu                            |
| --------------------------------------------- | ---------------------------------- |
| `.claude/audits/security-audit-2026-02-04.md` | Audit securite complet (fev. 2026) |

---

## Documentation par domaine

### Back-Office

| Sujet          | Source                                       |
| -------------- | -------------------------------------------- |
| Guide complet  | `docs/current/INDEX-BACK-OFFICE-COMPLET.md`  |
| Pages index    | `docs/current/INDEX-PAGES-BACK-OFFICE.md`    |
| Entites metier | `docs/current/back-office-entities-index.md` |
| CLAUDE.md      | `apps/back-office/CLAUDE.md`                 |

### Composants & Formulaires partages (CRITIQUE)

| Sujet                | Source                                          |
| -------------------- | ----------------------------------------------- |
| Index transversal    | `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md`  |
| 22 packages @verone/ | Tous les modals, hooks, formulaires par package |

### LinkMe

| Sujet         | Source                                        |
| ------------- | --------------------------------------------- |
| Guide complet | `docs/current/linkme/GUIDE-COMPLET-LINKME.md` |
| Index complet | `docs/current/INDEX-LINKME-COMPLET.md`        |
| Commissions   | `docs/current/linkme/commission-reference.md` |
| CLAUDE.md     | `apps/linkme/CLAUDE.md`                       |

### Site Internet

| Sujet         | Source                                        |
| ------------- | --------------------------------------------- |
| Index complet | `docs/current/INDEX-SITE-INTERNET-COMPLET.md` |
| CLAUDE.md     | `apps/site-internet/CLAUDE.md`                |

### Database

| Sujet                           | Source                                                                  |
| ------------------------------- | ----------------------------------------------------------------------- |
| Schema DB complet (par domaine) | `docs/current/database/schema/` (9 fichiers)                            |
| Script re-generation docs       | `scripts/generate-docs.py` (--db, --components, --deps, --index, --all) |
| Dependances inter-packages      | `docs/current/DEPENDANCES-PACKAGES.md`                                  |
| Tables par domaine              | `docs/current/database/schema/`                                         |
| Triggers stock                  | `docs/current/database/triggers-stock-reference.md`                     |
| Triggers metriques              | `docs/metrics/database-triggers.md`                                     |
| RLS patterns                    | `.claude/rules/database/rls-patterns.md`                                |
| Mapping pages-tables            | `docs/current/MAPPING-PAGES-TABLES.md`                                  |
| Architecture DB                 | `docs/current/database/schema/`                                         |

### Finance

| Sujet                     | Source                                               |
| ------------------------- | ---------------------------------------------------- |
| Reference finance         | `docs/current/finance/finance-reference.md`          |
| Systeme Qonto             | `docs/current/finance/invoicing-system-reference.md` |
| Qonto env setup           | `docs/integrations/qonto-env-setup.md`               |
| Never finalize            | `docs/current/finance/invoicing-system-reference.md` |
| Invoicing system (routes) | `docs/current/finance/invoicing-system-reference.md` |
| Workflow ventes complet   | `docs/current/WORKFLOW-VENTES.md`                    |
| Dependances composants    | `docs/current/COMPONENT-DEPENDENCIES.md`             |

### Modules

| Sujet                | Source                                              |
| -------------------- | --------------------------------------------------- |
| Stock                | `docs/current/modules/stock-module-reference.md`    |
| Commandes (workflow) | `docs/current/modules/orders-workflow-reference.md` |
| Sourcing             | `docs/current/modules/sourcing-reference.md`        |

### Regles metier (restaurees 2026-04-01)

| Sujet                      | Source                                                                          |
| -------------------------- | ------------------------------------------------------------------------------- |
| Alertes stock              | `docs/business-rules/06-stocks/alertes/`                                        |
| Backorders                 | `docs/business-rules/06-stocks/backorders/BACKORDERS-POLICY.md`                 |
| Stock reel vs previsionnel | `docs/business-rules/06-stocks/movements/real-vs-forecast-separation.md`        |
| Tracabilite stock          | `docs/business-rules/06-stocks/movements/stock-traceability-rules.md`           |
| Annulation commande        | `docs/business-rules/07-commandes/clients/sales-order-cancellation-workflow.md` |
| Workflow expedition        | `docs/business-rules/07-commandes/expeditions/`                                 |
| Workflow PO complet        | `docs/business-rules/07-commandes/fournisseurs/`                                |
| Notifications commandes    | `docs/business-rules/07-commandes/notifications-workflow.md`                    |
| Calcul marge LinkMe        | `docs/linkme/margin-calculation.md`                                             |
| Decisions projet           | `docs/current/`                                                                 |
| Incident runbook           | `docs/runbooks/incident.md`                                                     |

---

## Agent Memories (7 agents, tous configures)

| Agent                  | Memoire                                      |
| ---------------------- | -------------------------------------------- |
| `back-office-expert`   | `.claude/agent-memory/back-office-expert/`   |
| `linkme-expert`        | `.claude/agent-memory/linkme-expert/`        |
| `site-internet-expert` | `.claude/agent-memory/site-internet-expert/` |
| `database-architect`   | `.claude/agent-memory/database-architect/`   |
| `frontend-architect`   | `.claude/agent-memory/frontend-architect/`   |
| `code-reviewer`        | `.claude/agent-memory/code-reviewer/`        |
| `perf-optimizer`       | `.claude/agent-memory/perf-optimizer/`       |

## Memoire persistante (feedbacks & projets)

- **Emplacement** : `~/.claude/projects/-Users-romeodossantos-verone-back-office-V1/memory/`
- **Index** : `MEMORY.md` dans ce repertoire
- **Contenu** : Feedbacks de Romeo, bugs connus, decisions projet, references externes

---

## MCP Servers disponibles

| Serveur                      | Usage                                             |
| ---------------------------- | ------------------------------------------------- |
| Supabase                     | SQL, tables, migrations, types                    |
| Playwright (lane-1 & lane-2) | Tests visuels, navigation, screenshots            |
| Context7                     | Documentation librairies a jour                   |
| shadcn                       | Registre composants shadcn/ui (officiel, gratuit) |

---

## Stack technique

- **Framework** : Next.js 15 App Router
- **Language** : TypeScript strict (zero `any`)
- **UI** : shadcn/ui + Tailwind CSS
- **DB** : Supabase PostgreSQL (RLS obligatoire)
- **State** : React Query (TanStack Query)
- **Validation** : Zod
- **Tests** : Playwright MCP (visuels)
- **Monorepo** : pnpm workspaces + Turborepo
