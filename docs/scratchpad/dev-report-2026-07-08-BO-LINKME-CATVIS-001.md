# Dev report — BO-LINKME-CATVIS-001 : visibilité produit au catalogue LinkMe

Branche : `feat/BO-LINKME-CATVIS-001-product-catalog-visibility`
Date : 2026-07-08

## Objectif

Donner un contrôle par produit, depuis la fiche produit back-office :

1. interrupteur « Afficher au catalogue LinkMe » (kill-switch, n'importe quel produit) ;
2. bloc « Réservé à un client » (sur mesure → invisible au catalogue général, visible seulement par le client).
   Portée : LinkMe uniquement.

## Décisions techniques

- **Stockage** : nouvelle colonne `products.is_visible_in_linkme_catalog BOOLEAN NOT NULL DEFAULT true`
  (kill-switch orthogonal à `channel_pricing.is_active` et à `show_on_linkme_globe`).
- **Wiring UI** : réutilisation du mécanisme existant `handleProductUpdate` de la fiche
  (`use-product-detail.tsx`) plutôt que 2 nouvelles routes API. Plus simple, cohérent avec
  les autres onglets (pricing/stock/characteristics utilisent déjà `onProductUpdate`).
  La cohérence « réservé ⇒ product_type=custom + un seul client » est garantie par l'UI
  (client + type écrits ensemble), ce qui remplace la validation API prévue au plan (le
  trigger `validate_custom_product_assignment` est BEFORE INSERT only, non touché).
- **Réservation** : réutilise `assigned_client_id` / `enseigne_id` + composant partagé
  `ClientOrEnseigneSelector` (`@verone/products`).

## Base de données (commit 1, déjà appliqué)

Migration `supabase/migrations/20260708120000_bo_linkme_catvis_001_catalog_visibility.sql` :
colonne + backfill true + NOT NULL + index partiel + marquage `product_type='custom'` des
4 produits DSA (décision Romeo). Types régénérés à la main (jeton CLI expiré) dans
`packages/@verone/types/src/supabase.ts` et `apps/back-office/src/types/supabase.d.ts`.

Contrôle post-migration : 234 visibles / 0 caché, 4 custom, 0 incohérent, 18 globe intacts.

## Fichiers modifiés (commit 2)

Back-office :

- `.../produits/catalogue/[id]/_components/product-publication-tab.tsx` — section « Catalogue
  LinkMe » (Switch visibilité + ClientOrEnseigneSelector réservation), prop `onProductUpdate`.
- `.../produits/catalogue/[id]/page.tsx` — passe `onProductUpdate={handleProductUpdate}`.
- `.../canaux-vente/linkme/hooks/catalog/fetchers-list.ts` — select + expose le champ (NON filtré).
- `.../canaux-vente/linkme/hooks/catalog/types.ts` — champ ajouté au Pick + interface.

LinkMe (filtre effectif) :

- `apps/linkme/src/lib/hooks/use-linkme-catalog.ts` — select + filtre serveur
  `.eq('products.is_visible_in_linkme_catalog', true)` + garde-fou dans `categorizeProducts`
  - champ ajouté aux types/mapping.

## Vérifications

- Type-check back-office : (à compléter)
- Type-check linkme : (à compléter)
- Test navigateur : fiche produit (toggle + réservation) + catalogue LinkMe (absence produit caché).

## Points de vigilance

- Filtre serveur `products.is_visible_in_linkme_catalog=true` compatible `!inner`.
- BO management (`fetchers-list.ts`) expose mais ne filtre pas → le staff voit les produits
  cachés pour les réactiver.
- Aucune route Qonto, aucun trigger stock touché.
