# INDEX CENTRALISE — Verone Back Office

**Derniere mise a jour** : 2026-03-27

Ce fichier est le sommaire unique pour trouver toute l'information du repository.
Tout agent ou commande doit commencer par consulter cet index.

---

## Taches en cours

- **`.claude/work/ACTIVE.md`** — Sprints, taches, bugs en cours. LIRE EN PREMIER.

---

## Commandes Slash

| Commande | Description | Fichier |
|---|---|---|
| `/search` | Exploration exhaustive codebase + DB + RLS (remplace /explore et /research) | `.claude/commands/search.md` |
| `/implement` | Feature implementation (search → plan → code → verify) | `.claude/commands/implement.md` |
| `/plan` | Transformer observations en checklist dans ACTIVE.md | `.claude/commands/plan.md` |
| `/db` | Operations Supabase rapides | `.claude/commands/db.md` |
| `/pr` | Push + PR (**sur ordre Romeo uniquement**) | `.claude/commands/pr.md` |
| `/review` | Audit code complet avec rapport | `.claude/commands/review.md` |
| `/fix-warnings` | ESLint auto-fix | `.claude/commands/fix-warnings.md` |
| `/teach` | Mode pedagogique (expliquer avant implementer) | `.claude/commands/teach.md` |

---

## Agents Specialises

### Agents par application (utiliser en priorite)

| Agent | App | Quand l'utiliser |
|---|---|---|
| `linkme-expert` | LinkMe | Commandes affilies, commissions, selections, formulaires, organisations, roles |
| `back-office-expert` | Back-Office | Produits, stock, commandes, factures, finance Qonto, expeditions |
| `site-internet-expert` | Site-Internet | E-commerce, catalogue, checkout, panier, SEO |

### Agents transversaux

| Agent | Role | Quand l'utiliser |
|---|---|---|
| `code-reviewer` | QA avant PR | Audit qualite TypeScript, async, RLS |
| `database-architect` | Expert DB Supabase | Tables, migrations, triggers, RLS |
| `frontend-architect` | Expert UI/UX | Next.js 15, composants, patterns generiques |
| `perf-optimizer` | Performance | Dead code, overfetch, bundle, DB bottlenecks |

---

## Regles (auto-discovered par Claude Code)

| Fichier | Contenu |
|---|---|
| `rules/dev/git-workflow.md` | Branches, commits, PR — **STOP avant commit/push/PR** |
| `rules/dev/context-loading.md` | **OBLIGATOIRE** — consulter contexte avant de coder |
| `rules/dev/build-commands.md` | Toujours filtrer `pnpm --filter @verone/[app]` |
| `rules/dev/hooks-bloquants.md` | Documentation des hooks actifs |
| `rules/dev/servers.md` | Ports 3000/3001/3002 — JAMAIS lancer dev |
| `rules/dev/multi-agent.md` | Coordination multi-agents |
| `rules/dev/deployment-verification.md` | Checklist post-deploiement |
| `rules/dev/playwright-screenshots.md` | Screenshots dans `.playwright-mcp/screenshots/` |
| `rules/frontend/async-patterns.md` | Promesses, handlers async, invalidateQueries |
| `rules/backend/api.md` | Route handlers, validation Zod, JAMAIS modifier API existantes |
| `rules/database/supabase.md` | Migrations, RLS, queries, types |
| `rules/database/rls-patterns.md` | Patterns RLS complets (staff, affilies, public) |

---

## Documentation par domaine

### Back-Office
| Sujet | Source |
|---|---|
| Guide complet | `docs/current/INDEX-BACK-OFFICE-COMPLET.md` |
| Pages index | `docs/current/INDEX-PAGES-BACK-OFFICE.md` |
| Entites metier | `docs/current/back-office-entities-index.md` |
| CLAUDE.md | `apps/back-office/CLAUDE.md` |

### LinkMe
| Sujet | Source |
|---|---|
| Guide complet | `docs/current/linkme/GUIDE-COMPLET-LINKME.md` |
| Index complet | `docs/current/INDEX-LINKME-COMPLET.md` |
| Commissions | `docs/current/linkme/commission-reference.md` |
| CLAUDE.md | `apps/linkme/CLAUDE.md` |

### Site Internet
| Sujet | Source |
|---|---|
| Index complet | `docs/current/INDEX-SITE-INTERNET-COMPLET.md` |
| CLAUDE.md | `apps/site-internet/CLAUDE.md` |

### Database
| Sujet | Source |
|---|---|
| Tables par domaine | Serena `database-tables-by-domain` |
| Triggers stock | `docs/current/database/triggers-stock-reference.md` |
| RLS patterns | `.claude/rules/database/rls-patterns.md` |
| Mapping pages-tables | `docs/current/MAPPING-PAGES-TABLES.md` |

### Finance
| Sujet | Source |
|---|---|
| Reference finance | `docs/current/finance/finance-reference.md` |
| Systeme Qonto | Serena `qonto-invoicing-system` |

### Modules
| Sujet | Source |
|---|---|
| Stock | `docs/current/modules/stock-module-reference.md` |
| Commandes (workflow) | `docs/current/modules/orders-workflow-reference.md` |
| Sourcing | `docs/current/modules/sourcing-reference.md` |

---

## Serena Memories (contexte metier persistant)

### Architecture
- `project-architecture` — Architecture globale monorepo
- `site-internet-architecture` — Architecture site e-commerce
- `back-office-sections-index` — Sections du back-office
- `linkme-business-model` — Modele metier LinkMe

### Database
- `database-tables-by-domain` — Tables par domaine metier
- `address-system-architecture` — Systeme d'adresses
- `business-rules-organisations` — Regles metier organisations

### LinkMe (9 memories)
- `linkme-order-commission-workflow` — Workflow commandes + commissions
- `linkme-auth-patterns` — Authentification et roles
- `linkme-public-selections-architecture` — Selections publiques
- `linkme-price-locking-system` — Verrouillage prix
- `linkme-commission-rules` — Regles de commission
- `linkme-commission-vs-margin-fields` — Champs commission vs marge
- `linkme-order-contact-workflow` — Workflow contacts commande
- `linkme-info-request-workflow` — Workflow demandes d'info
- `sales-orders-linkme-details-schema` — Schema details commandes

### Operations
- `stock-triggers-alerts-complete` — Triggers stock et alertes
- `notifications-system-audit-2026-03` — Systeme notifications
- `sales-order-status-workflow-complete` — Workflow commandes vente
- `purchase-order-status-workflow-complete` — Workflow commandes achat
- `sales-invoices-processing-rules` — Regles traitement factures
- `qonto-invoicing-system` — Systeme facturation Qonto
- `auth-middleware-patterns` — Patterns middleware auth

---

## Memoire persistante (feedbacks & projets)

- **Emplacement** : `~/.claude/projects/-Users-romeodossantos-verone-back-office-V1/memory/`
- **Index** : `MEMORY.md` dans ce repertoire
- **Contenu** : Feedbacks de Romeo, bugs connus, decisions projet, references externes

---

## MCP Servers disponibles

| Serveur | Usage |
|---|---|
| Supabase | SQL, tables, migrations, types |
| Playwright (lane-1 & lane-2) | Tests visuels, navigation, screenshots |
| Serena | Navigation code semantique, memories |
| Context7 | Documentation librairies a jour |
| Magic | Composants UI (21st.dev) |

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
