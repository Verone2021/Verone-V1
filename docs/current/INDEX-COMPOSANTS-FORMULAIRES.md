# Index Composants, Formulaires & Hooks — packages/@verone/

**Derniere mise a jour** : 2026-04-08
**22 packages** dans `packages/@verone/`

---

## Formulaires & Modals partages (par package)

### @verone/orders — Commandes

| Composant                       | Action                                                        | Props cles                                           |
| ------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `SalesOrderFormModal`           | Creation/edition commande client (wizard: manuel/LinkMe/site) | `open`, `onOpenChange`, `orderId?`, `onLinkMeClick?` |
| `PurchaseOrderFormModal`        | Creation/edition commande fournisseur                         | `open`, `onOpenChange`, `supplierId?`                |
| `PurchaseOrderDetailModal`      | Detail PO (paiements, historique)                             | `orderId`, `open`, `onOpenChange`                    |
| `UniversalOrderDetailsModal`    | Detail commande universel (SO/PO)                             | `orderId`, `type: 'sales'\|'purchase'`               |
| `OrderDetailModal`              | Detail commande client                                        | `open`, `onOpenChange`, `orderId`                    |
| `CreateLinkMeOrderModal`        | Creation commande LinkMe                                      | `open`, `onOpenChange`, `affiliateId?`               |
| `SalesOrderShipmentModal`       | Expedition commande client                                    | `open`, `onOpenChange`, `orderId`                    |
| `PurchaseOrderReceptionModal`   | Reception commande fournisseur                                | `open`, `onOpenChange`, `orderId`                    |
| `AddProductToOrderModal`        | Ajout produit a une commande                                  | `open`, `onOpenChange`, `orderId`                    |
| `SendOrderDocumentsModal`       | Envoi documents par email                                     | `open`, `onOpenChange`, `orderId`                    |
| `QuickPurchaseOrderModal`       | Creation rapide PO                                            | `open`, `onOpenChange`                               |
| `CancelRemainderModal`          | Annulation reliquat                                           | `open`, `onOpenChange`, `orderId`                    |
| `CloseOrderModal`               | Fermeture commande                                            | `open`, `onOpenChange`, `orderId`                    |
| `AffiliateReceptionModal`       | Reception cote affilie                                        | `open`, `onOpenChange`                               |
| `ShipmentWizard`                | Wizard expedition multi-etapes                                | `orderId`, `onComplete`                              |
| `SalesOrdersTable`              | Table commandes reutilisable (filtres, pagination serveur)    | `channelId?`, `onCreateClick?`, `showKPIs`           |
| `CreateIndividualCustomerModal` | Creation client particulier B2C                               | `open`, `onOpenChange`                               |

### @verone/products — Produits

| Composant                     | Action                          | Props cles                           |
| ----------------------------- | ------------------------------- | ------------------------------------ |
| `CompleteProductWizard`       | Wizard creation produit complet | `open`, `onOpenChange`               |
| `ProductCreationWizard`       | Wizard creation produit         | `open`, `onOpenChange`               |
| `ProductCharacteristicsModal` | Edition caracteristiques        | `open`, `onOpenChange`, `productId`  |
| `ProductDescriptionsModal`    | Edition descriptions            | `open`, `onOpenChange`, `productId`  |
| `ProductHistoryModal`         | Historique produit              | `open`, `onOpenChange`, `productId`  |
| `ProductImagesModal`          | Gestion images                  | `open`, `onOpenChange`, `productId`  |
| `ProductPhotosModal`          | Photos galerie                  | `open`, `onOpenChange`, `productId`  |
| `ProductStockHistoryModal`    | Historique stock produit        | `open`, `onOpenChange`, `productId`  |
| `QuickSourcingModal`          | Sourcing rapide                 | `open`, `onOpenChange`               |
| `SourcingProductModal`        | Sourcing complet                | `open`, `onOpenChange`, `productId?` |
| `VariantCreationModal`        | Creation variante               | `open`, `onOpenChange`, `productId`  |
| `VariantGroupCreateModal`     | Creation groupe variantes       | `open`, `onOpenChange`               |
| `VariantGroupEditModal`       | Edition groupe                  | `open`, `onOpenChange`, `groupId`    |
| `UniversalProductSelectorV2`  | Selecteur produit avec filtres  | `selected`, `onSelect`, `mode?`      |
| `SourcingQuickForm`           | Formulaire rapide sourcing      | page entiere                         |

### @verone/finance — Finance

| Composant                     | Action                     | Props cles                                                       |
| ----------------------------- | -------------------------- | ---------------------------------------------------------------- |
| `RapprochementModal`          | Rapprochement transaction  | `open`, `onOpenChange`, `transactionId`                          |
| `QuoteFormModal`              | Formulaire devis (scratch) | `open`, `onOpenChange`, `onSuccess?`                             |
| `QuoteCreateFromOrderModal`   | Devis depuis commande      | `order`, `open`, `onOpenChange`, `onSuccess?`, `isConsultation?` |
| `OrderSelectModal`            | Selecteur commande         | `open`, `onOpenChange`, `onSelectOrder`                          |
| `InvoiceCreateFromOrderModal` | Facture depuis commande    | `open`, `onOpenChange`, `orderId`                                |
| `InvoiceDetailModal`          | Detail facture             | `open`, `onOpenChange`, `invoiceId`                              |
| `InvoiceCreateServiceModal`   | Facture prestation         | `open`, `onOpenChange`                                           |
| `InvoiceUploadModal`          | Upload facture fournisseur | `open`, `onOpenChange`                                           |
| `CreditNoteCreateModal`       | Creation avoir             | `open`, `onOpenChange`                                           |
| `PdfPreviewModal`             | Preview PDF                | `open`, `onOpenChange`, `url`                                    |
| `PaymentRecordModal`          | Enregistrement paiement    | `open`, `onOpenChange`, `transactionId`                          |
| `TransactionDetailSheet`      | Sheet detail transaction   | `open`, `onOpenChange`, `transactionId`                          |
| `BFAReportModal`              | Rapport BFA                | `open`, `onOpenChange`                                           |

### @verone/organisations — Organisations

| Composant                        | Action                                      | Props cles                          |
| -------------------------------- | ------------------------------------------- | ----------------------------------- |
| `UnifiedOrganisationForm`        | Formulaire organisation unifie (6 sections) | `mode: 'create'\|'edit'`, `org?`    |
| `SupplierFormModal`              | Creation/edition fournisseur                | `open`, `onOpenChange`, `supplier?` |
| `PartnerFormModal`               | Creation/edition partenaire                 | `open`, `onOpenChange`, `partner?`  |
| `AssignOrganisationsModal`       | Assignation organisations                   | `open`, `onOpenChange`              |
| `ConfirmDeleteOrganisationModal` | Confirmation suppression                    | `open`, `onOpenChange`, `orgId`     |
| `OrganisationQuickViewModal`     | Vue rapide organisation                     | `open`, `onOpenChange`, `orgId`     |
| `OrganisationSelectorModal`      | Selecteur organisation                      | `open`, `onOpenChange`, `onSelect`  |
| `QuickSupplierModal`             | Creation rapide fournisseur                 | `open`, `onOpenChange`              |

### @verone/stock — Stock

| Composant                   | Action                               | Props cles                           |
| --------------------------- | ------------------------------------ | ------------------------------------ |
| `InventoryAdjustmentModal`  | Ajustement inventaire (manuel + CSV) | `open`, `onOpenChange`               |
| `MovementDetailsModal`      | Detail mouvement                     | `open`, `onOpenChange`, `movementId` |
| `CancelMovementModal`       | Annulation mouvement                 | `open`, `onOpenChange`, `movementId` |
| `GeneralStockMovementModal` | Mouvement general                    | `open`, `onOpenChange`               |
| `StockReportsModal`         | Rapports stock (ABC, aging)          | `open`, `onOpenChange`               |

### @verone/customers — Clients

| Composant           | Action                               | Props cles                          |
| ------------------- | ------------------------------------ | ----------------------------------- |
| `CustomerFormModal` | Creation/edition client (7 sections) | `open`, `onOpenChange`, `customer?` |

### @verone/consultations — Consultations

| Composant                    | Action                    |
| ---------------------------- | ------------------------- |
| `EditConsultationModal`      | Edition consultation      |
| `ConsultationPhotosModal`    | Photos consultation       |
| `SendConsultationEmailModal` | Envoi email recapitulatif |
| `ConsultationTimeline`       | Timeline etapes           |
| `ConsultationSuggestions`    | Suggestions produits      |

### @verone/categories — Categories

| Composant                   | Action                   |
| --------------------------- | ------------------------ |
| `CategorizeModal`           | Categorisation produit   |
| `CategoryHierarchySelector` | Selecteur hierarchique   |
| `SubcategorySearchSelector` | Recherche sous-categorie |

### @verone/logistics — Expedition

| Composant                  | Action                         |
| -------------------------- | ------------------------------ |
| `ChronotruckShipmentForm`  | Formulaire Chronotruck         |
| `ManualShipmentForm`       | Formulaire expedition manuelle |
| `MondialRelayShipmentForm` | Formulaire Mondial Relay       |

### @verone/channels — Canaux externes

| Composant                      | Action                 |
| ------------------------------ | ---------------------- |
| `GoogleMerchantConfigModal`    | Config Google Merchant |
| `GoogleMerchantProductManager` | Manager produits GM    |

### @verone/ui-business — Composants business transversaux

| Composant                   | Action                             |
| --------------------------- | ---------------------------------- |
| `ConfirmDeleteModal`        | Confirmation suppression generique |
| `ConfirmSubmitModal`        | Confirmation soumission generique  |
| `ErrorReportModal`          | Rapport d'erreur                   |
| `ForecastBreakdownModal`    | Detail previsionnel stock          |
| `QuickActionModal`          | Action rapide generique            |
| `SampleOrderApprovalDialog` | Approbation commande echantillon   |
| `SampleOrderValidation`     | Validation echantillon             |
| `ChannelSelector`           | Selecteur canal de vente           |
| `FilterCombobox`            | Combobox filtres generique         |

---

## Hooks principaux (par package)

### @verone/common — Transversaux

`useCurrentUser`, `useSupabaseQuery`, `useSupabaseQueryBuilder`, `useImageUpload`, `useInlineEdit`, `useToast`, `useToggleFavorite`

### @verone/hooks — Generiques React

`useMediaQuery`, `useMobile`, `useDebounce`, `useLocalStorage`, `useToggle`, `useBoolean`, `useClickOutside`, `useWindowSize`, `useHover`

### @verone/orders — Commandes

`useSalesOrders`, `useSalesOrdersFetchList`, `useSalesOrdersMutations`, `useSalesShipments`, `usePurchaseOrders`, `usePurchaseReceptions`, `useOrderItems`, `useSalesDashboard`, `useLinkmeOrders`, `usePendingOrders`, `useApproveOrder`, `useLinkmeEnseignes`, `useLinkmeSelections`

### @verone/products — Produits

`useProducts`, `useProductVariants`, `useProductImages`, `useProductProfitability`, `useCompletionStatus`, `useVariantGroups`, `useSourcingProducts`, `useTopProducts`, `useArchivedProducts`

### @verone/stock — Stock

`useStock`, `useStockMovements`, `useStockAlerts`, `useStockAlertsCount`, `useStockInventory`, `useStockAnalytics`, `useStockDashboard`, `useMovementsHistory`

### @verone/organisations — Organisations

`useOrganisations`, `useOrganisationSingle`, `useOrganisationsCRUD`, `useSuppliers`, `useContacts`, `useEnseignes`, `useEnseigneStats`

### @verone/finance — Finance

`useTransactions`, `useInvoices`, `useQuotes`, `useFinancialDocuments`, `useRapprochement*`, `usePayments`, `usePcgCategories`

### @verone/notifications — Notifications

`useNotifications`, `useDatabaseNotifications`, `useSidebarCounts`, `useAllNotificationsCount`, `useUserActivityTracker`

### @verone/dashboard — Dashboard

`useCompleteDashboardMetrics`, `useRevenueMetrics`, `useOrderMetrics`, `useStockMetrics`, `useProductMetrics`, `useRecentActivity`

### @verone/channels — Canaux

`useGoogleMerchantProducts`, `useMetaCommerceProducts`, `useGoogleMerchantSync`, `useAddProductsToGoogleMerchant`

---

## Liste des 22 packages

| Package                   | Role                                              |
| ------------------------- | ------------------------------------------------- |
| `@verone/categories`      | Categories/familles/sous-categories               |
| `@verone/channels`        | Canaux de vente (Google Merchant, Meta)           |
| `@verone/collections`     | Collections produits                              |
| `@verone/common`          | Hooks et composants transversaux                  |
| `@verone/consultations`   | Consultations clients                             |
| `@verone/customers`       | Contacts/clients CRM                              |
| `@verone/dashboard`       | Hooks metriques dashboard                         |
| `@verone/finance`         | Finance (Qonto, factures, rapprochement, TVA)     |
| `@verone/hooks`           | Hooks React generiques (shadcn)                   |
| `@verone/integrations`    | Clients API externes (server-side)                |
| `@verone/logistics`       | Formulaires expedition                            |
| `@verone/notifications`   | Notifications + compteurs sidebar                 |
| `@verone/orders`          | Commandes (SO, PO, LinkMe, expeditions)           |
| `@verone/organisations`   | Organisations/fournisseurs/enseignes              |
| `@verone/prettier-config` | Config Prettier                                   |
| `@verone/products`        | Produits (catalogue, variantes, sourcing)         |
| `@verone/roadmap`         | Auto-roadmap RICE scoring                         |
| `@verone/stock`           | Stock (mouvements, alertes, inventaire)           |
| `@verone/types`           | Types TypeScript Supabase                         |
| `@verone/ui`              | Design system shadcn/ui + custom                  |
| `@verone/ui-business`     | Composants business transversaux                  |
| `@verone/utils`           | Utilitaires (formatters, logger, Supabase client) |
