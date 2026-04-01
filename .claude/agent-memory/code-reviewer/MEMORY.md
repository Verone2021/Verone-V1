# Code Reviewer — Memoire Persistante

## Checklist critique (ordre de priorite)

### 1. TypeScript stricte

- Zero `any` — utiliser unknown + validation Zod
- Zero @ts-ignore sans justification
- Imports propres (pas import \*, pas barrel exports)

### 2. Async patterns (bugs production silencieux)

- Promise flottante : void + .catch() obligatoire
- Event handler async : wrapper synchrone
- invalidateQueries : TOUJOURS await
- 3 fichiers back-office avec invalidateQueries sans await identifies (InvoicesSection.tsx)

### 3. RLS securite

- TOUTES les tables avec RLS enable
- Staff : is_backoffice_user() (JAMAIS user_profiles.app)
- LinkMe : isolation enseigne_id XOR organisation_id
- auth.uid() wrappe dans (SELECT auth.uid())
- JAMAIS raw_user_meta_data (obsolete)

### 4. Supabase queries

- select("\*") INTERDIT sans limit — 55+ occurrences back-office, 14 LinkMe
- select explicite avec colonnes nommees
- .limit() sur grandes tables

### 5. API routes

- Validation Zod OBLIGATOIRE sur tous les inputs
- JAMAIS modifier routes existantes (Qonto, adresses, emails, webhooks)
- JAMAIS exposer credentials dans response

### 6. Composants UI

- Pas de doublons (ButtonV2, MyButton, CustomButton = REFUSE)
- shadcn/ui base pour nouveaux composants
- next/image pour images (jamais <img>)
- Server Components par defaut

## Hotspots connus (fichiers a risque)

- `apps/back-office/src/components/orders/InvoicesSection.tsx` — invalidateQueries void (6 occurrences)
- `use-linkme-page-config.ts` — invalidateQueries void
- `use-organisation-addresses-bo.ts` — invalidateQueries void
- `use-linkme-analytics.ts` — pattern legacy useState+useEffect (pas React Query)
- `use-linkme-public.ts` — 4x select('\*') sur pages publiques

## Patterns valides (a approuver)

- Policies linkme_affiliates_own et linkme_selection_items : utilisent (SELECT auth.uid()) correctement
- user_app_roles a un index composite RLS dedie (idx_user_app_roles_rls_linkme)
- Tous invalidateQueries dans LinkMe sont correctement awaites

## Seuils clean code

- Fichier > 400 lignes : STOP, refactoring avant merge
- Fonction > 75 lignes : extraire
- Composant > 200 lignes : decomposer en sous-composants

## Documentation de reference

- `.claude/rules/frontend/async-patterns.md` — patterns async obligatoires
- `.claude/rules/database/rls-patterns.md` — patterns RLS
- `.claude/commands/review-references/` — regles TypeScript, securite, performance, seuils
- `docs/current/eslint-progressive-ratchet.md` — strategie ESLint (restaure)
