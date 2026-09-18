# Dev report — 2026-09-14 — BO-CHANNELS-P7-001 — Règle unique « vendable »

Règle (décision de Roméo 13/09) : `archived_at IS NULL AND product_status IN ('active','preorder') AND
coalesce(creation_mode,'complete') <> 'sourcing'`, ajoutée **en plus** des drapeaux propres à chaque canal.

## Base — préparée, NON appliquée (attend « OK P7 »)

| Fichier                                                              | Contenu                                                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `20260914020000_bo_channels_p7_product_is_sellable.sql`              | `product_is_sellable(timestamptz, product_status_type, varchar)` IMMUTABLE, `search_path` vide, aucun droit anon                                 |
| `20260914020100_bo_channels_p7_linkme_sellable.sql`                  | vue `linkme_public_products`, `get_linkme_catalog_products_for_affiliate`                                                                        |
| `20260914020200_bo_channels_p7_public_selections_sellable.sql`       | `get_public_selection(uuid)`, `get_public_selection_by_slug(text)` (aucun filtre produit jusque-là)                                              |
| `20260914020300_bo_channels_p7_marketing_consultations_sellable.sql` | Google (règle), **Meta réparée** (`p.status` inexistante), consultations (vendables + sourcing en cours)                                         |
| `20260914020400_bo_channels_p7_site_internet_sellable.sql`           | `get_site_internet_products` (filtre, variantes éligibles, `is_eligible`, motif « Produit non vendable »), `get_site_internet_collection_detail` |

Non traitée : `get_public_selection(text, text)` — sans appelant, **déjà en erreur** en production
(`linkme_affiliates.branding_description` inexistante) → ménage P6.

**Retour arrière** : exporter les définitions en production (`pg_get_functiondef`, `pg_get_viewdef`) dans un fichier
de retour arrière juste avant l'application ; les versions du 14/09 figurent aussi dans le compte rendu de recherche P7.

## Essai en transaction annulée (14/09)

Méthode : fonction de base créée, puis les définitions en production modifiées par substitution exacte du filtre
(10 substitutions appliquées, 0 ancien filtre restant dans la fonction du site), comptes relus. Base vérifiée
identique ensuite (fonction absente, vue / Meta / site inchangés).

| Canal                                 |  Avant | Après | Explication produit par produit                                                                                                                 |
| ------------------------------------- | -----: | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Site internet                         |    177 |   177 | aucun produit publié non vendable                                                                                                               |
| Vitrine LinkMe                        |     19 |    23 | + précommandes BAN-0009, SUS-0005, SUS-0006, SUS-0007                                                                                           |
| Catalogue affiliés LinkMe             |     38 |    42 | + les 4 mêmes précommandes                                                                                                                      |
| Google Merchant éligibles             |    207 |   213 | + précommandes SUS-0004, SUS-0005, SUS-0006, SUS-0007, LAM-0001, BAN-0009                                                                       |
| Meta éligibles                        | erreur |   148 | fonction réparée (148 produits actifs publiés non synchronisés)                                                                                 |
| Consultations proposables             |    209 |   219 | + 6 précommandes ; + 4 produits en sourcing en cours (SRC-MPN3RXB5, PRD-0314 TEST, PRD-0313 Plateaux Pokawa, SRC-MNZ71MS9)                      |
| Sélection Pokawa (`/s/` uuid et slug) |     42 |    36 | − PRD-0310/0311/0312 Paniers (retirés, arrêtés), VAS-0007 Soliflore GM, VAS-0005 Vase Tamegroute (retirés), MEU-0001 Meuble TABESTO (brouillon) |
| Sélection Black & White Burger        |      2 |     2 | —                                                                                                                                               |

À signaler à Roméo : LAM-0001 Lanterne (précommande, sans image) devient éligible Google avec l'image par défaut
(comportement actuel de la fonction pour tout produit sans image).

## Code (fait, commit local `539d9b10` + sélecteur)

- Miroir `packages/@verone/products/src/utils/is-product-sellable.ts` : `isProductSellable`, `unsellableReasons`,
  `isProductProposableInConsultation` + tests OK.
- LinkMe : `use-linkme-catalog.ts` (catalogue des affiliés, dont « Plateaux Pokawa » en sourcing jusque-là visible)
  et `use-linkme-public.ts` (page `/[affilié]/[sélection]`, lecture directe des tables) filtrent la règle.
- Google Merchant : `batch-add` et `visibility` refusent un produit non vendable (422, motif en français),
  `batch-sync` filtre la règle, `sync-product` renvoie les motifs. Meta : `batch-add` et `visibility` idem.
- Consultations : `api/consultations/associations` refuse (422) un produit ni vendable ni en sourcing en cours.
- Export Excel Google : filtre sur `product_status` (la colonne `status` n'existe pas).
- Sélecteur de produits : option `sellableOnly`, activée pour les commandes client (`StandardOrderForm`,
  `AddProductToOrderModal` quand `orderType === 'sales'`) ; commandes fournisseurs et mouvements de stock inchangés.
- Contrôles : types et lint OK (products, orders, back-office, LinkMe). Pas de test à l'écran : les fonctions de
  base ne sont pas appliquées ; à faire après « OK P7 » (site, `/s/` Pokawa et Black & White, catalogue LinkMe).
