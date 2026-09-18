# Review Report — 2026-09-12 — P3a correctifs rapides sourcing

## Verdict : PASS WITH WARNINGS (0 CRITICAL)

Branche locale `fix/BO-SOURCING-P3A-correctifs-rapides`, 7 commits `[BO-SOURCING-P3A-001]` au-dessus de `origin/staging`
(`3a39703a`). Périmètre audit 2026-09-12 § 6 P3a : B2, B4, B5, B7, B14, B15, B24. Anti-raccourcis : 0 `@ts-ignore`,
0 `as any`, 0 `eslint-disable`, aucun seuil abaissé.

### WARNING — `apps/back-office/src/app/(protected)/produits/sourcing/produits/[id]/page.tsx` — catch externe mort (B2)

`validateSourcing` capture toutes ses erreurs et renvoie `false` ; le `try/catch` de `handleValidateSourcing` n'était
jamais atteint. **Corrigé par le coordinateur** (commit de suivi sur B2).

### INFO — `SourcingCandidateSuppliers.tsx` — `shortlisted` sans bouton de transition

Statut affiché s'il existe en base, mais aucune action ne permet d'y aller. À traiter en P4 si l'étape est utilisée.

### INFO — `packages/@verone/consultations/src/hooks/use-consultations.ts:183` — `select('*')` sans `.limit()`

Dette pré-existante, non modifiée ; rendue visible par B15 (un chargement par client). À traiter en P2a/P2c.

## Par correctif

- **B2** : `validateSourcing` renvoie un booléen sur tous les chemins ; succès → `/produits/catalogue`. PASS.
- **B4** : `useInlineEdit` écrit en base et n'affiche pas de message ; la page recharge et affiche un seul message ; `refetch` ne lève pas. PASS.
- **B5** : `update({ archived_at: null })` couvert par la règle `backoffice_full_access_products` ; `product_id` dans les dépendances ; autres appelants (`SampleValidationSimple`, `SourcingQuickForm`) non impactés. PASS.
- **B7** : plus aucun statut `'quoted'` ; colonnes `quoted_*` intactes ; aligné sur la contrainte base. PASS.
- **B14** : la redirection `/organisations/:id` ne capture pas `/api/organisations/*` ; aucune page `(protected)/organisations` masquée ; lien cohérent avec les 6 autres usages. PASS.
- **B15** : `fetchConsultations` stable (`useCallback([])`) ; `consultations` hors des dépendances de l'effet ; tri, max 3, chargement conservés. PASS.
- **B24** : `estimated_selling_price` optionnel et sans consommateur ; condition marge correcte. PASS.
- **Contrat plugin Chrome** : `git diff` vide sur `api/sourcing` et `chrome-extension`. PASS.

## Preuves du coordinateur (non contredites)

type-check back-office / `@verone/products` / `@verone/consultations` 0 ; ESLint `--max-warnings=0` 0 ; écran (lane-2,
produit TEST seul, remis à l'état d'origine) : B4 1 PATCH par enregistrement, B5 fiche archivée lisible + Restaurer
(1 PATCH), B14 fiche fournisseur, B24 textes ; serveur local `/organisations/<id>` → 307 `/contacts-organisations/<id>`.
