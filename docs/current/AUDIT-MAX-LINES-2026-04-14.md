# Audit max-lines (> 500 lignes) — 2026-04-14

Regle ESLint : `max-lines: ['warn', { max: 500, skipBlankLines: true, skipComments: true }]`

**Total : 95 fichiers > 500 lignes** a travers le monorepo.

---

## Session 1 — @verone/products (11 fichiers)

**Agent** : `back-office-expert`
**Branche** : `fix/BO-MAXLINES-products`
**Priorite** : HAUTE (package partage, impact multi-app)

| #   | Fichier                           | Lignes | Complexite | Plan de decomposition                                                                |
| --- | --------------------------------- | ------ | ---------- | ------------------------------------------------------------------------------------ |
| 1   | `CompleteProductWizard.tsx`       | 678    | Moyenne    | Extraire les 4 steps du wizard en sous-composants (comme VariantGroupCreationWizard) |
| 2   | `ProductFixedCharacteristics.tsx` | 664    | Moyenne    | Extraire sections dimensions, variantes, video en sous-composants                    |
| 3   | `ProductHistoryModal.tsx`         | 626    | Faible     | Extraire la timeline et les filtres en sous-composants                               |
| 4   | `ProductDescriptionsModal.tsx`    | 583    | Faible     | Extraire les onglets description/technique/selling-points                            |
| 5   | `use-products.ts`                 | 581    | Elevee     | Decomposer en sous-hooks (useCatalogueSearch, useCatalogueFilters)                   |
| 6   | `ProductConsultationManager.tsx`  | 555    | Elevee     | Supprimer @ts-nocheck, typer, extraire sections                                      |
| 7   | `CharacteristicsEditSection.tsx`  | 555    | Moyenne    | Extraire les blocs dimensions/attributes/rooms                                       |
| 8   | `use-product-images.ts`           | 540    | Moyenne    | Extraire upload logic en use-product-image-upload.ts                                 |
| 9   | `ProductCharacteristicsModal.tsx` | 528    | Faible     | Extraire les sections du formulaire                                                  |
| 10  | `use-variant-products.ts`         | 525    | Moyenne    | Decomposer en sous-hooks                                                             |
| 11  | `ProductPhotosModal.tsx`          | 511    | Faible     | Extraire la galerie et l'upload en sous-composants                                   |

---

## Session 2 — Back-Office pages (36 fichiers)

**Agent** : `back-office-expert`
**Branche** : `fix/BO-MAXLINES-pages`

### Factures (3 fichiers — CRITIQUE, > 800 lignes)

| #   | Fichier                        | Lignes | Plan                                                      |
| --- | ------------------------------ | ------ | --------------------------------------------------------- |
| 1   | `factures/page.tsx`            | 976    | Extraire FiltresSection, TableSection, ModalsSection      |
| 2   | `factures/[id]/edit/page.tsx`  | 974    | Extraire les onglets du formulaire en sous-composants     |
| 3   | `factures/devis/[id]/page.tsx` | 883    | Extraire sections devis (header, lignes, totaux, actions) |

### API Routes (1 fichier — NE PAS TOUCHER)

| #   | Fichier                       | Lignes | Plan                                                |
| --- | ----------------------------- | ------ | --------------------------------------------------- |
| 4   | `api/qonto/invoices/route.ts` | 882    | ⚠️ PROTEGE — ne pas modifier (regle backend/api.md) |

### Canaux de vente (11 fichiers)

| #   | Fichier                                  | Lignes | Plan                                                            |
| --- | ---------------------------------------- | ------ | --------------------------------------------------------------- |
| 5   | `site-internet/ConfigurationSection.tsx` | 738    | Extraire en 4 sous-sections (branding, seo, shipping, payments) |
| 6   | `linkme/UserEditModal.tsx`               | 703    | Extraire les onglets du formulaire                              |
| 7   | `linkme/use-create-linkme-order-form.ts` | 662    | Extraire validation + submission en fichiers separes            |
| 8   | `linkme/use-linkme-users.ts`             | 651    | Decomposer en sous-hooks                                        |
| 9   | `linkme/use-linkme-storage.ts`           | 610    | Extraire upload + delete en fichiers separes                    |
| 10  | `linkme/UtilisateursClient.tsx`          | 552    | Extraire table + filtres en sous-composants                     |
| 11  | `linkme/order-missing-fields.ts`         | 534    | Utilitaire — decomposer par section de validation               |
| 12  | `linkme/DeliverySection.tsx`             | 524    | Extraire les formulaires adresse en sous-composants             |
| 13  | `site-internet/ProductsSection.tsx`      | 517    | Extraire table + modals en sous-composants                      |
| 14  | `linkme/use-performance-analytics.ts`    | 515    | Decomposer en sous-hooks par metrique                           |
| 15  | `linkme/UsersSection.tsx`                | 513    | Extraire table + actions en sous-composants                     |

### Finance (4 fichiers)

| #   | Fichier                            | Lignes | Plan                                           |
| --- | ---------------------------------- | ------ | ---------------------------------------------- |
| 16  | `finance/compte-resultat/page.tsx` | 593    | Extraire les sections P&L en sous-composants   |
| 17  | `finance/immobilisations/page.tsx` | 585    | Extraire table + formulaire en sous-composants |
| 18  | `finance/tva/page.tsx`             | 510    | Extraire le tableau TVA en sous-composant      |
| 19  | `factures/ActionCell.tsx`          | 507    | Extraire les menus contextuels                 |

### Autres pages BO (17 fichiers)

| #   | Fichier                                               | Lignes | Plan                                                   |
| --- | ----------------------------------------------------- | ------ | ------------------------------------------------------ |
| 20  | `actions/user-management.ts`                          | 588    | Decomposer par action (create, update, delete, invite) |
| 21  | `hooks/use-stock-core.ts`                             | 587    | Decomposer en sous-hooks (alerts, movements)           |
| 22  | `messages/payment-notifications-tab.tsx`              | 572    | Extraire table + filtres                               |
| 23  | `stocks/page.tsx`                                     | 569    | Extraire les sections dashboard stock                  |
| 24  | `forms/subcategory-form.tsx`                          | 553    | Extraire les sections du formulaire                    |
| 25  | `dashboard/get-dashboard-metrics.ts`                  | 548    | Decomposer par domaine (orders, finance, stock)        |
| 26  | `prises-contact/[id]/actions.ts`                      | 539    | Decomposer par action                                  |
| 27  | `produits/sourcing/echantillons-table.tsx`            | 538    | Extraire lignes + actions en sous-composants           |
| 28  | `produits/catalogue/categories/[categoryId]/page.tsx` | 537    | Extraire sections en sous-composants                   |
| 29  | `linkme/use-linkme-enseigne-customers.ts`             | 511    | Decomposer en sous-hooks                               |
| 30  | `forms/expense-form-sections.tsx`                     | 509    | Extraire chaque section en fichier                     |
| 31  | `messages/use-messages-items.ts`                      | 507    | Decomposer par type de message                         |
| 32  | `linkme/UserCreateModal.tsx`                          | 506    | Extraire les etapes du formulaire                      |
| 33  | `linkme/use-linkme-enseignes.ts`                      | 504    | Decomposer en sous-hooks                               |
| 34  | `stocks/stockage-dialogs.tsx`                         | 502    | Extraire chaque dialog en fichier                      |
| 35  | `linkme/types.ts`                                     | 502    | Decomposer par domaine                                 |
| 36  | `actions/bank-matching.ts`                            | 501    | Decomposer par strategie de matching                   |

---

## Session 3 — LinkMe (18 fichiers)

**Agent** : `linkme-expert`
**Branche** : `fix/LM-MAXLINES`

| #   | Fichier                         | Lignes | Plan                                                                      |
| --- | ------------------------------- | ------ | ------------------------------------------------------------------------- |
| 1   | `orders/BillingStep.tsx`        | 1104   | CRITIQUE — Extraire 5+ sous-composants (adresse, paiement, recapitulatif) |
| 2   | `use-user-selection.ts`         | 970    | Decomposer en 3 sous-hooks                                                |
| 3   | `ExistingRestaurantForm.tsx`    | 911    | Extraire les sections du formulaire                                       |
| 4   | `OrderFormUnified.tsx`          | 788    | Extraire les steps en sous-composants                                     |
| 5   | `order-form.schema.ts`          | 724    | Decomposer schemas par section                                            |
| 6   | `s/[id]/layout.tsx`             | 708    | Extraire header, sidebar, contexte                                        |
| 7   | `AddToSelectionModal.tsx`       | 684    | Extraire recherche + liste + preview                                      |
| 8   | `ProductDetailSheet.tsx`        | 677    | Extraire les onglets en sous-composants                                   |
| 9   | `ValidationStep.tsx`            | 672    | Extraire recapitulatif + conditions                                       |
| 10  | `SphereImageGrid.tsx`           | 670    | Extraire la logique de grid                                               |
| 11  | `SelectionProductsSheet.tsx`    | 656    | Extraire liste + actions                                                  |
| 12  | `use-affiliate-analytics.ts`    | 644    | Decomposer par metrique                                                   |
| 13  | `organisations/page.tsx`        | 640    | Extraire table + modals                                                   |
| 14  | `use-organisation-contacts.ts`  | 624    | Decomposer en sous-hooks                                                  |
| 15  | `use-submit-unified-order.ts`   | 620    | Extraire validation + submission                                          |
| 16  | `ProductsStep.tsx`              | 620    | Extraire recherche + panier                                               |
| 17  | `StoreLocatorMap.tsx`           | 610    | Extraire map + markers + popup                                            |
| 18  | `mes-produits/nouveau/page.tsx` | 608    | Extraire les etapes du wizard                                             |

---

## Session 4 — Site-Internet (2 fichiers)

**Agent** : `site-internet-expert`
**Branche** : `fix/SI-MAXLINES`

| #   | Fichier                 | Lignes | Plan                                                      |
| --- | ----------------------- | ------ | --------------------------------------------------------- |
| 1   | `checkout/page.tsx`     | 703    | Extraire les etapes checkout en sous-composants           |
| 2   | `api/checkout/route.ts` | 677    | Extraire helpers (calcul prix, creation commande, Stripe) |

---

## Session 5 — Packages @verone (28 fichiers)

**Agent** : `back-office-expert`
**Branche** : `fix/PKG-MAXLINES`

### @verone/finance (10 fichiers)

| #   | Fichier                         | Lignes | Plan                                    |
| --- | ------------------------------- | ------ | --------------------------------------- |
| 1   | `QuoteCreateFromOrderModal.tsx` | 1007   | CRITIQUE — Extraire 5+ sections         |
| 2   | `use-quotes.ts`                 | 932    | Decomposer en sous-hooks                |
| 3   | `FinanceDashboard.tsx`          | 721    | Extraire les widgets en sous-composants |
| 4   | `use-pricing.ts`                | 607    | Decomposer en sous-hooks                |
| 5   | `QuickClassificationModal.tsx`  | 635    | Extraire sections                       |
| 6   | `OrderSelectModal.tsx`          | 599    | Extraire recherche + table              |
| 7   | `InvoiceCreateServiceModal.tsx` | 562    | Extraire les etapes                     |
| 8   | `use-matching-rules.ts`         | 546    | Decomposer                              |
| 9   | `use-bank-transaction-stats.ts` | 546    | Decomposer                              |
| 10  | `use-bank-reconciliation.ts`    | 546    | Decomposer                              |

### @verone/orders (7 fichiers)

| #   | Fichier                                | Lignes | Plan                         |
| --- | -------------------------------------- | ------ | ---------------------------- |
| 1   | `PurchaseOrderReceptionForm.tsx`       | 709    | Extraire sections            |
| 2   | `use-create-linkme-order-form.ts`      | 638    | Decomposer                   |
| 3   | `SalesOrderDataTable.tsx`              | 631    | Extraire colonnes + actions  |
| 4   | `SalesOrderShipmentForm.tsx`           | 616    | Extraire sections            |
| 5   | `create-individual-customer-modal.tsx` | 591    | Extraire sections formulaire |
| 6   | `LinkMeWorkflow.tsx`                   | 555    | Extraire les etapes          |
| 7   | `QuickPurchaseOrderModal.tsx`          | 537    | Extraire sections            |

### @verone/stock (6 fichiers)

| #   | Fichier                     | Lignes | Plan                     |
| --- | --------------------------- | ------ | ------------------------ |
| 1   | `use-stock-movements.ts`    | 715    | Decomposer en sous-hooks |
| 2   | `use-stock.ts`              | 662    | Decomposer               |
| 3   | `use-stock-core.ts`         | 608    | Decomposer               |
| 4   | `use-stock-reservations.ts` | 593    | Decomposer               |
| 5   | `StockMovementModal.tsx`    | 569    | Extraire sections        |
| 6   | `use-stock-dashboard.ts`    | 559    | Decomposer               |

### Autres packages (5 fichiers)

| #   | Fichier                                             | Lignes | Plan                     |
| --- | --------------------------------------------------- | ------ | ------------------------ |
| 1   | `@verone/consultations/use-consultations.ts`        | 973    | Decomposer en sous-hooks |
| 2   | `@verone/common/CollectionCreationWizard.tsx`       | 730    | Extraire les steps       |
| 3   | `@verone/categories/use-catalogue.ts`               | 716    | Decomposer               |
| 4   | `@verone/common/SupplierVsPricingEditSection.tsx`   | 688    | Extraire sections        |
| 5   | `@verone/channels/GoogleMerchantProductManager.tsx` | 687    | Extraire sections        |

---

## Ordre recommande

1. **Session 1** : @verone/products (11 fichiers) — impact le plus large, deja commence
2. **Session 2** : Factures BO (3 fichiers > 800L) — les plus gros du monorepo
3. **Session 3** : LinkMe BillingStep (1104L) — le plus gros fichier
4. **Session 4** : @verone/finance (10 fichiers) — domaine complexe
5. **Session 5** : Reste des packages et pages

## Fichiers PROTEGES (ne pas toucher)

- `api/qonto/invoices/route.ts` (882L) — route API immuable
- `qonto/client.ts` (1654L) — client Qonto, integration externe
- `qonto/types.ts` (697L) — types Qonto, immuable
- Tous les fichiers `.d.ts` et `dist/` — generes automatiquement

## Workflow par fichier

1. Lancer `/fix-warnings` (plan de decomposition)
2. Agent specialise lit le fichier + 3 fichiers similaires
3. Extraire les sous-composants/sous-hooks
4. Type-check + ESLint = 0 erreurs/warnings
5. Verification visuelle Playwright (composants UI)
6. Commit + push
