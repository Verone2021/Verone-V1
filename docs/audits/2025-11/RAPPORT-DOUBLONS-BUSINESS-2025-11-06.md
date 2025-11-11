# RAPPORT D'AUDIT - DOUBLONS BUSINESS/

**Date** : 2025-11-06
**Objectif** : Identifier fichiers `apps/back-office/src/components/business/` déjà migrés vers `src/shared/modules/`

---

## 📊 RÉSUMÉ EXÉCUTIF

- **Fichiers business/ restants** : 111 composants
- **Composants migrés** : 82 composants (11 modules)
- **Doublons confirmés** : 13 composants
- **Nouveaux fichiers** : 2 composants (address-input, notifications-dropdown)

---

## ✅ DOUBLONS CONFIRMÉS (13)

### Customers Module (11 doublons)

| Fichier business/                       | Migré vers shared/modules/                                       |
| --------------------------------------- | ---------------------------------------------------------------- |
| `client-assignment-selector.tsx`        | `customers/components/selectors/ClientAssignmentSelector.tsx`    |
| `customer-selector.tsx`                 | `customers/components/selectors/CustomerSelector.tsx`            |
| `customer-type-selector.tsx`            | `customers/components/selectors/CustomerTypeSelector.tsx`        |
| `contact-form-modal.tsx`                | `customers/components/modals/ContactFormModal.tsx`               |
| `customer-form-modal.tsx`               | `customers/components/modals/CustomerFormModal.tsx`              |
| `create-individual-customer-modal.tsx`  | `customers/components/modals/CreateIndividualCustomerModal.tsx`  |
| `create-organisation-modal.tsx`         | `customers/components/modals/CreateOrganisationModal.tsx`        |
| `confirm-delete-organisation-modal.tsx` | `customers/components/modals/ConfirmDeleteOrganisationModal.tsx` |
| `organisation-card.tsx`                 | `customers/components/cards/OrganisationCard.tsx`                |
| `organisation-logo-card.tsx`            | `customers/components/cards/OrganisationLogoCard.tsx`            |
| `organisation-logo.tsx`                 | `customers/components/cards/OrganisationLogo.tsx`                |

### Common Module (1 doublon)

| Fichier business/   | Migré vers shared/modules/                   |
| ------------------- | -------------------------------------------- |
| `address-input.tsx` | `common/components/address/AddressInput.tsx` |

### Notifications Module (1 doublon)

| Fichier business/            | Migré vers shared/modules/                                     |
| ---------------------------- | -------------------------------------------------------------- |
| `notifications-dropdown.tsx` | `notifications/components/dropdowns/NotificationsDropdown.tsx` |

---

## 📦 COMPOSANTS MIGRÉS PAR MODULE (82 total)

### Customers Module (9 composants)

- ContactDetailsEditSection
- ContactEditSection
- ContactPersonalEditSection
- ContactPreferencesEditSection
- ContactRolesEditSection
- ContactsManagementSection
- OrganisationContactsManager
- OrganisationListView
- CustomerBadge

### Categories Module (9 composants)

- CategorizeModal
- CategorySelector
- CategoryHierarchySelector
- SubcategorySearchSelector
- SupplierCategorySelect
- CategoryFilterCombobox
- CategoryHierarchyFilterV2
- CategoryHierarchyFilter
- SupplierCategoryBadge

### Common Module (14 composants)

- AddressEditSection
- AddressInput
- AddressSelector
- CarrierSelector
- CollectionCreationWizard
- CollectionEditModal
- CollectionFormModal
- CollectionGrid
- CollectionImageUpload
- GoogleMerchantPriceEditor
- PriceListFormModal
- PriceListItemFormModal
- SupplierVsPricingEditSection
- KPICard

### Consultations Module (6 composants)

- EditConsultationModal
- ConsultationPhotosModal
- ConsultationImageGallery
- ConsultationImageViewerModal
- ConsultationProductAssociation
- ConsultationSuggestions

### Products Module (8 composants)

- EditProductVariantModal
- EditSourcingProductModal
- CompletionStatusCompact
- CompletionStatusSection
- ProductStatusCompact
- WeightEditSection
- SupplierEditSection
- SampleRequirementSection

### Finance Module (5 composants)

- FinancialPaymentForm
- GenerateInvoiceButton
- ABCAnalysisView
- AgingReportView
- BFAReportModal

### Channels Module (4 composants)

- GoogleMerchantConfigModal
- GoogleMerchantMetadataEditor
- GoogleMerchantProductCard
- GoogleMerchantProductManager

### UI Module (14 composants)

- ConfirmDeleteModal
- ConfirmSubmitModal
- ErrorReportModal
- ForecastBreakdownModal
- ChannelSelector
- ColorMaterialSelector
- FilterCombobox
- DynamicColorSelector
- ImageUpload
- FavoriteToggleButton
- BugReporter
- CommandPaletteSearch
- ForecastSummaryWidget
- DraggableProductGrid

### Logistics Module (4 composants)

- ChronotruckShipmentForm
- ManualShipmentForm
- MondialRelayShipmentForm
- PacklinkShipmentForm

### Organisations Module (7 composants)

- OrganisationProductsSection
- OrganisationStatsCard
- LegalIdentityEditSection
- PerformanceEditSection
- PartnerFormModal
- SupplierFormModal
- LogoUploadButton

### Notifications Module (2 composants)

- NotificationWidget
- NotificationsDropdown

---

## 📋 COMPOSANTS BUSINESS/ À ANALYSER (98 restants)

Après suppression des 13 doublons confirmés, il reste **98 composants** à classifier :

### Orders & Shipments (19 composants)

- add-product-to-order-modal.tsx
- editable-order-item-row.tsx
- order-detail-modal.tsx
- order-header-edit-section.tsx
- order-items-table.tsx
- organisation-purchase-orders-section.tsx
- purchase-order-detail-modal.tsx
- purchase-order-form-modal.tsx
- purchase-order-reception-form.tsx
- purchase-order-reception-modal.tsx
- quick-purchase-order-modal.tsx
- sales-order-form-modal.tsx
- sales-order-shipment-form.tsx
- sales-order-shipment-modal.tsx
- shipment-recap-modal.tsx
- shipping-manager-modal.tsx
- universal-order-details-modal.tsx
- purchase-orders-chart.tsx
- revenue-chart.tsx

### Stock & Movements (14 composants)

- cancel-movement-modal.tsx
- general-stock-movement-modal.tsx
- inventory-adjustment-modal.tsx
- movement-details-modal.tsx
- movements-filters.tsx
- movements-stats.tsx
- movements-table.tsx
- quick-stock-movement-modal.tsx
- stock-alert-card.tsx
- stock-display.tsx
- stock-edit-section.tsx
- stock-movement-modal.tsx
- stock-movements-chart.tsx
- stock-reports-modal.tsx
- stock-status-badge.tsx
- stock-status-compact.tsx
- stock-status-section.tsx
- stock-view-section.tsx

### Products (41 composants)

- complete-product-wizard.tsx
- primary-image-upload.tsx
- product-card-v2.tsx
- product-card.tsx
- product-characteristics-modal.tsx
- product-consultation-manager.tsx
- product-creation-modal.tsx
- product-creation-wizard.tsx
- product-descriptions-modal.tsx
- product-detail-accordion.tsx
- product-dual-mode.tsx
- product-edit-mode.tsx
- product-fixed-characteristics.tsx
- product-history-modal.tsx
- product-image-gallery.tsx
- product-image-management.tsx
- product-image-viewer-modal.tsx
- product-images-modal.tsx
- product-info-section.tsx
- product-name-edit-section.tsx
- product-photos-modal.tsx
- product-selector.tsx
- product-status-edit-section.tsx
- product-status-selector.tsx
- product-stock-history-modal.tsx
- product-thumbnail.tsx
- product-type-selector.tsx
- product-variant-grid-card.tsx
- product-variants-grid.tsx
- product-variants-section.tsx
- product-view-mode.tsx
- products-chart.tsx
- universal-product-selector-v2.tsx
- variant-add-product-modal.tsx
- variant-creation-modal.tsx
- variant-group-create-modal.tsx
- variant-group-creation-wizard.tsx
- variant-group-edit-modal.tsx
- variant-siblings.tsx
- sourcing-product-modal.tsx
- sourcing-quick-form.tsx

### Suppliers (4 composants)

- supplier-segment-badge.tsx
- supplier-segment-select.tsx
- supplier-selector.tsx

### Consultations (1 composant)

- consultation-order-interface.tsx

### Finance (2 composants)

- payment-form.tsx
- treasury-kpis.tsx

### UI Common (6 composants)

- preferred-badge.tsx
- quick-action-modal.tsx
- relations-edit-section.tsx
- sample-order-button.tsx
- sample-order-validation.tsx
- sample-validation-simple.tsx
- smart-suggestions-panel.tsx
- unified-description-edit-section.tsx
- unified-organisation-form.tsx

### Testing (3 composants)

- test-checkbox.tsx
- test-progress-bar.tsx
- test-status-badge.tsx

### Autres (4 composants)

- quantity-breaks-display.tsx

---

## 🎯 ACTION ITEMS

### PRIORITÉ 1 : Suppression doublons (13 fichiers)

```bash
# Supprimer les 13 doublons confirmés
rm apps/back-office/src/components/business/client-assignment-selector.tsx
rm apps/back-office/src/components/business/customer-selector.tsx
rm apps/back-office/src/components/business/customer-type-selector.tsx
rm apps/back-office/src/components/business/contact-form-modal.tsx
rm apps/back-office/src/components/business/customer-form-modal.tsx
rm apps/back-office/src/components/business/create-individual-customer-modal.tsx
rm apps/back-office/src/components/business/create-organisation-modal.tsx
rm apps/back-office/src/components/business/confirm-delete-organisation-modal.tsx
rm apps/back-office/src/components/business/organisation-card.tsx
rm apps/back-office/src/components/business/organisation-logo-card.tsx
rm apps/back-office/src/components/business/organisation-logo.tsx
rm apps/back-office/src/components/business/address-input.tsx
rm apps/back-office/src/components/business/notifications-dropdown.tsx

git add -A && git commit -m "refactor(audit): Suppression 13 doublons confirmés"
```

### PRIORITÉ 2 : Migration par modules (98 composants)

- **Stock Module** : 18 composants
- **Orders Module** : 19 composants
- **Products Module** : 41 composants
- **Suppliers Module** : 4 composants
- **Consultations Module** : 1 composant
- **Finance Module** : 2 composants
- **UI Common** : 9 composants
- **Testing** : 3 composants (à supprimer ?)
- **Autres** : 1 composant

---

## 📈 PROGRESSION

- ✅ **Migrés** : 82 composants (42%)
- ✅ **Doublons détectés** : 13 composants (7%)
- ⏳ **Restants à migrer** : 98 composants (51%)
- 📦 **Total initial** : ~193 composants

---

**Prochain rapport** : Classification détaillée par module avec plan de migration
