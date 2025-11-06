# CLASSIFICATION MODULES - 98 COMPOSANTS RESTANTS

**Date** : 2025-11-06
**Objectif** : Classifier les 98 composants `business/` par module cible

---

## 📊 RÉSUMÉ PAR MODULE

| Module         | Composants | Priorité | Complexité |
|----------------|-----------|----------|------------|
| **Products**   | 41        | P1       | Haute      |
| **Orders**     | 19        | P1       | Moyenne    |
| **Stock**      | 18        | P1       | Moyenne    |
| **Suppliers**  | 4         | P2       | Basse      |
| **Finance**    | 2         | P2       | Basse      |
| **Consultations** | 1      | P2       | Basse      |
| **UI Common**  | 9         | P2       | Basse      |
| **Testing**    | 3         | P3       | Basse      |
| **À déterminer** | 1       | P3       | Basse      |

**Total** : 98 composants

---

## 🎯 MODULE 1 : PRODUCTS (41 composants)

**Priorité** : P1 - CRITICAL
**Destination** : `src/shared/modules/products/components/`

### Wizards (4)
- `complete-product-wizard.tsx` → wizards/CompleteProductWizard.tsx
- `product-creation-wizard.tsx` → wizards/ProductCreationWizard.tsx
- `variant-group-creation-wizard.tsx` → wizards/VariantGroupCreationWizard.tsx
- `product-consultation-manager.tsx` → wizards/ProductConsultationManager.tsx

### Modals (10)
- `product-characteristics-modal.tsx` → modals/ProductCharacteristicsModal.tsx
- `product-creation-modal.tsx` → modals/ProductCreationModal.tsx
- `product-descriptions-modal.tsx` → modals/ProductDescriptionsModal.tsx
- `product-history-modal.tsx` → modals/ProductHistoryModal.tsx
- `product-images-modal.tsx` → modals/ProductImagesModal.tsx
- `product-photos-modal.tsx` → modals/ProductPhotosModal.tsx
- `product-stock-history-modal.tsx` → modals/ProductStockHistoryModal.tsx
- `variant-add-product-modal.tsx` → modals/VariantAddProductModal.tsx
- `variant-creation-modal.tsx` → modals/VariantCreationModal.tsx
- `variant-group-create-modal.tsx` → modals/VariantGroupCreateModal.tsx
- `variant-group-edit-modal.tsx` → modals/VariantGroupEditModal.tsx

### Sections (7)
- `product-detail-accordion.tsx` → sections/ProductDetailAccordion.tsx
- `product-dual-mode.tsx` → sections/ProductDualMode.tsx
- `product-edit-mode.tsx` → sections/ProductEditMode.tsx
- `product-info-section.tsx` → sections/ProductInfoSection.tsx
- `product-name-edit-section.tsx` → sections/ProductNameEditSection.tsx
- `product-status-edit-section.tsx` → sections/ProductStatusEditSection.tsx
- `product-view-mode.tsx` → sections/ProductViewMode.tsx

### Cards & Grids (6)
- `product-card-v2.tsx` → cards/ProductCardV2.tsx
- `product-card.tsx` → cards/ProductCard.tsx
- `product-variant-grid-card.tsx` → cards/ProductVariantGridCard.tsx
- `product-variants-grid.tsx` → grids/ProductVariantsGrid.tsx
- `product-variants-section.tsx` → sections/ProductVariantsSection.tsx
- `variant-siblings.tsx` → sections/VariantSiblings.tsx

### Selectors (3)
- `product-selector.tsx` → selectors/ProductSelector.tsx
- `product-status-selector.tsx` → selectors/ProductStatusSelector.tsx
- `product-type-selector.tsx` → selectors/ProductTypeSelector.tsx
- `universal-product-selector-v2.tsx` → selectors/UniversalProductSelectorV2.tsx

### Images & Media (6)
- `primary-image-upload.tsx` → images/PrimaryImageUpload.tsx
- `product-fixed-characteristics.tsx` → images/ProductFixedCharacteristics.tsx
- `product-image-gallery.tsx` → images/ProductImageGallery.tsx
- `product-image-management.tsx` → images/ProductImageManagement.tsx
- `product-image-viewer-modal.tsx` → images/ProductImageViewerModal.tsx
- `product-thumbnail.tsx` → images/ProductThumbnail.tsx

### Charts (1)
- `products-chart.tsx` → charts/ProductsChart.tsx

### Sourcing (2)
- `sourcing-product-modal.tsx` → sourcing/SourcingProductModal.tsx
- `sourcing-quick-form.tsx` → sourcing/SourcingQuickForm.tsx

---

## 🎯 MODULE 2 : ORDERS (19 composants)

**Priorité** : P1 - CRITICAL
**Destination** : `src/shared/modules/orders/components/`

### Modals (8)
- `add-product-to-order-modal.tsx` → modals/AddProductToOrderModal.tsx
- `order-detail-modal.tsx` → modals/OrderDetailModal.tsx
- `purchase-order-detail-modal.tsx` → modals/PurchaseOrderDetailModal.tsx
- `purchase-order-form-modal.tsx` → modals/PurchaseOrderFormModal.tsx
- `purchase-order-reception-modal.tsx` → modals/PurchaseOrderReceptionModal.tsx
- `quick-purchase-order-modal.tsx` → modals/QuickPurchaseOrderModal.tsx
- `sales-order-form-modal.tsx` → modals/SalesOrderFormModal.tsx
- `universal-order-details-modal.tsx` → modals/UniversalOrderDetailsModal.tsx

### Sections & Tables (4)
- `editable-order-item-row.tsx` → tables/EditableOrderItemRow.tsx
- `order-header-edit-section.tsx` → sections/OrderHeaderEditSection.tsx
- `order-items-table.tsx` → tables/OrderItemsTable.tsx
- `organisation-purchase-orders-section.tsx` → sections/OrganisationPurchaseOrdersSection.tsx

### Forms (4)
- `purchase-order-reception-form.tsx` → forms/PurchaseOrderReceptionForm.tsx
- `sales-order-shipment-form.tsx` → forms/SalesOrderShipmentForm.tsx
- `sales-order-shipment-modal.tsx` → modals/SalesOrderShipmentModal.tsx
- `shipment-recap-modal.tsx` → modals/ShipmentRecapModal.tsx
- `shipping-manager-modal.tsx` → modals/ShippingManagerModal.tsx

### Charts (2)
- `purchase-orders-chart.tsx` → charts/PurchaseOrdersChart.tsx
- `revenue-chart.tsx` → charts/RevenueChart.tsx

---

## 🎯 MODULE 3 : STOCK (18 composants)

**Priorité** : P1 - CRITICAL
**Destination** : `src/shared/modules/stock/components/`

### Modals (7)
- `cancel-movement-modal.tsx` → modals/CancelMovementModal.tsx
- `general-stock-movement-modal.tsx` → modals/GeneralStockMovementModal.tsx
- `inventory-adjustment-modal.tsx` → modals/InventoryAdjustmentModal.tsx
- `movement-details-modal.tsx` → modals/MovementDetailsModal.tsx
- `quick-stock-movement-modal.tsx` → modals/QuickStockMovementModal.tsx
- `stock-movement-modal.tsx` → modals/StockMovementModal.tsx
- `stock-reports-modal.tsx` → modals/StockReportsModal.tsx

### Sections (4)
- `stock-display.tsx` → sections/StockDisplay.tsx
- `stock-edit-section.tsx` → sections/StockEditSection.tsx
- `stock-status-section.tsx` → sections/StockStatusSection.tsx
- `stock-view-section.tsx` → sections/StockViewSection.tsx

### Tables & Filters (3)
- `movements-filters.tsx` → filters/MovementsFilters.tsx
- `movements-stats.tsx` → stats/MovementsStats.tsx
- `movements-table.tsx` → tables/MovementsTable.tsx

### Badges & Cards (3)
- `stock-alert-card.tsx` → cards/StockAlertCard.tsx
- `stock-status-badge.tsx` → badges/StockStatusBadge.tsx
- `stock-status-compact.tsx` → badges/StockStatusCompact.tsx

### Charts (1)
- `stock-movements-chart.tsx` → charts/StockMovementsChart.tsx

---

## 🎯 MODULE 4 : SUPPLIERS (4 composants)

**Priorité** : P2 - HIGH
**Destination** : `src/shared/modules/suppliers/components/`

### Badges & Selects (3)
- `supplier-segment-badge.tsx` → badges/SupplierSegmentBadge.tsx
- `supplier-segment-select.tsx` → selectors/SupplierSegmentSelect.tsx
- `supplier-selector.tsx` → selectors/SupplierSelector.tsx

### À déterminer (1)
- `quantity-breaks-display.tsx` → ?? (pricing ou suppliers ?)

---

## 🎯 MODULE 5 : FINANCE (2 composants)

**Priorité** : P2 - HIGH
**Destination** : `src/shared/modules/finance/components/`

### Forms (1)
- `payment-form.tsx` → forms/PaymentForm.tsx

### KPIs (1)
- `treasury-kpis.tsx` → kpis/TreasuryKPIs.tsx

---

## 🎯 MODULE 6 : CONSULTATIONS (1 composant)

**Priorité** : P2 - HIGH
**Destination** : `src/shared/modules/consultations/components/`

### Interfaces (1)
- `consultation-order-interface.tsx` → interfaces/ConsultationOrderInterface.tsx

---

## 🎯 MODULE 7 : UI COMMON (9 composants)

**Priorité** : P2 - MEDIUM
**Destination** : `src/shared/modules/ui/components/`

### Badges (1)
- `preferred-badge.tsx` → badges/PreferredBadge.tsx

### Modals & Panels (2)
- `quick-action-modal.tsx` → modals/QuickActionModal.tsx
- `smart-suggestions-panel.tsx` → panels/SmartSuggestionsPanel.tsx

### Sections & Forms (3)
- `relations-edit-section.tsx` → sections/RelationsEditSection.tsx
- `unified-description-edit-section.tsx` → sections/UnifiedDescriptionEditSection.tsx
- `unified-organisation-form.tsx` → forms/UnifiedOrganisationForm.tsx

### Sample Validation (3)
- `sample-order-button.tsx` → buttons/SampleOrderButton.tsx
- `sample-order-validation.tsx` → validation/SampleOrderValidation.tsx
- `sample-validation-simple.tsx` → validation/SampleValidationSimple.tsx

---

## 🎯 MODULE 8 : TESTING (3 composants)

**Priorité** : P3 - LOW (À SUPPRIMER ?)
**Destination** : À supprimer ou migrer vers storybook/

### Test Components
- `test-checkbox.tsx`
- `test-progress-bar.tsx`
- `test-status-badge.tsx`

**Action recommandée** : Supprimer si non utilisés, sinon migrer vers Storybook stories

---

## 📋 ROADMAP BATCHES MIGRATION

### BATCH 1 : Stock Module (18 composants) - JOUR 2
- **Durée estimée** : 2h
- **Tests** : MCP Browser + Build
- **Dépendances** : Aucune

### BATCH 2 : Orders Module Partie 1 (10 modals) - JOUR 2
- **Durée estimée** : 2h
- **Tests** : MCP Browser + Build
- **Dépendances** : Stock (pour shipping)

### BATCH 3 : Orders Module Partie 2 (9 composants) - JOUR 3
- **Durée estimée** : 1.5h
- **Tests** : MCP Browser + Build
- **Dépendances** : Batch 2

### BATCH 4 : Products Wizards & Modals (14) - JOUR 3
- **Durée estimée** : 2.5h
- **Tests** : MCP Browser + Build
- **Dépendances** : Stock, Orders

### BATCH 5 : Products Sections & Cards (13) - JOUR 4
- **Durée estimée** : 2h
- **Tests** : MCP Browser + Build
- **Dépendances** : Batch 4

### BATCH 6 : Products Selectors & Images (10) - JOUR 4
- **Durée estimée** : 1.5h
- **Tests** : MCP Browser + Build
- **Dépendances** : Batch 5

### BATCH 7 : Products Sourcing & Charts (4) - JOUR 4
- **Durée estimée** : 1h
- **Tests** : MCP Browser + Build
- **Dépendances** : Batch 6

### BATCH 8 : Suppliers + Finance + Consultations (7) - JOUR 5
- **Durée estimée** : 1.5h
- **Tests** : MCP Browser + Build
- **Dépendances** : Products

### BATCH 9 : UI Common (9) - JOUR 5
- **Durée estimée** : 1.5h
- **Tests** : MCP Browser + Build
- **Dépendances** : Toutes

### BATCH 10 : Testing (3) - JOUR 5
- **Durée estimée** : 0.5h (suppression ou Storybook)
- **Tests** : Build uniquement
- **Dépendances** : Aucune

---

## 📊 MÉTRIQUES

- **Total composants** : 98
- **Total batches** : 10
- **Durée totale estimée** : ~16h
- **Jours requis** : 4-5 jours
- **Tests par batch** : Type-check + Build + MCP Browser (0 errors)

---

## 🔄 DÉPENDANCES DÉTECTÉES

### Stock → Orders
- `orders/forms/PurchaseOrderReceptionForm` dépend de `stock/`
- `orders/modals/QuickPurchaseOrderModal` dépend de `stock/`

### Orders → Products
- `products/wizards/ProductCreationWizard` peut dépendre de `orders/`
- `products/sections/ProductVariantsSection` peut dépendre de `orders/`

### Products → Suppliers
- `suppliers/selectors/SupplierSelector` utilisé dans products/

### All → UI Common
- Tous les modules dépendent de `ui/components/` (modals, panels, etc.)

---

**Next Step** : Commencer migration BATCH 1 (Stock Module - 18 composants)
