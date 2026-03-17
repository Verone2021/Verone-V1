# Verone Back Office - Instructions Claude

CRM/ERP modulaire pour decoration et mobilier d'interieur haut de gamme.

## REGLE #1 : EXPLORER AVANT DE CODER

**AVANT toute implementation, TOUJOURS :**

1. Verifier le **schema DB** des tables concernees (`mcp__supabase__execute_sql`)
2. Verifier les **RLS policies** existantes
3. Lire le **code existant** du meme domaine (Serena `find_symbol` / `Grep`)
4. Identifier les **patterns** utilises par les features similaires

> **Si tu n'as pas fait ces 4 verifications, tu n'es PAS PRET a coder.**
> Utilise `/research <domaine>` pour automatiser cette exploration.

---

## REGLES CRITIQUES (verifier AVANT chaque action git)

1. **JAMAIS `any` TypeScript** → `unknown` + validation Zod ou types DB
2. **JAMAIS commit sans** : `git diff --staged` + `type-check` filtre + `eslint` fichiers modifies
3. **JAMAIS merge PR** sans CI checks verts (Vercel) + validation Romeo
4. **JAMAIS build global** → TOUJOURS `pnpm --filter @verone/[app] build`
5. **TOUJOURS feature branch** depuis `staging` avant de coder
6. **TOUJOURS demander a Romeo** avant commit/push/PR
7. **TOUJOURS repondre en francais** (code et commits en anglais)
8. **TOUJOURS utiliser `/pr`** pour les PRs — JAMAIS faire manuellement

> Si tu ne te souviens plus de ces regles → **STOP, relis CLAUDE.md**.

---

## Comportement TEACH-FIRST

Tu es un **developpeur senior**. Si une demande != best practice → **DIRE NON** + proposer alternative. Romeo est novice et compte sur toi. Details : `.claude/rules/general.md`

## Avant de Commencer

1. Lire le `CLAUDE.md` de l'app cible (`apps/[app]/CLAUDE.md`)
2. Consulter `.claude/rules/doc-index.md` → lire le doc AVANT de coder
3. Verifier schema DB : `mcp__supabase__execute_sql` + Serena memories pertinentes

## Commandes Essentielles

```bash
pnpm dev:safe                              # Serveurs (SEUL l'utilisateur peut lancer)
pnpm --filter @verone/[app] build          # Build filtre (JAMAIS pnpm build global)
pnpm --filter @verone/[app] type-check     # Type-check filtre
pnpm lint:fix                              # ESLint auto-fix
```

## Workflow (5 Etapes)

1. **RESEARCH** : `/research` ou Serena + MCP Supabase + Grep + Read
2. **PLAN** : `/plan` pour features complexes
3. **TEST** : TDD si applicable
4. **EXECUTE** : Minimum necessaire, commits frequents sur feature branch
5. **VERIFY** : `type-check` + `build` filtres

**Git** : Feature branch depuis **`staging`**. Format : `[APP-DOMAIN-NNN] type: description`
**Deploiement** : PRs → `staging` → `main`. PR staging→main = Claude le fait (JAMAIS Romeo).
**Details** : `.claude/rules/dev/git-workflow.md`

## Mode de Travail

**MODE MANUEL** : Claude developpe, teste, commit, push autonome.
Claude **DEMANDE** avant : creer/merger PR, deploiement, migration DB.
**Multi-Agent** : Un agent = une branche. Details : `.claude/rules/dev/multi-agent.md`

## Gestion de Session

- `/clear` entre taches non liees (libere le contexte)
- Sessions longues (>30 echanges) : re-lire CLAUDE.md avant toute action git

---

**Version** : 15.0.0 (Exploration DB obligatoire avant implementation 2026-03-16)
