# Packages Partages (@verone/)

Reference des composants et hooks reutilisables. **CONSULTER AVANT de creer un nouveau composant.**

## Packages Principaux

### @verone/ui — Design System (62 composants)

Composants shadcn/ui + custom. Import : `import { Button, Card, ... } from '@verone/ui'`

| Categorie   | Composants                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------- |
| Boutons     | `Button`, `ButtonV2`, `IconButton`                                                           |
| Formulaires | `Input`, `Textarea`, `Label`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Combobox`       |
| Layout      | `Card`, `Separator`, `Accordion`, `Tabs`, `TabsNavigation`, `Sidebar`, `ScrollArea`, `Table` |
| Feedback    | `Alert`, `AlertDialog`, `ConfirmDialog`, `Skeleton`, `Badge`, `DataStatusBadge`, `Progress`  |
| Overlays    | `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tooltip`                                      |
| Adresse     | `AddressAutocomplete`, `CountrySelect`                                                       |
| Upload      | `ImageUploadZone`                                                                            |
| KPI         | `KPICardUnified`                                                                             |

### @verone/common — Hooks et Composants Partages

| Hook                                       | Usage               |
| ------------------------------------------ | ------------------- |
| `useSupabaseQuery` / `useSupabaseMutation` | Queries DB          |
| `useCurrentUser` / `useCurrentUserId`      | Auth user           |
| `useImageUpload` / `useLogoUpload`         | Upload images       |
| `useInlineEdit`                            | Edition inline      |
| `useToast`                                 | Notifications toast |
| `useDebounce`                              | Debounce values     |

**Composants** : `AddressEditSection`, `CollectionsDisplay`, `PricingComponents`

### @verone/organisations — Gestion Organisations (32 composants)

| Composant     | Usage                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Sections (12) | Detail org (LegalIdentity, Contact, Address, Commercial, Performance) |
| Forms (8)     | Creation/edition org                                                  |
| Modals (9)    | Dialogs org                                                           |
| Cards (6)     | Stats, Logo, KPI                                                      |

| Hook                       | Usage              |
| -------------------------- | ------------------ |
| `useOrganisations`         | Liste/gestion orgs |
| `useContacts`              | Contacts par org   |
| `useEnseignes`             | Gestion enseignes  |
| `useEnseigneStats`         | Stats enseignes    |
| `useOrganisationTabCounts` | Counts onglets     |

### @verone/orders — Commandes (60 composants)

| Hook                                   | Usage                 |
| -------------------------------------- | --------------------- |
| `useSalesOrders` / `usePurchaseOrders` | Commandes vente/achat |
| `useOrderItems`                        | Lignes commande       |
| `useSalesShipments`                    | Expeditions           |
| `useSalesDashboard` / `useMonthlyKPIs` | Analytics             |
| `useLinkMeOrders`                      | Commandes LinkMe      |
| `useLinkMeEnseignes`                   | Enseignes LinkMe      |

### @verone/products — Produits (69 composants)

| Hook                                      | Usage          |
| ----------------------------------------- | -------------- |
| `useProducts` / `useArchivedProducts`     | Catalogue      |
| `useVariantGroups` / `useProductVariants` | Variantes      |
| `useProductImages`                        | Images produit |
| `useProductProfitability`                 | Rentabilite    |
| `useSourcingProducts`                     | Sourcing       |

**Composants** : `ProductThumbnail`, `ProductCard`, `ProductGrid`, `SourcingWizard`

### @verone/finance — Finance (61 composants, 25 hooks)

| Hook                    | Usage                  |
| ----------------------- | ---------------------- |
| `useFinancialDocuments` | Factures/avoirs        |
| `useBankReconciliation` | Rapprochement bancaire |
| `useQuotes`             | Devis (Qonto)          |
| `usePcgCategories`      | Plan comptable         |
| `useExpenses`           | Depenses               |

### @verone/stock — Stock (23 composants)

| Hook                        | Usage           |
| --------------------------- | --------------- |
| `useStock` / `useStockCore` | Donnees stock   |
| `useStockAlerts`            | Alertes stock   |
| `useStockMovements`         | Mouvements      |
| `useStockAnalytics`         | Analytics stock |

### @verone/notifications — Notifications (9 hooks count)

Hooks `use[Domain]Count` pour badges sidebar : Stock, Consultations, LinkMe, Products, Orders, Expeditions, Transactions, Approvals, FormSubmissions.

## Packages Utilitaires

| Package         | Usage                                                                | Imports      |
| --------------- | -------------------------------------------------------------------- | ------------ |
| `@verone/utils` | Formatage, Supabase client, validation, export CSV                   | 114 fichiers |
| `@verone/types` | Types DB generes + types metier                                      | 68 fichiers  |
| `@verone/hooks` | Hooks React generiques (useDebounce, useMediaQuery, useLocalStorage) | 12 fichiers  |

## Packages Peu Utilises

| Package                | Imports    | Note                                        |
| ---------------------- | ---------- | ------------------------------------------- |
| `@verone/logistics`    | 0          | Potentiellement mort                        |
| `@verone/integrations` | 0 (direct) | Utilise en interne (Qonto, Google Merchant) |
| `@verone/collections`  | 2          | Quasi-mort                                  |

## Regle d'Or

**AVANT de creer un nouveau composant/hook**, verifier :

1. Existe-t-il dans `@verone/ui` ? (62 composants)
2. Existe-t-il dans le package domaine (`@verone/orders`, `@verone/products`, etc.) ?
3. Existe-t-il un hook similaire dans `@verone/common` ?
4. Si non → creer dans le package domaine correspondant, PAS dans l'app
