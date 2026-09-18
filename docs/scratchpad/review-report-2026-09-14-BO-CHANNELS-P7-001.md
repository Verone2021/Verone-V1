# Review Report — 2026-09-14 — BO-CHANNELS-P7-001

Revue de `git diff e40dbe03` (commits 539d9b10, e7dc7e39) par reviewer-agent.

## Verdict : PASS WITH WARNINGS

Périmètre : 5 migrations SQL (non appliquées), 2 hooks LinkMe, 7 routes API back-office, utilitaire TypeScript + tests,
2 fenêtres de commande, 1 hook de sélecteur. Définitions comparées à la production pour
`get_linkme_catalog_products_for_affiliate`, `linkme_public_products`, `get_google_merchant_eligible_products`,
`get_meta_eligible_products`, `get_consultation_eligible_products`, `get_site_internet_collection_detail`.
Anti-raccourcis : aucun `@ts-ignore`, `as any`, `as unknown as`, `eslint-disable` ni seuil abaissé introduit.

## WARNING — `.neq('creation_mode', 'sourcing')` exclut les NULL, la règle SQL les inclut

`use-linkme-catalog.ts`, `use-linkme-public.ts`, `google-merchant/batch-sync/route.ts` : PostgREST génère
`creation_mode <> 'sourcing'`, faux pour NULL, alors que `product_is_sellable` utilise
`COALESCE(creation_mode,'complete') <> 'sourcing'`. 0 produit actif / précommande à `creation_mode` NULL aujourd'hui,
mais divergence permanente.
**Fix** : `.or('creation_mode.neq.sourcing,creation_mode.is.null')` (option de table référencée pour les colonnes embarquées).

## WARNING — `20260914020300` : en-tête « comportement inchangé » inexact pour les consultations

Précommandes désormais incluses, produits en sourcing restreints aux statuts ouverts.
**Fix** : préciser le changement de comportement dans l'en-tête.

## INFO

- `product_is_sellable` : pure, IMMUTABLE / PARALLEL SAFE justifiés, `search_path` vide, pas de droit anon ; les
  appelants SECURITY DEFINER et la vue peuvent l'exécuter ; `CREATE OR REPLACE VIEW` conserve les droits.
- Miroir TypeScript fidèle (cas `creation_mode` NULL testé) ; 9 cas de `isProductProposableInConsultation`.
- Meta réparée proprement ; `get_site_internet_collection_detail` identique à la production hors filtre.
- Sélecteur : `sellableOnly` dans les dépendances de l'effet ; activé pour les commandes client seulement.

## Suite donnée (coordinateur)

- Les 4 filtres `.neq` (dont celui du sélecteur de commandes, même motif) remplacés par un `or` incluant NULL.
- En-tête de `20260914020300` complété.
