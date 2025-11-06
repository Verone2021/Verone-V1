#!/usr/bin/env node

/**
 * Script de migration automatique des imports de hooks
 * JOUR 4 - Migration architecture modulaire
 *
 * Remplace tous les imports depuis @/hooks/use-* vers @/shared/modules/{module}/hooks
 */

const fs = require('fs');
const path = require('path');

// Mapping complet : hook → nouveau module
const HOOK_TO_MODULE = {
  // Stock (13 hooks)
  'use-stock': 'stock',
  'use-stock-alerts': 'stock',
  'use-stock-alerts-count': 'stock',
  'use-stock-analytics': 'stock',
  'use-stock-dashboard': 'stock',
  'use-stock-inventory': 'stock',
  'use-stock-movements': 'stock',
  'use-stock-optimized': 'stock',
  'use-stock-orders-metrics': 'stock',
  'use-stock-reservations': 'stock',
  'use-stock-status': 'stock',
  'use-stock-ui': 'stock',
  'use-movements-history': 'stock',

  // Products (13 hooks)
  'use-products': 'products',
  'use-product-colors': 'products',
  'use-product-images': 'products',
  'use-product-packages': 'products',
  'use-product-primary-image': 'products',
  'use-product-status': 'products',
  'use-product-variants': 'products',
  'use-variant-groups': 'products',
  'use-variant-products': 'products',
  'use-sourcing-products': 'products',
  'use-archived-products': 'products',
  'use-completion-status': 'products',
  'use-top-products': 'products',

  // Orders (12 hooks)
  'use-draft-purchase-order': 'orders',
  'use-order-items': 'orders',
  'use-orders-status': 'orders',
  'use-purchase-orders': 'orders',
  'use-purchase-receptions': 'orders',
  'use-sales-dashboard': 'orders',
  'use-sales-orders': 'orders',
  'use-sales-shipments': 'orders',
  'use-sample-eligibility-rule': 'orders',
  'use-sample-order': 'orders',
  'use-shipments': 'orders',
  'use-unified-sample-eligibility': 'orders',

  // Finance (8 hooks)
  'use-abc-analysis': 'finance',
  'use-aging-report': 'finance',
  'use-bank-reconciliation': 'finance',
  'use-financial-documents': 'finance',
  'use-financial-payments': 'finance',
  'use-pricing': 'finance',
  'use-price-lists': 'finance',
  'use-treasury-stats': 'finance',

  // Dashboard (5 hooks)
  'use-complete-dashboard-metrics': 'dashboard',
  'use-real-dashboard-metrics': 'dashboard',
  'use-dashboard-analytics': 'dashboard',
  'use-dashboard-notifications': 'dashboard',
  'use-recent-activity': 'dashboard',

  // Customers (2 hooks)
  'use-customer-samples': 'customers',
  'use-customers': 'customers',

  // Organisations (4 hooks)
  'use-contacts': 'organisations',
  'use-organisation-tab-counts': 'organisations',
  'use-organisations': 'organisations',
  'use-suppliers': 'organisations',

  // Categories (4 hooks)
  'use-categories': 'categories',
  'use-subcategories': 'categories',
  'use-families': 'categories',
  'use-catalogue': 'categories',

  // Collections (3 hooks)
  'use-collection-images': 'collections',
  'use-collection-products': 'collections',
  'use-collections': 'collections',

  // Consultations (2 hooks)
  'use-consultation-images': 'consultations',
  'use-consultations': 'consultations',

  // Channels (3 hooks)
  'use-google-merchant-config': 'channels',
  'use-google-merchant-products': 'channels',
  'use-google-merchant-sync': 'channels',

  // Notifications (2 hooks)
  'use-notifications': 'notifications',
  'use-user-activity-tracker': 'notifications',

  // Common (10 hooks)
  'use-base-hook': 'common',
  'use-image-upload': 'common',
  'use-inline-edit': 'common',
  'use-logo-upload': 'common',
  'use-section-locking': 'common',
  'use-simple-image-upload': 'common',
  'use-smart-suggestions': 'common',
  'use-supabase-query': 'common',
  'use-toast': 'common',
  'use-toggle-favorite': 'common',

  // Admin (2 hooks)
  'use-automation-triggers': 'admin',
  'use-mcp-resolution': 'admin',

  // Testing (3 hooks)
  'use-critical-testing': 'testing',
  'use-error-reporting': 'testing',
  'use-test-persistence': 'testing',
};

/**
 * Trouve tous les fichiers TypeScript/TSX récursivement
 */
function findAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorer node_modules, .next, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        findAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Migre les imports dans un fichier
 */
function migrateImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = [];

  // Pour chaque hook, chercher et remplacer l'import
  Object.entries(HOOK_TO_MODULE).forEach(([hookName, moduleName]) => {
    const oldImportPattern = new RegExp(
      `from ['"]@/hooks/${hookName}['"]`,
      'g'
    );
    const newImport = `from '@/shared/modules/${moduleName}/hooks'`;

    if (oldImportPattern.test(content)) {
      content = content.replace(oldImportPattern, newImport);
      modified = true;
      changes.push(`  ${hookName} → ${moduleName}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath}`);
    changes.forEach((change) => console.log(change));
    return 1;
  }

  return 0;
}

/**
 * Main
 */
function main() {
  console.log('🚀 Migration des imports de hooks - JOUR 4\n');
  console.log(`📋 ${Object.keys(HOOK_TO_MODULE).length} hooks à migrer\n`);

  const srcDir = path.join(__dirname, '..', 'src');
  const files = findAllFiles(srcDir);

  console.log(`📂 ${files.length} fichiers TypeScript trouvés\n`);
  console.log('🔄 Migration en cours...\n');

  let filesModified = 0;

  files.forEach((file) => {
    filesModified += migrateImportsInFile(file);
  });

  console.log('\n✅ Migration terminée !');
  console.log(`📊 ${filesModified} fichiers modifiés`);
}

main();
