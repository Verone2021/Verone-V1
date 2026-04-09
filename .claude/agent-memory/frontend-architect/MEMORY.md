# Frontend Architect — Memoire Persistante

## Architecture monorepo

- 3 apps : back-office (3000), site-internet (3001), linkme (3002)
- 26 packages partages sous @verone/ (ui=62 composants, orders=60, products=69)
- 150+ hooks partages dans packages/@verone/
- Anciens chemins src/ OBSOLETES — toujours @verone/\* pour imports partages
- Turborepo + pnpm 10, JAMAIS npm/yarn
- Build filtre obligatoire : `pnpm --filter @verone/[app]`

## Stack technique

- Next.js 15 App Router, React 18, TypeScript strict
- shadcn/ui + Tailwind CSS (Design System V2)
- Supabase client (@supabase/ssr), React Query
- Zod pour validation TOUS les formulaires
- lucide-react pour icones

## Patterns obligatoires

- Server Components par defaut, "use client" uniquement si hooks/events
- Server Actions pour mutations (pas fetch client-side)
- next/image pour images (jamais <img>)
- Imports @verone/\* pour packages partages, @/ pour chemins locaux
- Fichier > 400 lignes = refactoring obligatoire (decomposer)
- Fonction > 75 lignes = extraire, Composant > 200 lignes = sous-composants

## Patterns async (CRITIQUE — bugs production silencieux)

- Promise flottante : toujours void + .catch() sur onClick async
- Event handler async : wrapper synchrone (pas async direct sur onSubmit)
- invalidateQueries : toujours await (sinon donnees obsoletes en UI)

## Pages back-office

- 165 pages, 22 modules
- Auth via layout (protected) + RLS — PAS de middleware (7 echecs, INTERDIT)
- eslint.ignoreDuringBuilds = true (531 warnings, crash SIGTRAP si active)

## Composants catalogue

- Catalogue composants : `docs/architecture/COMPOSANTS-CATALOGUE.md`
- TOUJOURS verifier si composant existe AVANT d'en creer un nouveau
- Template composant : `.claude/templates/component.tsx`
- CVA variants pour variations (pas de fichiers separes)

## Bugs recurrents

- parseInt NaN : 28 occurrences identifiees dans 15 fichiers (stashed)
- Middleware back-office : INTERDIT (MIDDLEWARE_INVOCATION_FAILED — 7 echecs)
- select("\*") sans limit : 55+ occurrences back-office, 14 LinkMe

## Performance UI

- Pagination serveur obligatoire pour tables/listings
- Virtualisation si gros volume
- 1 seul conteneur de scroll par page
- React Query staleTime = 5min standard, audit_logs = 60min

## Clean code audit (en cours)

- 73 fichiers > 500 lignes (100% back-office)
- 7 fichiers > 1000 lignes (LinkMeCataloguePage 1506, LeftColumn 878, etc.)
- Pattern decomposition : types.ts → hooks/ → components/ → helpers.ts → index.tsx

## Documentation de reference

- `docs/current/architecture-packages.md` — 347 composants, packages
- `docs/current/architecture.md` — structure monorepo
- `docs/current/INDEX-PAGES-BACK-OFFICE.md` — 165 pages
- `docs/current/component-audit-guidelines.md` — dead code detection (restaure)
- `docs/current/dev-workflow.md` — workflow quotidien (restaure)
- `docs/current/turborepo-paths.md` — chemins corrects (restaure)
