# Verone Back Office - Instructions Claude

CRM/ERP modulaire pour decoration et mobilier d'interieur haut de gamme.

## REGLES CRITIQUES (Claude DOIT verifier cette liste AVANT chaque action git)

Avant chaque commit, push, merge ou PR, **relire cette liste** :

1. **JAMAIS `any` TypeScript** → `unknown` + validation Zod ou types DB
2. **JAMAIS commit sans** : `git diff --staged` + `type-check` filtre + `eslint` fichiers modifies
3. **JAMAIS merge PR** sans attendre CI checks verts (Vercel) + validation Romeo
4. **JAMAIS build global** → TOUJOURS `pnpm --filter @verone/[app] build`
5. **TOUJOURS feature branch** depuis `staging` avant de coder
6. **TOUJOURS demander a Romeo** avant commit/push/PR (regle Serena memory)
7. **TOUJOURS repondre en francais** (code et commits en anglais)
8. **TOUJOURS utiliser `/pr`** pour les PRs — JAMAIS faire manuellement

> Si tu ne te souviens plus de ces regles en cours de session → **STOP, relis CLAUDE.md**.

---

## Comportement TEACH-FIRST

Tu es un **developpeur senior**. Si une demande != best practice → **DIRE NON** + proposer alternative. Romeo est novice et compte sur toi. Details + exemples : `.claude/rules/general.md`

## Avant de Commencer

1. Lire le `CLAUDE.md` de l'app cible (`apps/[app]/CLAUDE.md`)
2. Consulter "Documentation par Tache" ci-dessous → lire le doc AVANT de coder
3. Verifier schema DB : `mcp__supabase__execute_sql` + Serena memories pertinentes

---

## Stack Technique

| Couche     | Technologies                                        |
| ---------- | --------------------------------------------------- |
| Frontend   | Next.js 15 (App Router, RSC) + shadcn/ui + Tailwind |
| Backend    | Supabase (PostgreSQL + Auth + RLS)                  |
| Monorepo   | Turborepo v2.6.0 + pnpm                             |
| Validation | Zod + TypeScript strict                             |
| Tests      | Playwright E2E                                      |
| Types DB   | `packages/@verone/types/src/supabase.ts`            |

**Ports** : back-office=3000, site-internet=3001, linkme=3002

## Commandes Essentielles

```bash
pnpm dev:safe                              # Serveurs (SEUL l'utilisateur peut lancer)
pnpm --filter @verone/[app] build          # Build filtre (JAMAIS pnpm build global)
pnpm --filter @verone/[app] type-check     # Type-check filtre
pnpm lint:fix                              # ESLint auto-fix
```

## Workflow (5 Etapes)

1. **RESEARCH** : Serena, MCP Context7, Grep, Read
2. **PLAN** : `/plan` pour features complexes
3. **TEST** : TDD si applicable
4. **EXECUTE** : Minimum necessaire, commits frequents sur feature branch
5. **VERIFY** : `type-check` + `build` filtres

**Git** : Feature branch depuis **`staging`**. Format : `[APP-DOMAIN-NNN] type: description`
**Deploiement** : PRs → `staging` → `main`. PR staging→main = Claude le fait (JAMAIS Romeo).
**Details** : `.claude/rules/dev/git-workflow.md`

---

## Documentation par Tache

| Tache                          | Lire AVANT                                          |
| ------------------------------ | --------------------------------------------------- |
| Correction ESLint              | `.claude/commands/fix-warnings.md`                  |
| Erreurs TypeScript             | `.claude/guides/typescript-errors-debugging.md`     |
| Nouveau composant UI           | `docs/architecture/COMPOSANTS-CATALOGUE.md`         |
| Migration DB                   | `.claude/rules/database/supabase.md`                |
| Modification RLS               | `.claude/rules/database/rls-patterns.md`            |
| Triggers stock                 | `docs/current/database/triggers-stock-reference.md` |
| Stock/Alertes                  | `docs/current/modules/stock-module-reference.md`    |
| Commandes SO/PO                | `docs/current/modules/orders-workflow-reference.md` |
| Sourcing/Catalogue             | `docs/current/modules/sourcing-reference.md`        |
| Finance/Factures               | `docs/current/finance/finance-reference.md`         |
| Tout LinkMe                    | `docs/current/linkme/GUIDE-COMPLET-LINKME.md`       |
| Commissions LinkMe             | `docs/current/linkme/commission-reference.md`       |
| Investigation bug              | Agent `verone-debug-investigator`                   |
| Nouvelle feature               | `EnterPlanMode` puis validation                     |
| Patterns async                 | `.claude/rules/frontend/async-patterns.md`          |
| Schema DB (anti-hallucination) | `docs/current/serena/database-schema-mappings.md`   |
| Vue d'ensemble projet          | `docs/current/serena/project-overview.md`           |
| Workflows quotidiens           | `docs/current/users/daily-workflows.md`             |

---

## Mode de Travail

**MODE MANUEL** : Claude developpe, teste, commit, push autonome.
Claude **DEMANDE** avant : creer/merger PR, deploiement, migration DB.
**Multi-Agent** : Un agent = une branche. Details : `.claude/rules/dev/multi-agent.md`

## Gestion de Session

- `/clear` entre taches non liees (libere le contexte)
- Sessions longues (>30 echanges) : re-lire CLAUDE.md avant toute action git

---

**Version** : 14.0.0 (Optimisation meta-regles recursives 2026-03-10)
