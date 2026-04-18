# dev-report — Audit grid-cols-3/4 sans prefix responsive

**Date** : 2026-04-19
**Branche** : feat/responsive-final-cleanup
**Scope** : 3 apps (back-office, linkme, site-internet)

---

## Résultat

- **53 occurrences** analysées
- **22 fichiers corrigés** (24 occurrences)
- **29 occurrences SKIP** (acceptable tel quel)
- **Type-check** : exit 0 (back-office, linkme, site-internet)
- **Lint** : exit 0, 0 warnings (back-office)

---

## Fichiers corrigés

| Fichier                                                                                                          | Avant         | Après                        | Raison                                                            |
| ---------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------- | ----------------------------------------------------------------- |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/create-order/AdditionalCostsSection.tsx:44` | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 inputs numériques avec label — débordent à 375px                |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/EditLinkMeOrderModal.tsx:156`               | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 inputs numériques (frais additionnels) dans modal               |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/PricingMarginSection.tsx:39`                | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 inputs marge (min/max/suggested) avec labels longs              |
| `apps/back-office/src/components/forms/VariantGroupCategorySelector.tsx:55`                                      | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 selects (Famille/Catégorie/Sous-catégorie) — étiquettes longues |
| `apps/back-office/src/app/(protected)/produits/catalogue/modals/QuickEditDimensionsDialog.tsx:76`                | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 inputs dimensions dans dialog                                   |
| `apps/back-office/src/components/forms/VariantGroupDimensionsSection.tsx:39`                                     | `grid-cols-4` | `grid-cols-2 sm:grid-cols-4` | 4 inputs dimensions — 2 par ligne acceptable sur mobile           |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/GlobeItemsSection.tsx:182`                  | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 cards stats globales — contenu avec chiffres + labels longs     |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/PagesConfigurationSection.tsx:98`           | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 KPI cards avec labels descriptifs                               |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/catalogue/CatalogueStats.tsx:16`                       | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 KPI cards avec icônes + labels                                  |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/catalogue/configuration/components/KpiCards.tsx:15`    | `grid-cols-4` | `grid-cols-2 sm:grid-cols-4` | 4 KPI cards — 2×2 sur mobile acceptable                           |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/analytics/performance/page.tsx:298`                    | `grid-cols-4` | `grid-cols-2 sm:grid-cols-4` | 4 KPI cards page performance                                      |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/analytics/page.tsx:148`                                | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 commission cards (amber/vert/gris) avec montants                |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/analytics/page.tsx:279`                                | `grid-cols-4` | `grid-cols-2 sm:grid-cols-4` | 4 KPI cards affiliés actifs/commandes                             |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/edit-order-items-list.tsx:78`               | `grid-cols-4` | `grid-cols-2 sm:grid-cols-4` | 4 colonnes prix/input par ligne d'item dans modal                 |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/stockage/[id]/produit/[allocationId]/page.tsx:251`     | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 colonnes Volume/Quantité avec inputs                            |
| `apps/back-office/src/app/(protected)/stocks/stockage/stockage-owner-dialog.tsx:63`                              | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 stats (Unités/Volume/Facturable) dans dialog header             |
| `apps/linkme/src/components/organisations/OrganisationDetailModal.tsx:163`                                       | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 stats financières dans modal (linkme est mobile-first)          |
| `apps/linkme/src/app/(main)/mes-produits/nouveau/components/ProductStorageSection.tsx:108`                       | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 inputs dimensions — linkme utilisé sur mobile                   |
| `apps/linkme/src/app/(main)/mes-produits/[id]/ProduitStockageForm.tsx:84`                                        | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | 3 inputs dimensions — même raison                                 |
| `apps/linkme/src/app/(main)/statistiques/produits/components/ProductSalesDetailModal.tsx:252`                    | `grid-cols-4` | `grid-cols-2 sm:grid-cols-4` | 4 skeletons KPI dans modal — 2×2 mobile                           |
| `apps/linkme/src/components/landing/Hero.tsx:102`                                                                | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | Stats landing page — visible sur mobile                           |
| `apps/site-internet/src/app/checkout/components/CheckoutShippingForm.tsx:128`                                    | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | CP/Ville/Pays formulaire checkout — CRITIQUE mobile               |
| `apps/site-internet/src/app/checkout/components/CheckoutShippingForm.tsx:220`                                    | `grid-cols-3` | `grid-cols-1 sm:grid-cols-3` | CP/Ville/Pays facturation — même priorité                         |

---

## Occurrences SKIP (acceptable tel quel)

| Fichier                                                                     | Raison du SKIP                                                                          |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `canaux-vente/linkme/commissions/page.tsx:58`                               | `TabsList grid-cols-4` — pattern intentionnel, `hidden sm:inline` sur texte             |
| `canaux-vente/linkme/selections/new/ProductConfigCard.tsx:53`               | `grid-cols-3` avec 3 prix courts (max ~8 chars) — OK à 375px                            |
| `canaux-vente/linkme/components/ProductMarginEditor.tsx:166`                | `grid-cols-3` 3 prix affichage (read-only, courts) dans card                            |
| `canaux-vente/linkme/components/create-order/AdditionalCostsSection.tsx:75` | `grid-cols-4` 4 boutons taux TVA (20%/10%/5,5%/0%) — texte court                        |
| `canaux-vente/linkme/components/EditLinkMeOrderModal.tsx:122`               | `grid-cols-4` 4 boutons TVA dans modal — acceptable                                     |
| `canaux-vente/linkme/approbations/components/produits-tab-dialogs.tsx:123`  | `grid-cols-3` 3 boutons commission (%) — texte très court                               |
| `canaux-vente/linkme/stockage/components/StorageCard.tsx:63`                | `grid-cols-3` dans une card mobile — 3 chiffres courts                                  |
| `canaux-vente/linkme/components/ProductStatsCard.tsx:22`                    | `grid-cols-3` 3 stats (Vues/Sélections/Ordre) — chiffres courts                         |
| `canaux-vente/site-internet/components/CustomerDetailModal.tsx:109`         | `TabsList grid-cols-3` — intentionnel                                                   |
| `canaux-vente/site-internet/components/ProductPreviewModal.tsx:73`          | `grid-cols-4` 4 miniatures image — compact, OK                                          |
| `produits/catalogue/variantes/VariantGroupCard.tsx:164`                     | `grid-cols-4` 4 boutons action dans card footer — acceptable                            |
| `produits/catalogue/variantes/VariantGroupCard.tsx:211`                     | `grid-cols-3` 3 boutons action (archivé) — acceptable                                   |
| `produits/catalogue/collections/components/CollectionCard.tsx:200`          | `grid-cols-4` 4 boutons action — acceptable                                             |
| `produits/catalogue/collections/components/CollectionCard.tsx:243`          | `grid-cols-3` 3 boutons (archivé) — acceptable                                          |
| `admin/users/[id]/page.tsx:294`                                             | `TabsList grid-cols-3` — intentionnel                                                   |
| `stocks/stockage/stockage-owner-dialog.tsx:110`                             | `TabsList grid-cols-3` — intentionnel                                                   |
| `stocks/expeditions/page.tsx:26`                                            | `TabsList grid-cols-3` — intentionnel                                                   |
| `contacts-organisations/enseignes/[id]/page.tsx:85`                         | `grid-cols-4` dans skeleton loading — non affiché longtemps                             |
| `finance/immobilisations/ImmobilisationsComponents.tsx:135,144`             | `grid-cols-4` plan amortissement en format tableur — structure données                  |
| `factures/qonto/page.tsx:88`                                                | `TabsList grid-cols-3` — intentionnel                                                   |
| `linkme/components/landing/Hero.tsx:157`                                    | `grid-cols-3` mockup UI décoratif (wireframe) — non interactif                          |
| `linkme/components/storage/StorageProductCard.tsx:65`                       | `grid-cols-3` dans card déjà mobile — 3 chiffres courts                                 |
| `linkme/components/organisations/organisation-detail/ActivityTab.tsx:31`    | Expression JSX dynamique `grid-cols-3` ou `grid-cols-2` — skip (logique conditionnelle) |
| `linkme/components/organisations/OrganisationDetailSheet.tsx:341`           | `TabsList grid-cols-3` — intentionnel                                                   |
| `linkme/mes-produits/components/ProductDetailSheet.tsx:278`                 | `grid-cols-3` 3 badges dimension (L/l/H) — affichage très court                         |
| `site-internet/components/layout/MegaMenu.tsx:114`                          | `grid-cols-3` dropdown desktop only (position:absolute, jamais rendu sur mobile)        |

---

## Vérifications

```
pnpm --filter @verone/back-office type-check  → exit 0
pnpm --filter @verone/back-office lint        → exit 0, 0 warnings
pnpm --filter @verone/linkme type-check       → exit 0
pnpm --filter @verone/site-internet type-check → exit 0
```
