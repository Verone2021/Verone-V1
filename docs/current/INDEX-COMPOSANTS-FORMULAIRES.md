# Index Composants, Formulaires & Hooks — packages/@verone/

**Derniere mise a jour** : 2026-04-09
**22 packages** dans `packages/@verone/`

---

## REGISTRE COMPOSANTS : Source de verite unique

**REGLE** : Avant de creer un composant, CHERCHER dans cet index. Si un composant similaire existe, le REUTILISER.

| Entite       | Package source          | Composant de base               | Wrappers types disponibles                                                                               |
| ------------ | ----------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Organisation | `@verone/organisations` | `UnifiedOrganisationForm`       | `GenericOrganisationFormModal`, `CustomerOrganisationFormModal`, `SupplierFormModal`, `PartnerFormModal` |
| Produit      | `@verone/products`      | `CompleteProductWizard`         | —                                                                                                        |
| Commande SO  | `@verone/orders`        | `SalesOrderFormModal`           | —                                                                                                        |
| Commande PO  | `@verone/orders`        | `PurchaseOrderFormModal`        | —                                                                                                        |
| Client B2C   | `@verone/orders`        | `CreateIndividualCustomerModal` | —                                                                                                        |
| Finance      | `@verone/finance`       | Voir section finance            | —                                                                                                        |

**INTERDIT** : Creer un formulaire d'entite dans `apps/` ou dans un package non-source.

### 2 concepts de composants Organisation — quand utiliser lequel

**Concept 1 : GenericOrganisationFormModal** — Back-office uniquement

- Etape 1 : l'utilisateur choisit le type (Fournisseur / Client professionnel / Prestataire)
- Etape 2 : le wrapper type correspondant s'ouvre automatiquement
- Utiliser quand le TYPE N'EST PAS CONNU a l'avance (ex: page contacts-organisations generale)

**Concept 2 : Wrappers types** (SupplierFormModal, CustomerOrganisationFormModal, PartnerFormModal)

- Le formulaire s'ouvre directement avec le bon type, sans etape de selection
- Utiliser quand le TYPE EST DEJA CONNU par le contexte (ex: page fournisseurs, commandes LinkMe)
- `CustomerOrganisationFormModal` est le seul utilise dans back-office ET LinkMe
- `SupplierFormModal` et `PartnerFormModal` sont uniquement back-office

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
| `SalesOrdersTable`              | Table commandes reutilisable (filtres, pagination serveur)    | `channelId?`, `onCreateClick?`, `showKPIs`           |
| `CreateIndividualCustomerModal` | Creation client particulier B2C                               | `open`, `onOpenChange`                               |
| `CustomerSelector`              | Selecteur client dans commande                                | `onSelect`, modal state                              |

**Sections :**

- `CustomerSamplesSection` — echantillons client
- `OrderHeaderEditSection` — header commande editable
- `OrganisationPurchaseOrdersSection` — PO d'une organisation
- `OrganisationSalesOrdersSection` — SO d'une organisation

**Tables :**

- `OrderItemsTable` — lignes commande editables
- `EditableOrderItemRow` — ligne editable individuelle

**Forms :**

- `PurchaseOrderReceptionForm` — formulaire reception PO
- `SalesOrderShipmentForm` — formulaire expedition SO

### @verone/products — Produits

| Composant                     | Action                          | Props cles                          |
| ----------------------------- | ------------------------------- | ----------------------------------- |
| `CompleteProductWizard`       | Wizard creation produit complet | `open`, `onOpenChange`              |
| `ProductCreationWizard`       | Wizard creation produit         | `open`, `onOpenChange`              |
| `ProductCreationModal`        | Modal creation produit          | `open`, `onOpenChange`              |
| `ProductCharacteristicsModal` | Edition caracteristiques        | `open`, `onOpenChange`, `productId` |
| `ProductDescriptionsModal`    | Edition descriptions            | `open`, `onOpenChange`, `productId` |
| `ProductHistoryModal`         | Historique produit              | `open`, `onOpenChange`, `productId` |
| `ProductImagesModal`          | Gestion images                  | `open`, `onOpenChange`, `productId` |
| `ProductPhotosModal`          | Photos galerie                  | `open`, `onOpenChange`, `productId` |
| `ProductStockHistoryModal`    | Historique stock produit        | `open`, `onOpenChange`, `productId` |
| `QuickSourcingModal`          | Sourcing rapide                 | `open`, `onOpenChange`              |
| `CreateProductInGroupModal`   | Creer produit dans un groupe    | `open`, `onOpenChange`, `groupId`   |
| `EditProductVariantModal`     | Edition variante produit        | `open`, `onOpenChange`, `productId` |
| `VariantAddProductModal`      | Ajouter produit a variante      | `open`, `onOpenChange`              |
| `VariantCreationModal`        | Creation variante               | `open`, `onOpenChange`, `productId` |
| `VariantGroupCreateModal`     | Creation groupe variantes       | `open`, `onOpenChange`              |
| `VariantGroupEditModal`       | Edition groupe                  | `open`, `onOpenChange`, `groupId`   |
| `UniversalProductSelectorV2`  | Selecteur produit avec filtres  | `selected`, `onSelect`, `mode?`     |

**Wizards :**

- `VariantGroupCreationWizard` — wizard creation groupe variantes
- `ProductConsultationManager` — liaison produit-consultation

**Sections (detail produit) :**

- `GeneralInfoEditSection`, `IdentifiersEditSection`, `IdentifiersCompleteEditSection`
- `CharacteristicsEditSection`, `CommercialEditSection`, `SupplierEditSection`
- `ProductDescriptionsEditSection`, `ProductNameEditSection`, `ProductStatusEditSection`
- `WeightEditSection`, `SampleRequirementSection`, `ProductProfitabilitySection`
- `ProductVariantsSection`, `ProductDualMode`, `ProductEditMode`, `ProductViewMode`
- `ProductInfoSection`, `ProductDetailAccordion`, `VariantSiblings`

**Selectors :** `ProductSelector`, `ProductStatusSelector`, `ProductTypeSelector`

**Cards :** `ProductCard`, `ProductCardV2`, `ProductVariantGridCard`, `SourcingProductEditCard`

### @verone/finance — Finance

| Composant                     | Action                        | Props cles                                                                                               |
| ----------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `RapprochementModal`          | Rapprochement transaction     | `open`, `onOpenChange`, `transactionId`                                                                  |
| `RapprochementFromOrderModal` | Rapprochement depuis commande | `open`, `onOpenChange`, `orderId`                                                                        |
| `ReconcileTransactionModal`   | Reconciliation transaction    | `open`, `onOpenChange`, `transactionId`                                                                  |
| `QuoteFormModal`              | Formulaire devis (scratch)    | `open`, `onOpenChange`, `onSuccess?`                                                                     |
| `QuoteCreateFromOrderModal`   | Devis depuis commande         | `order`, `open`, `onOpenChange`, `onSuccess?`, `isConsultation?`                                         |
| `QuoteCreateServiceModal`     | Devis prestation service      | `open`, `onOpenChange`                                                                                   |
| `OrderSelectModal`            | Selecteur commande            | `open`, `onOpenChange`, `onSelectOrder`                                                                  |
| `InvoiceCreateFromOrderModal` | Facture depuis commande       | `open`, `onOpenChange`, `orderId`                                                                        |
| `InvoiceDetailModal`          | Detail facture                | `open`, `onOpenChange`, `invoiceId`                                                                      |
| `InvoiceCreateServiceModal`   | Facture prestation            | `open`, `onOpenChange`                                                                                   |
| `InvoiceUploadModal`          | Upload facture fournisseur    | `open`, `onOpenChange`                                                                                   |
| `CreditNoteCreateModal`       | Creation avoir                | `open`, `onOpenChange`                                                                                   |
| `SendDocumentEmailModal`      | Envoi email devis/facture     | `open`, `onClose`, `documentType`, `documentId`, `documentNumber`, `clientEmail`, `clientName`, `pdfUrl` |
| `DocumentEmailHistory`        | Historique envois email       | `emails`, `loading`                                                                                      |
| `PdfPreviewModal`             | Preview PDF                   | `open`, `onOpenChange`, `url`                                                                            |
| `PdfPreviewModalDynamic`      | Preview PDF (lazy-loaded)     | `open`, `onOpenChange`, `url`                                                                            |
| `PaymentRecordModal`          | Enregistrement paiement       | `open`, `onOpenChange`, `transactionId`                                                                  |
| `TransactionDetailSheet`      | Sheet detail transaction      | `open`, `onOpenChange`, `transactionId`                                                                  |
| `TransactionDetailDialog`     | Dialog detail transaction     | `open`, `onOpenChange`, `transactionId`                                                                  |
| `QuickClassificationModal`    | Classification rapide         | `open`, `onOpenChange`                                                                                   |
| `OrganisationLinkingModal`    | Liaison org-transaction       | `open`, `onOpenChange`                                                                                   |
| `RuleModal`                   | Regles de rapprochement       | `open`, `onOpenChange`                                                                                   |
| `ApplyExistingWizard`         | Appliquer regle existante     | `open`, `onOpenChange`                                                                                   |

**Sections :** `OrganisationTransactionsSection`

**Selectors :** `HierarchicalCategorySelector`

**Treasury :** `BankAccountsCard`, `TreasuryKPICards`, `UpcomingPaymentsCard`, `TreasuryKPIs`

**Charts :** `CashFlowChart`, `ExpenseDonutChart`, `MonthlyFlowChart`

### @verone/organisations — Organisations

| Composant                        | Action                                      | Props cles                                          |
| -------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| `UnifiedOrganisationForm`        | Formulaire organisation unifie (6 sections) | `mode: 'create'\|'edit'`, `org?`                    |
| `CustomerOrganisationFormModal`  | Creation/edition client pro                 | `isOpen`, `onClose`, `organisation?`, `enseigneId?` |
| `SupplierFormModal`              | Creation/edition fournisseur                | `isOpen`, `onClose`, `supplier?`                    |
| `PartnerFormModal`               | Creation/edition partenaire                 | `isOpen`, `onClose`, `partner?`                     |
| `GenericOrganisationFormModal`   | Selection type puis formulaire              | `isOpen`, `onClose`                                 |
| `AssignOrganisationsModal`       | Assignation organisations                   | `open`, `onOpenChange`                              |
| `ConfirmDeleteOrganisationModal` | Confirmation suppression                    | `open`, `onOpenChange`, `orgId`                     |
| `OrganisationQuickViewModal`     | Vue rapide organisation                     | `open`, `onOpenChange`, `orgId`                     |
| `OrganisationSelectorModal`      | Selecteur organisation                      | `open`, `onOpenChange`, `onSelect`                  |
| `OrgBrowseModal`                 | Navigation organisations                    | `open`, `onOpenChange`                              |
| `QuickSupplierModal`             | Creation rapide fournisseur                 | `open`, `onOpenChange`                              |
| `ContactFormModalWrapper`        | Wrapper formulaire contact (avec save reel) | `isOpen`, `onClose`, `organisationId`, `onSuccess`  |
| `NewContactModal`                | Selection org puis formulaire contact       | `isOpen`, `onClose`, `onSuccess?`                   |

**Sections :**

- `EnseigneDetailHeader`, `EnseigneKPIGrid`, `EnseigneGeographySection`, `EnseigneMapSection`
- `EnseigneOrganisationsTable`, `OrganisationFamiliesSection`, `OrganisationProductsSection`
- `LegalIdentityEditSection`, `CommercialEditSection`, `PerformanceEditSection`

**Cards :** `OrganisationCard`, `OrganisationLogoCard`, `OrganisationStatsCard`

**Suppliers :** `SupplierSegmentBadge`, `SupplierSegmentSelect`, `SupplierSelector`

**Display :** `OrganisationLogo`

### @verone/stock — Stock

| Composant                   | Action                               | Props cles                           |
| --------------------------- | ------------------------------------ | ------------------------------------ |
| `InventoryAdjustmentModal`  | Ajustement inventaire (manuel + CSV) | `open`, `onOpenChange`               |
| `MovementDetailsModal`      | Detail mouvement                     | `open`, `onOpenChange`, `movementId` |
| `CancelMovementModal`       | Annulation mouvement                 | `open`, `onOpenChange`, `movementId` |
| `GeneralStockMovementModal` | Mouvement general                    | `open`, `onOpenChange`               |
| `QuickStockMovementModal`   | Mouvement rapide                     | `open`, `onOpenChange`               |
| `StockMovementModal`        | Mouvement stock complet              | `open`, `onOpenChange`               |
| `StockReportsModal`         | Rapports stock (ABC, aging)          | `open`, `onOpenChange`               |

**Sections :** `StockDisplay`, `StockEditSection`, `StockStatusSection`, `StockViewSection`

**Tables :** `MovementsTable`

**Cards :** `StockAlertCard`

### @verone/customers — Clients

| Composant           | Action                                                                               | Props cles  |
| ------------------- | ------------------------------------------------------------------------------------ | ----------- |
| `CustomerFormModal` | **DEPRECATED** → utiliser `CustomerOrganisationFormModal` de `@verone/organisations` | —           |
| `ContactFormModal`  | Formulaire contact client                                                            | modal state |

**Sections :**

- `ContactDetailsEditSection`, `ContactEditSection`, `ContactPersonalEditSection`
- `ContactPreferencesEditSection`, `ContactRolesEditSection`, `ContactsManagementSection`
- `OrganisationContactsManager`, `OrganisationListView`

### @verone/consultations — Consultations

| Composant                      | Action                    |
| ------------------------------ | ------------------------- |
| `EditConsultationModal`        | Edition consultation      |
| `ConsultationPhotosModal`      | Photos consultation       |
| `SendConsultationEmailModal`   | Envoi email recapitulatif |
| `ConsultationImageViewerModal` | Viewer image plein ecran  |
| `ConsultationTimeline`         | Timeline etapes           |
| `ConsultationImageGallery`     | Galerie images            |

### @verone/categories — Categories

| Composant                   | Action                       |
| --------------------------- | ---------------------------- |
| `CategorizeModal`           | Categorisation produit       |
| `CategoryHierarchySelector` | Selecteur hierarchique       |
| `CategorySelector`          | Selecteur categorie          |
| `SubcategorySearchSelector` | Recherche sous-categorie     |
| `SupplierCategorySelect`    | Select categorie fournisseur |
| `CategoryHierarchyFilter`   | Filtre hierarchique          |
| `CategoryHierarchyFilterV2` | Filtre hierarchique V2       |
| `CategoryTreeFilter`        | Filtre arbre                 |
| `CategoryFilterCombobox`    | Combobox filtre              |
| `SupplierCategoryBadge`     | Badge categorie fournisseur  |

### @verone/logistics — Expedition

| Composant                  | Action                         |
| -------------------------- | ------------------------------ |
| `ChronotruckShipmentForm`  | Formulaire Chronotruck         |
| `ManualShipmentForm`       | Formulaire expedition manuelle |
| `MondialRelayShipmentForm` | Formulaire Mondial Relay       |

### @verone/channels — Canaux externes

| Composant                      | Action                       |
| ------------------------------ | ---------------------------- |
| `GoogleMerchantPriceEditor`    | Editeur prix Google Merchant |
| `GoogleMerchantMetadataEditor` | Editeur metadata GM          |

### @verone/ui-business — Composants business transversaux

| Composant                       | Action                             |
| ------------------------------- | ---------------------------------- |
| `ConfirmDeleteModal`            | Confirmation suppression generique |
| `ConfirmSubmitModal`            | Confirmation soumission generique  |
| `ErrorReportModal`              | Rapport d'erreur                   |
| `ForecastBreakdownModal`        | Detail previsionnel stock          |
| `QuickActionModal`              | Action rapide generique            |
| `ChannelSelector`               | Selecteur canal de vente           |
| `ColorMaterialSelector`         | Selecteur couleur/matiere          |
| `DynamicColorSelector`          | Selecteur couleur dynamique        |
| `FilterCombobox`                | Combobox filtres generique         |
| `RelationsEditSection`          | Section edition relations          |
| `UnifiedDescriptionEditSection` | Section description unifiee        |
| `FavoriteToggleButton`          | Bouton toggle favori               |
| `SampleOrderButton`             | Bouton commande echantillon        |
| `ImageUpload`                   | Upload image                       |
| `Money`                         | Affichage montant formate          |
| `SmartSuggestionsPanel`         | Panel suggestions intelligentes    |
| `ForecastSummaryWidget`         | Widget resume previsionnel         |

### @verone/common — Composants transversaux

| Composant                      | Action                       |
| ------------------------------ | ---------------------------- |
| `CarrierSelector`              | Selecteur transporteur       |
| `GoogleMerchantPriceEditor`    | Editeur prix Google Merchant |
| `KPICard`                      | Carte KPI generique          |
| `SupplierVsPricingEditSection` | Section prix fournisseur     |

---

## Hooks par package (inventaire complet)

### @verone/common — Transversaux

| Hook                      | Role                                            |
| ------------------------- | ----------------------------------------------- |
| `useToast`                | Notifications toast globales                    |
| `useBaseHook`             | State de base (supabase, toast, loading, error) |
| `useImageUpload`          | Upload image avec progress                      |
| `useSimpleImageUpload`    | Upload image simplifie                          |
| `useLogoUpload`           | Upload logo organisation                        |
| `useSupabaseQuery`        | Query Supabase generique                        |
| `useSupabaseQueryBuilder` | Query builder Supabase                          |
| `useSmartSuggestions`     | Suggestions intelligentes                       |
| `useInlineEdit`           | Edition inline                                  |
| `useSectionLocking`       | Verrouillage section                            |

### @verone/hooks — Generiques React

`useMediaQuery`, `useMobile`, `useInterval`, `useCounter`, `useSessionStorage`, `useEventListener`, `useCopyToClipboard`, `useWindowSize`, `useLocalStorage`

### @verone/orders — Commandes

| Hook                                                                                | Role                            |
| ----------------------------------------------------------------------------------- | ------------------------------- |
| `useSalesOrders`                                                                    | Orchestrateur commandes clients |
| `useSalesOrdersFetchList`                                                           | Liste commandes clients         |
| `useSalesOrdersFetch`                                                               | Fetch commande unique           |
| `useSalesOrdersMutations`                                                           | CRUD commandes clients          |
| `useSalesOrdersMutationsWrite`                                                      | Operations ecriture SO          |
| `useSalesOrdersPayments`                                                            | Paiements SO                    |
| `useSalesOrdersStock`                                                               | Integration stock SO            |
| `useSalesShipments`                                                                 | Orchestrateur expeditions       |
| `useShipmentList`, `useShipmentDetail`, `useShipmentStats`, `useShipmentValidator`  | Sous-hooks expeditions          |
| `usePurchaseOrders`                                                                 | Commandes fournisseur           |
| `usePurchaseReceptions`, `usePurchaseReceptionsList`, `usePurchaseReceptionsDetail` | Receptions PO                   |
| `useAffiliateReceptions`                                                            | Receptions affilies             |
| `useLinkmeOrders`                                                                   | Commandes LinkMe                |
| `usePendingOrders`, `useAllLinkmeOrders`                                            | Commandes en attente            |
| `useApproveOrder`, `useRejectOrder`, `useRequestInfo`                               | Actions commandes LinkMe        |
| `useOrderItems`                                                                     | Lignes commande                 |
| `useSalesDashboard`, `useMonthlyKpis`                                               | KPI ventes                      |
| `useDraftPurchaseOrder`                                                             | Brouillon PO                    |
| `useSampleOrder`, `useSampleEligibilityRule`, `useUnifiedSampleEligibility`         | Echantillons                    |
| `useLinkmeSelections`, `useLinkmeEnseignes`, `useLinkmeAffiliates`                  | Donnees LinkMe                  |
| `useEnseigneDetails`, `useAffiliateActivity`, `useOrderHistory`                     | Details LinkMe                  |

### @verone/products — Produits

| Hook                                                                                            | Role                        |
| ----------------------------------------------------------------------------------------------- | --------------------------- |
| `useProducts`                                                                                   | Liste produits avec filtres |
| `useProductImages`                                                                              | Gestion images produit      |
| `useProductVariants`                                                                            | Variantes d'un produit      |
| `useVariantGroups`, `useVariantGroup`, `useVariantGroupProducts`                                | Groupes variantes           |
| `useVariantGroupCrud`, `useVariantGroupArchive`                                                 | CRUD groupes                |
| `useProductVariantEditing`                                                                      | Edition variante            |
| `useProductColors`, `useProductPackages`, `useProductStatus`                                    | Metadata produit            |
| `useProductPrimaryImage`                                                                        | Image principale            |
| `useArchivedProducts`                                                                           | Produits archives           |
| `useCompletionStatus`                                                                           | Statut completion           |
| `useTopProducts`                                                                                | Top produits                |
| `useProductProfitability`                                                                       | Rentabilite produit         |
| `useColorSelection`                                                                             | Selection couleur UI        |
| `useSourcingSampleOrder`, `useSourcingMutations`, `useSourcingFetch`, `useSourcingCreateUpdate` | Sourcing                    |

### @verone/stock — Stock

| Hook                                    | Role                |
| --------------------------------------- | ------------------- |
| `useStock`                              | Donnees stock       |
| `useStockCore`                          | Logique stock core  |
| `useStockMovements`                     | Mouvements stock    |
| `useStockReservations`                  | Reservations        |
| `useStockOptimized`                     | Query optimisee     |
| `useStockAlerts`, `useStockAlertsCount` | Alertes stock       |
| `useStockStatus`                        | Statut stock        |
| `useStockDashboard`                     | Dashboard stock     |
| `useStockAnalytics`                     | Analytics stock     |
| `useStockInventory`                     | Inventaire          |
| `useStockOrdersMetrics`                 | Metriques commandes |
| `useStockUI`                            | State UI stock      |

### @verone/organisations — Organisations

| Hook                       | Role                             |
| -------------------------- | -------------------------------- |
| `useOrganisations`         | Liste organisations avec filtres |
| `useOrganisation`          | Organisation unique              |
| `useContacts`              | CRUD contacts                    |
| `useSuppliers`             | Fournisseurs (deprecated)        |
| `useEnseignes`             | CRUD enseignes                   |
| `useEnseigneStats`         | Stats enseigne                   |
| `useEnseigneMapData`       | Donnees carte                    |
| `useOrganisationTabCounts` | Compteurs onglets                |
| `useOrganisationFamilies`  | Familles produits org            |

### @verone/finance — Finance

| Hook                                                                          | Role                        |
| ----------------------------------------------------------------------------- | --------------------------- |
| `useFinancialDocuments`                                                       | Documents financiers        |
| `useQuotes`                                                                   | CRUD devis                  |
| `useDocumentEmails`                                                           | Historique emails documents |
| `useExpenses`                                                                 | Depenses                    |
| `usePcgCategories`                                                            | Categories PCG              |
| `useBankReconciliation`                                                       | Rapprochement bancaire      |
| `useBankTransactionStats`                                                     | Stats transactions          |
| `useAutoClassification`                                                       | Classification auto         |
| `useMatchingRules`                                                            | Regles rapprochement        |
| `useMissingInvoices`                                                          | Factures manquantes         |
| `useLibraryDocuments`                                                         | Documents bibliotheque      |
| `useTreasuryStats`                                                            | Stats tresorerie            |
| `useUniqueLabels`                                                             | Labels uniques              |
| `useUnreconciledOrders`                                                       | Commandes non rapprochees   |
| `useOrganisationTransactions`                                                 | Transactions par org        |
| `useAbcAnalysis`                                                              | Analyse ABC                 |
| `useAgingReport`                                                              | Rapport aging               |
| `usePricing`                                                                  | Calculs tarifs              |
| `useFixedAssets`                                                              | Immobilisations             |
| `useValorisation`                                                             | Rapport valorisation        |
| `useUnifiedTransactions`, `useTransactionActions`                             | Transactions unifiees       |
| `useRapprochement`, `useRapprochementData`, `useRapprochementActions`         | Rapprochement               |
| `useRapprochementScoring`, `useRapprochementSelection`, `useRapprochementVat` | Scoring/selection/TVA       |
| `usePriceListQueries`, `usePriceListMutations`, `usePriceListItemMutations`   | Grilles tarifaires          |

### @verone/notifications — Notifications

| Hook                               | Role                         |
| ---------------------------------- | ---------------------------- |
| `useDatabaseNotifications`         | Notifications DB             |
| `useNotificationRealtime`          | Subscription realtime        |
| `useNotificationActions`           | Actions (markRead, delete)   |
| `useSidebarCounts`                 | Compteurs agregate sidebar   |
| `useUserActivityTracker`           | Tracking activite            |
| `useAllNotificationsCount`         | Total notifications          |
| `useStockAlertsCount`              | Compteur alertes stock       |
| `useProductsIncompleteCount`       | Produits incomplets          |
| `useOrdersPendingCount`            | Commandes en attente         |
| `useLinkmePendingCount`            | LinkMe en attente            |
| `useLinkmeMissingInfoCount`        | LinkMe info manquante        |
| `useLinkmeApprovalsCount`          | Approbations LinkMe          |
| `useFormSubmissionsCount`          | Soumissions formulaire       |
| `useExpeditionsPendingCount`       | Expeditions en attente       |
| `useConsultationsCount`            | Consultations                |
| `useTransactionsUnreconciledCount` | Transactions non rapprochees |

### @verone/dashboard — Dashboard

`useCompleteDashboardMetrics`, `useDashboardNotifications`, `useDashboardAnalytics`, `useRealDashboardMetrics`, `useRecentActivity`, `useProductMetrics`, `useStockMetrics`, `useRevenueMetrics`, `useOrderMetrics`, `useActivityMetrics`, `useUserModuleMetrics`, `useUserMetrics`

### @verone/channels — Canaux

`useGoogleMerchantConfig`, `useGoogleMerchantProducts`, `useGoogleMerchantSync`, `useAddProductsToGoogleMerchant`, `useRemoveFromGoogleMerchant`, `usePollGoogleMerchantStatuses`, `useToggleGoogleMerchantVisibility`, `useUpdateGoogleMerchantPrice`, `useUpdateGoogleMerchantMetadata`, `useGoogleMerchantEligibleProducts`, `useMetaCommerceProducts`, `useAddProductsToMeta`, `useRemoveFromMeta`, `useToggleMetaVisibility`

### @verone/categories — Categories

`useCategories`, `useFamilies`, `useSubcategories`, `useCatalogue`

### @verone/collections — Collections

`useCollections`, `useCollectionProducts`, `useCollectionImages`

### @verone/consultations — Consultations

`useConsultations`, `useProductConsultations`, `useConsultationHistory`, `useConsultationImages`, `useConsultationQuotes`, `useConsultationSalesOrders`

### @verone/customers — Clients

`useCustomers`, `useCustomerSamples`

### @verone/utils — Utilitaires

`useCurrentUser`

---

## ALERTE DOUBLONS — Composants dans apps/ avec equivalent @verone/

**CRITIQUE** : Ces composants dans `apps/` dupliquent des composants partages. A migrer progressivement.

### apps/back-office/ — Doublons detectes

| Composant dans apps/      | Chemin                                           | Equivalent @verone/                                    | Priorite |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------------ | -------- |
| `LinkMeOrderDetailModal`  | canaux-vente/linkme/components/                  | `@verone/orders/OrderDetailModal`                      | HAUTE    |
| `UserCreateModal`         | canaux-vente/linkme/components/                  | `@verone/organisations/ContactFormModalWrapper`        | MOYENNE  |
| `UserEditModal`           | canaux-vente/linkme/components/                  | `@verone/organisations/ContactFormModalWrapper`        | MOYENNE  |
| `MarkAsPaidModal`         | canaux-vente/linkme/demandes-paiement/           | `@verone/finance/PaymentRecordModal`                   | MOYENNE  |
| `CreateEnseigneModal`     | canaux-vente/linkme/components/EnseignesSection/ | `@verone/organisations/CustomerOrganisationFormModal`  | HAUTE    |
| `EditEnseigneModal`       | canaux-vente/linkme/components/EnseignesSection/ | `@verone/organisations/CustomerOrganisationFormModal`  | HAUTE    |
| `EnseigneCreateEditModal` | contacts-organisations/enseignes/components/     | `@verone/organisations/CustomerOrganisationFormModal`  | HAUTE    |
| `EnseigneDeleteModal`     | contacts-organisations/enseignes/                | `@verone/organisations/ConfirmDeleteOrganisationModal` | BASSE    |

### apps/linkme/ — Doublons detectes

| Composant dans apps/         | Chemin                            | Equivalent @verone/                                | Priorite |
| ---------------------------- | --------------------------------- | -------------------------------------------------- | -------- |
| `CreateOrderModal`           | (main)/commandes/components/      | `@verone/orders/SalesOrderFormModal`               | HAUTE    |
| `OrderDetailModal`           | (main)/commandes/components/      | `@verone/orders/OrderDetailModal`                  | HAUTE    |
| `OrderConfirmationDialog`    | components/orders/                | `@verone/orders` (confirmation dialogs)            | MOYENNE  |
| `RestaurantSelectorModal`    | components/orders/                | `@verone/organisations/OrganisationSelectorModal`  | MOYENNE  |
| `NewAddressForm`             | components/orders/steps/contacts/ | `@verone/ui/AddressAutocomplete`                   | BASSE    |
| `NewContactForm`             | components/orders/steps/          | `@verone/orders/NewContactForm`                    | MOYENNE  |
| `CreateEnseigneContactModal` | components/organisations/         | `@verone/organisations/ContactFormModalWrapper`    | MOYENNE  |
| `OrganisationDetailModal`    | components/organisations/         | `@verone/organisations/OrganisationQuickViewModal` | BASSE    |
| `ProductDetailSheet`         | (main)/mes-produits/components/   | `@verone/products/ProductPhotosModal`              | BASSE    |

**Note** : Certains doublons LinkMe sont intentionnels (Sheet vs Modal, UX differente pour affilies). Verifier au cas par cas avant migration.

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
