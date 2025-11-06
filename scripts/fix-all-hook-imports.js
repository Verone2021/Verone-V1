#!/usr/bin/env node

/**
 * Script universel de correction de TOUS les imports de hooks
 * Gère à la fois @/hooks/ et les imports relatifs (../../hooks/, ../../../hooks/, etc.)
 */

const fs = require('fs');
const path = require('path');

// Mapping complet hooks → modules
const HOOK_TO_MODULE = {
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
  'use-abc-analysis': 'finance',
  'use-aging-report': 'finance',
  'use-bank-reconciliation': 'finance',
  'use-financial-documents': 'finance',
  'use-financial-payments': 'finance',
  'use-pricing': 'finance',
  'use-price-lists': 'finance',
  'use-treasury-stats': 'finance',
  'use-complete-dashboard-metrics': 'dashboard',
  'use-real-dashboard-metrics': 'dashboard',
  'use-dashboard-analytics': 'dashboard',
  'use-dashboard-notifications': 'dashboard',
  'use-recent-activity': 'dashboard',
  'use-customer-samples': 'customers',
  'use-customers': 'customers',
  'use-contacts': 'organisations',
  'use-organisation-tab-counts': 'organisations',
  'use-organisations': 'organisations',
  'use-suppliers': 'organisations',
  'use-categories': 'categories',
  'use-subcategories': 'categories',
  'use-families': 'categories',
  'use-catalogue': 'categories',
  'use-collection-images': 'collections',
  'use-collection-products': 'collections',
  'use-collections': 'collections',
  'use-consultation-images': 'consultations',
  'use-consultations': 'consultations',
  'use-google-merchant-config': 'channels',
  'use-google-merchant-products': 'channels',
  'use-google-merchant-sync': 'channels',
  'use-notifications': 'notifications',
  'use-user-activity-tracker': 'notifications',
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
  'use-automation-triggers': 'admin',
  'use-mcp-resolution': 'admin',
  'use-critical-testing': 'testing',
  'use-error-reporting': 'testing',
  'use-test-persistence': 'testing',
};

function findAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        findAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = [];

  Object.entries(HOOK_TO_MODULE).forEach(([hookName, moduleName]) => {
    // Pattern 1 : @/hooks/use-*
    const absolutePattern = new RegExp(
      `from ['"]@/hooks/${hookName}['"]`,
      'g'
    );

    // Pattern 2 : .../hooks/use-* (imports relatifs avec n'importe quel niveau)
    const relativePattern = new RegExp(
      `from ['"](\\.\\.\\/)+(hooks\\/)?${hookName}['"]`,
      'g'
    );

    const newImport = `from '@/shared/modules/${moduleName}/hooks'`;

    if (absolutePattern.test(content)) {
      content = content.replace(absolutePattern, newImport);
      modified = true;
      changes.push(`  ${hookName} → ${moduleName} (absolute)`);
    }

    if (relativePattern.test(content)) {
      content = content.replace(relativePattern, newImport);
      modified = true;
      changes.push(`  ${hookName} → ${moduleName} (relative)`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
    changes.forEach((change) => console.log(change));
    return 1;
  }

  return 0;
}

function main() {
  console.log('🚀 Correction UNIVERSELLE imports hooks\n');

  const srcDir = path.join(__dirname, '..', 'src');
  const files = findAllFiles(srcDir);

  console.log(`📂 ${files.length} fichiers TypeScript trouvés\n`);

  let filesModified = 0;
  files.forEach((file) => {
    filesModified += fixImportsInFile(file);
  });

  console.log(`\n✅ ${filesModified} fichiers modifiés`);
}

main();
