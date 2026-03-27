# Verone Back Office

CRM/ERP modulaire — decoration et mobilier haut de gamme.
Monorepo : back-office (3000), linkme (3002), site-internet (3001).

## Commandes

```bash
pnpm --filter @verone/[app] build       # Build (TOUJOURS filtrer, jamais global)
pnpm --filter @verone/[app] type-check  # Type-check filtre
pnpm lint:fix                           # ESLint auto-fix
```

## Regles

- Explorer avant coder : schema DB + code existant + patterns AVANT toute modification
- Zero `any` TypeScript : `unknown` + validation Zod
- Feature branch depuis `staging` : format `[APP-DOMAIN-NNN] type: desc`
- Demander a Romeo avant commit/push/PR/migration
- JAMAIS de donnees test en SQL : SELECT + DDL only. Donnees test = UI Playwright
- UNE entite = UNE page detail. Jamais de pages doublons entre canaux de vente
- JAMAIS modifier les routes API (Qonto, adresses, Packlink, emails, webhooks)

## Workflow

- `/research <domaine>` : DB + code + RLS avant implementation
- `/implement <feature>` : explore → code → verify
- `/plan` : features complexes
- `/pr` : push + PR

## Stack

- Next.js 15 App Router, TypeScript strict, shadcn/ui + Tailwind
- Supabase (RLS obligatoire), React Query, Zod
- Playwright MCP pour tests E2E visuels
- Context7 MCP pour documentation librairies a jour (`mcp__context7__resolve-library-id` + `mcp__context7__query-docs`)
- Serena MCP pour navigation code semantique (`mcp__serena__find_symbol`, `mcp__serena__list_memories`)

## Langue

Francais (code/commits en anglais). Comportement TEACH-FIRST : dire NON si != best practice.
