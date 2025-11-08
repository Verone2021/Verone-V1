#!/usr/bin/env node
/**
 * Script de réparation automatique des imports cassés
 * Migre @/components/business/* vers @/shared/modules/*
 *
 * Usage: node scripts/fix-broken-imports.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mode dry-run (ne modifie pas les fichiers)
const DRY_RUN = process.argv.includes('--dry-run');

console.log(`🔧 Script de réparation des imports cassés`);
console.log(
  `📍 Mode: ${DRY_RUN ? 'DRY-RUN (simulation)' : 'PRODUCTION (modifie les fichiers)'}\n`
);

// Étape 1 : Scanner tous les composants dans src/shared/modules pour créer le mapping
console.log('📂 Étape 1 : Scan des composants dans src/shared/modules...');

function scanComponents(dir, componentsMap = {}) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      scanComponents(fullPath, componentsMap);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      // Extraire le nom du composant (sans extension)
      const componentName = file.name.replace(/\.(tsx?|jsx?)$/, '');

      // Convertir le chemin absolu en chemin relatif depuis src/
      const relativePath = fullPath
        .replace(/^.*\/src\//, '@/')
        .replace(/\.(tsx?|jsx?)$/, '');

      // Ajouter au mapping (kebab-case et PascalCase)
      const kebabCase = componentName
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase();

      componentsMap[componentName] = relativePath;
      componentsMap[kebabCase] = relativePath;

      // Ajouter variantes avec majuscules (ex: ProductCardV2)
      if (componentName !== componentName.toLowerCase()) {
        componentsMap[componentName.toLowerCase()] = relativePath;
      }
    }
  }

  return componentsMap;
}

const componentsMap = scanComponents('src/shared/modules');

console.log(`✅ ${Object.keys(componentsMap).length / 2} composants trouvés\n`);

// Étape 2 : Créer le mapping des imports cassés
console.log('🗺️  Étape 2 : Création du mapping des imports...');

// Mapping manuel pour les cas spéciaux
const manualMappings = {
  // Products
  'product-card': '@/shared/modules/products/components/cards/ProductCard',
  'product-card-v2': '@/shared/modules/products/components/cards/ProductCardV2',
  'product-thumbnail':
    '@/shared/modules/products/components/images/ProductThumbnail',
  'product-image-gallery':
    '@/shared/modules/products/components/images/ProductImageGallery',
  'product-photos-modal':
    '@/shared/modules/products/components/modals/ProductPhotosModal',
  'product-characteristics-modal':
    '@/shared/modules/products/components/modals/ProductCharacteristicsModal',
  'product-descriptions-modal':
    '@/shared/modules/products/components/modals/ProductDescriptionsModal',
  'product-detail-accordion':
    '@/shared/modules/products/components/sections/ProductDetailAccordion',
  'product-info-section':
    '@/shared/modules/products/components/sections/ProductInfoSection',
  'product-variants-section':
    '@/shared/modules/products/components/sections/ProductVariantsSection',
  'product-variants-grid':
    '@/shared/modules/products/components/grids/ProductVariantsGrid',
  'product-fixed-characteristics':
    '@/shared/modules/products/components/sections/ProductFixedCharacteristics',
  'product-descriptions-edit-section':
    '@/shared/modules/products/components/sections/ProductDescriptionsEditSection',
  'complete-product-wizard':
    '@/shared/modules/products/components/wizards/CompleteProductWizard',
  'variant-group-creation-wizard':
    '@/shared/modules/products/components/wizards/VariantGroupCreationWizard',
  'variant-attributes-editor':
    '@/shared/modules/products/components/sections/VariantAttributesEditor',

  // Wizard sections
  'general-info-section':
    '@/shared/modules/products/components/wizards/sections/GeneralInfoSection',
  'supplier-section':
    '@/shared/modules/products/components/wizards/sections/SupplierSection',
  'pricing-section':
    '@/shared/modules/products/components/wizards/sections/PricingSection',
  'technical-section':
    '@/shared/modules/products/components/wizards/sections/TechnicalSection',
  'images-section':
    '@/shared/modules/products/components/wizards/sections/ImagesSection',
  'stock-section':
    '@/shared/modules/products/components/wizards/sections/StockSection',

  // Categories
  'category-hierarchy-filter-v2':
    '@/shared/modules/categories/components/filters/CategoryHierarchyFilterV2',
  'category-hierarchy-selector':
    '@/shared/modules/categories/components/selectors/CategoryHierarchySelector',
  'category-filter-combobox':
    '@/shared/modules/categories/components/filters/CategoryFilterCombobox',

  // UI Components
  'command-palette-search':
    '@/shared/modules/ui/components/utils/CommandPaletteSearch',
  'filter-combobox': '@/shared/modules/ui/components/selectors/FilterCombobox',
  'channel-selector':
    '@/shared/modules/ui/components/selectors/ChannelSelector',
  'dynamic-color-selector':
    '@/shared/modules/ui/components/selectors/DynamicColorSelector',
  dynamiccolorselector:
    '@/shared/modules/ui/components/selectors/DynamicColorSelector',
  DynamicColorSelector:
    '@/shared/modules/ui/components/selectors/DynamicColorSelector',
  'sample-validation-simple':
    '@/shared/modules/ui/components/validation/SampleValidationSimple',

  // Suppliers
  'supplier-selector':
    '@/shared/modules/suppliers/components/selectors/SupplierSelector',
  'supplier-edit-section':
    '@/shared/modules/products/components/sections/SupplierEditSection',
  'supplier-vs-pricing-edit-section':
    '@/shared/modules/products/components/sections/SupplierVsPricingEditSection',
  'supplier-segment-badge':
    '@/shared/modules/suppliers/components/badges/SupplierSegmentBadge',
  'supplier-category-badge':
    '@/shared/modules/categories/components/badges/SupplierCategoryBadge',

  // Customers
  'customer-selector':
    '@/shared/modules/customers/components/selectors/CustomerSelector',
  'customer-badge':
    '@/shared/modules/customers/components/badges/CustomerBadge',
  'customer-form-modal':
    '@/shared/modules/customers/components/modals/CustomerFormModal',

  // Stock
  'stock-display': '@/shared/modules/stock/components/displays/StockDisplay',
  'stock-status-compact':
    '@/shared/modules/stock/components/badges/StockStatusCompact',
  'stock-edit-section':
    '@/shared/modules/stock/components/sections/StockEditSection',
  'stock-movement-modal':
    '@/shared/modules/stock/components/modals/StockMovementModal',
  'general-stock-movement-modal':
    '@/shared/modules/stock/components/modals/GeneralStockMovementModal',
  'product-stock-history-modal':
    '@/shared/modules/stock/components/modals/ProductStockHistoryModal',
  'stock-reports-modal':
    '@/shared/modules/stock/components/modals/StockReportsModal',
  'inventory-adjustment-modal':
    '@/shared/modules/stock/components/modals/InventoryAdjustmentModal',
  'product-history-modal':
    '@/shared/modules/stock/components/modals/ProductHistoryModal',
  'aging-report-view':
    '@/shared/modules/stock/components/reports/AgingReportView',
  'abc-analysis-view':
    '@/shared/modules/stock/components/reports/ABCAnalysisView',
  'movements-table': '@/shared/modules/stock/components/tables/MovementsTable',
  'movements-filters':
    '@/shared/modules/stock/components/filters/MovementsFilters',
  'movements-stats':
    '@/shared/modules/stock/components/stats/MovementsStatsCards',
  'movement-details-modal':
    '@/shared/modules/stock/components/modals/MovementDetailsModal',
  'cancel-movement-modal':
    '@/shared/modules/stock/components/modals/CancelMovementModal',

  // Orders
  'order-items-table':
    '@/shared/modules/orders/components/tables/OrderItemsTable',
  'universal-order-details-modal':
    '@/shared/modules/orders/components/modals/UniversalOrderDetailsModal',
  'editable-order-item-row':
    '@/shared/modules/orders/components/tables/EditableOrderItemRow',
  'add-product-to-order-modal':
    '@/shared/modules/orders/components/modals/AddProductToOrderModal',
  'order-header-edit-section':
    '@/shared/modules/orders/components/sections/OrderHeaderEditSection',
  'sales-order-shipment-modal':
    '@/shared/modules/orders/components/modals/SalesOrderShipmentModal',
  'sales-order-shipment-form':
    '@/shared/modules/orders/components/forms/SalesOrderShipmentForm',
  'purchase-order-reception-modal':
    '@/shared/modules/orders/components/modals/PurchaseOrderReceptionModal',
  'purchase-order-reception-form':
    '@/shared/modules/orders/components/forms/PurchaseOrderReceptionForm',

  // Product Selectors
  'universal-product-selector-v2':
    '@/shared/modules/products/components/selectors/UniversalProductSelectorV2',
  'universal-product-selector':
    '@/shared/modules/products/components/selectors/UniversalProductSelector',

  // Sourcing
  'quick-sourcing-modal':
    '@/shared/modules/products/components/modals/QuickSourcingModal',
  'edit-sourcing-product-modal':
    '@/shared/modules/products/components/modals/EditSourcingProductModal',
  'sourcing-quick-form':
    '@/shared/modules/products/components/sourcing/SourcingQuickForm',
  'sample-requirement-section':
    '@/shared/modules/products/components/sections/SampleRequirementSection',

  // Identifiers & Weight
  'identifiers-complete-edit-section':
    '@/shared/modules/products/components/sections/IdentifiersCompleteEditSection',
  'weight-edit-section':
    '@/shared/modules/products/components/sections/WeightEditSection',
  'product-status-compact':
    '@/shared/modules/products/components/badges/ProductStatusCompact',
  'completion-status-compact':
    '@/shared/modules/products/components/badges/CompletionStatusCompact',

  // Collections
  'collection-grid':
    '@/shared/modules/common/components/collections/CollectionGrid',
  'collection-creation-wizard':
    '@/shared/modules/common/components/collections/CollectionCreationWizard',
  'collection-products-manager-modal':
    '@/shared/modules/common/components/collections/CollectionProductsManagerModal',
  'collection-image-upload':
    '@/shared/modules/common/components/collections/CollectionImageUpload',

  // Google Merchant
  'google-merchant-config-modal':
    '@/shared/modules/channels/components/google-merchant/GoogleMerchantConfigModal',
  'google-merchant-product-manager':
    '@/shared/modules/channels/components/google-merchant/GoogleMerchantProductManager',
  'google-merchant-product-card':
    '@/shared/modules/channels/components/google-merchant/GoogleMerchantProductCard',
  'google-merchant-price-editor':
    '@/shared/modules/channels/components/google-merchant/GoogleMerchantPriceEditor',
  'google-merchant-metadata-editor':
    '@/shared/modules/channels/components/google-merchant/GoogleMerchantMetadataEditor',

  // Organisations
  'organisation-logo':
    '@/shared/modules/organisations/components/cards/OrganisationLogo',
  'organisation-card':
    '@/shared/modules/organisations/components/cards/OrganisationCard',
  'organisation-list-view':
    '@/shared/modules/customers/components/sections/OrganisationListView',
  'contact-form-modal-wrapper':
    '@/shared/modules/organisations/components/forms/ContactFormModalWrapper',

  // Consultations
  'consultation-image-viewer-modal':
    '@/shared/modules/consultations/components/images/ConsultationImageViewerModal',
  'consultation-photos-modal':
    '@/shared/modules/consultations/components/images/ConsultationPhotosModal',

  // Finance
  'financial-payment-form':
    '@/shared/modules/finance/components/forms/FinancialPaymentForm',
  'payment-form': '@/shared/modules/finance/components/forms/PaymentForm',

  // Organisation sections
  'legal-identity-edit-section':
    '@/shared/modules/organisations/components/sections/LegalIdentityEditSection',
  'contact-edit-section':
    '@/shared/modules/customers/components/sections/ContactEditSection',
  'address-edit-section':
    '@/shared/modules/common/components/address/AddressEditSection',
  'commercial-edit-section':
    '@/shared/modules/organisations/components/sections/CommercialEditSection',
  'performance-edit-section':
    '@/shared/modules/organisations/components/sections/PerformanceEditSection',
  'contacts-management-section':
    '@/shared/modules/customers/components/sections/ContactsManagementSection',
  'organisation-logo-card':
    '@/shared/modules/organisations/components/cards/OrganisationLogoCard',
  'organisation-stats-card':
    '@/shared/modules/organisations/components/cards/OrganisationStatsCard',
  'organisation-products-section':
    '@/shared/modules/organisations/components/sections/OrganisationProductsSection',
  'organisation-purchase-orders-section':
    '@/shared/modules/organisations/components/sections/OrganisationPurchaseOrdersSection',

  // Contact sections
  'contact-personal-edit-section':
    '@/shared/modules/customers/components/sections/ContactPersonalEditSection',
  'contact-details-edit-section':
    '@/shared/modules/customers/components/sections/ContactDetailsEditSection',
  'contact-roles-edit-section':
    '@/shared/modules/customers/components/sections/ContactRolesEditSection',
  'contact-preferences-edit-section':
    '@/shared/modules/customers/components/sections/ContactPreferencesEditSection',

  // UI Badges
  'heart-badge': '@/shared/modules/ui/components/badges/HeartBadge',

  // UI Buttons
  'favorite-toggle-button':
    '@/shared/modules/ui/components/buttons/FavoriteToggleButton',

  // Modals
  'confirm-delete-organisation-modal':
    '@/shared/modules/ui/components/modals/ConfirmDeleteModal',
  'supplier-form-modal':
    '@/shared/modules/organisations/components/forms/SupplierFormModal',
  'partner-form-modal':
    '@/shared/modules/organisations/components/forms/PartnerFormModal',

  // Wizard sections (avec le prefix complet)
  'wizard-sections/general-info-section':
    '@/shared/modules/products/components/wizards/sections/GeneralInfoSection',
  'wizard-sections/supplier-section':
    '@/shared/modules/products/components/wizards/sections/SupplierSection',
  'wizard-sections/pricing-section':
    '@/shared/modules/products/components/wizards/sections/PricingSection',
  'wizard-sections/technical-section':
    '@/shared/modules/products/components/wizards/sections/TechnicalSection',
  'wizard-sections/images-section':
    '@/shared/modules/products/components/wizards/sections/ImagesSection',
  'wizard-sections/stock-section':
    '@/shared/modules/products/components/wizards/sections/StockSection',
};

console.log(
  `✅ ${Object.keys(manualMappings).length} mappings manuels créés\n`
);

// Étape 3 : Trouver tous les fichiers source avec des imports cassés
console.log('🔍 Étape 3 : Recherche des fichiers avec imports cassés...');

let filesWithBrokenImports = [];
try {
  const grepResult = execSync('grep -rl "from.*@/components/business" src/', {
    encoding: 'utf-8',
  });
  filesWithBrokenImports = grepResult
    .trim()
    .split('\n')
    .filter(f => f.length > 0);
} catch (error) {
  if (error.status !== 1) {
    // status 1 = no matches (OK)
    throw error;
  }
}

console.log(
  `📝 ${filesWithBrokenImports.length} fichiers source avec imports cassés\n`
);

// Étape 4 : Remplacer les imports dans chaque fichier
console.log('🔄 Étape 4 : Remplacement des imports...\n');

let totalReplacements = 0;
let filesModified = 0;
const replacementLog = [];

for (const filePath of filesWithBrokenImports) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let fileReplacements = 0;

  // Regex pour capturer les imports de @/components/business
  const importRegex =
    /import\s+(?:{[^}]+}|[\w]+)\s+from\s+['"]@\/components\/business\/([^'"]+)['"]/g;

  const matches = [...content.matchAll(importRegex)];

  for (const match of matches) {
    const oldImportPath = match[1]; // ex: "product-card-v2"
    const fullOldImport = match[0]; // ex: import { ProductCard } from '@/components/business/product-card-v2'

    // Chercher le nouveau chemin dans le mapping manuel
    const newImportPath = manualMappings[oldImportPath];

    if (newImportPath) {
      const newFullImport = fullOldImport.replace(
        `@/components/business/${oldImportPath}`,
        newImportPath
      );

      content = content.replace(fullOldImport, newFullImport);
      fileReplacements++;
      totalReplacements++;

      replacementLog.push({
        file: filePath,
        old: `@/components/business/${oldImportPath}`,
        new: newImportPath,
      });
    } else {
      console.warn(
        `⚠️  Mapping manquant pour: ${oldImportPath} dans ${filePath}`
      );
    }
  }

  // Écrire le fichier modifié (sauf en mode dry-run)
  if (fileReplacements > 0) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf-8');
      filesModified++;
      console.log(`✅ ${filePath}: ${fileReplacements} imports remplacés`);
    } else {
      console.log(
        `🔍 [DRY-RUN] ${filePath}: ${fileReplacements} imports à remplacer`
      );
    }
  }
}

// Étape 5 : Rapport final
console.log(`\n${'='.repeat(60)}`);
console.log(`📊 RAPPORT FINAL\n`);
console.log(`Fichiers analysés: ${filesWithBrokenImports.length}`);
console.log(`Fichiers modifiés: ${filesModified}`);
console.log(`Imports remplacés: ${totalReplacements}\n`);

if (DRY_RUN) {
  console.log(`⚠️  Mode DRY-RUN : Aucun fichier n'a été modifié`);
  console.log(`Pour appliquer les changements, exécutez:`);
  console.log(`  node scripts/fix-broken-imports.js\n`);
} else {
  console.log(`✅ Modifications appliquées avec succès!\n`);
  console.log(`Prochaines étapes:`);
  console.log(`  1. Vérifier les changements: git diff`);
  console.log(`  2. Tester la compilation: npm run type-check`);
  console.log(`  3. Tester le build: npm run build`);
  console.log(
    `  4. Commiter les changements: git add . && git commit -m "fix(imports): Migration complète @/components/business → @/shared/modules"\n`
  );
}

// Sauvegarder le log des remplacements
if (!DRY_RUN && replacementLog.length > 0) {
  const logPath = 'scripts/import-replacements-log.json';
  fs.writeFileSync(logPath, JSON.stringify(replacementLog, null, 2), 'utf-8');
  console.log(`📄 Log des remplacements sauvegardé: ${logPath}\n`);
}

console.log(`${'='.repeat(60)}\n`);
