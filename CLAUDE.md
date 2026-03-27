# Verone Back Office

CRM/ERP modulaire — decoration et mobilier haut de gamme.
Monorepo Turborepo : back-office (3000), linkme (3002), site-internet (3001).

## CRITICAL : Avant de coder

1. Lire `.claude/work/ACTIVE.md` (taches en cours)
2. Lire le `CLAUDE.md` de l'app concernee (`apps/[app]/CLAUDE.md`)
3. Lire 3 fichiers similaires avant toute modification (Triple Lecture)
4. Consulter `.claude/INDEX.md` pour trouver toute information

## Chemins critiques

- `supabase/migrations/` — source de verite schema DB
- `packages/@verone/types/src/supabase.ts` — types generes
- `packages/@verone/` — 26 packages partages (hooks, composants, utils)
- `.claude/work/ACTIVE.md` — sprints et taches en cours
- `.claude/INDEX.md` — sommaire centralise complet
- `.claude/rules/` — regles auto-discovered

## Commandes

```bash
pnpm --filter @verone/[app] build       # Build (TOUJOURS filtrer, jamais global)
pnpm --filter @verone/[app] type-check  # Type-check filtre
pnpm lint:fix                           # ESLint auto-fix
```

## Workflow

- `/search <domaine>` : DB + code + RLS avant implementation
- `/implement <feature>` : search → plan → code → verify
- `/plan` : features complexes → checklist dans ACTIVE.md
- `/review <app>` : audit qualite code
- `/pr` : push + PR vers staging

## Stack

- Next.js 15 App Router, TypeScript strict, shadcn/ui + Tailwind
- Supabase (RLS obligatoire), React Query, Zod
- Playwright MCP pour tests E2E visuels
- Context7 MCP pour documentation librairies

## CRITICAL : Regles absolues

- Zero `any` TypeScript — `unknown` + validation Zod
- JAMAIS modifier les routes API existantes (Qonto, adresses, emails, webhooks)
- JAMAIS de donnees test en SQL — SELECT + DDL only
- UNE entite = UNE page detail — jamais de doublons entre canaux
- Fichier > 400 lignes = refactoring obligatoire
- Feature branch depuis `staging` — format `[APP-DOMAIN-NNN] type: desc`

## Langue

Francais (code/commits en anglais). Comportement TEACH-FIRST : dire NON si != best practice.
