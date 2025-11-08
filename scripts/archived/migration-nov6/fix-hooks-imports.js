#!/usr/bin/env node
/**
 * Script de réparation des imports de hooks après migration vers modules
 * Usage: node scripts/fix-hooks-imports.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DRY_RUN = process.argv.includes('--dry-run');

console.log(`🔧 Script de réparation des imports de hooks`);
console.log(
  `📍 Mode: ${DRY_RUN ? 'DRY-RUN (simulation)' : 'PRODUCTION (modifie les fichiers)'}\n`
);

// Mapping des anciens imports vers les nouveaux
const hooksMappings = {
  // Google Merchant hooks
  '@/hooks/google-merchant': '@/shared/modules/channels/hooks/google-merchant',
  '@/hooks/google-merchant/use-add-products-to-google-merchant':
    '@/shared/modules/channels/hooks/google-merchant',
  '@/hooks/google-merchant/use-google-merchant-eligible-products':
    '@/shared/modules/channels/hooks/google-merchant',
  '@/hooks/google-merchant/use-poll-google-merchant-statuses':
    '@/shared/modules/channels/hooks/google-merchant',
  '@/hooks/google-merchant/use-remove-from-google-merchant':
    '@/shared/modules/channels/hooks/google-merchant',
  '@/hooks/google-merchant/use-toggle-google-merchant-visibility':
    '@/shared/modules/channels/hooks/google-merchant',
  '@/hooks/google-merchant/use-update-google-merchant-metadata':
    '@/shared/modules/channels/hooks/google-merchant',
  '@/hooks/google-merchant/use-update-google-merchant-price':
    '@/shared/modules/channels/hooks/google-merchant',

  // Metrics hooks
  '@/hooks/metrics': '@/shared/modules/dashboard/hooks/metrics',
  '@/hooks/metrics/use-activity-metrics':
    '@/shared/modules/dashboard/hooks/metrics',
  '@/hooks/metrics/use-order-metrics':
    '@/shared/modules/dashboard/hooks/metrics',
  '@/hooks/metrics/use-product-metrics':
    '@/shared/modules/dashboard/hooks/metrics',
  '@/hooks/metrics/use-revenue-metrics':
    '@/shared/modules/dashboard/hooks/metrics',
  '@/hooks/metrics/use-stock-metrics':
    '@/shared/modules/dashboard/hooks/metrics',
  '@/hooks/metrics/use-user-metrics':
    '@/shared/modules/dashboard/hooks/metrics',
  '@/hooks/metrics/use-user-module-metrics':
    '@/shared/modules/dashboard/hooks/metrics',
  '@/hooks/metrics/use-stock-orders-metrics':
    '@/shared/modules/dashboard/hooks/metrics',

  // Standalone hooks
  '@/hooks/use-contacts': '@/shared/modules/customers/hooks',
  '@/hooks/use-organisations': '@/shared/modules/organisations/hooks',
  '@/hooks/use-product-colors': '@/shared/modules/products/hooks',
  '@/hooks/use-variant-groups': '@/shared/modules/products/hooks',
  '@/hooks/use-sales-orders': '@/shared/modules/orders/hooks',
  '@/hooks/use-sales-shipments': '@/shared/modules/orders/hooks',
  '@/hooks/use-notifications': '@/shared/modules/notifications/hooks',
  '@/hooks/use-logo-upload': '@/shared/modules/common/hooks',
  '@/hooks/use-mobile': '@/shared/modules/ui/hooks',
};

console.log(
  `✅ ${Object.keys(hooksMappings).length} mappings de hooks créés\n`
);

// Trouver tous les fichiers source avec des imports cassés
console.log('🔍 Recherche des fichiers avec imports de hooks...');

let filesWithOldHooksImports = [];
try {
  const grepResult = execSync('grep -rl "from.*@/hooks" src/', {
    encoding: 'utf-8',
  });
  filesWithOldHooksImports = grepResult
    .trim()
    .split('\n')
    .filter(f => f.length > 0);
} catch (error) {
  if (error.status !== 1) {
    throw error;
  }
}

console.log(
  `📝 ${filesWithOldHooksImports.length} fichiers avec imports de hooks\n`
);

// Remplacer les imports dans chaque fichier
console.log('🔄 Remplacement des imports...\n');

let totalReplacements = 0;
let filesModified = 0;

for (const filePath of filesWithOldHooksImports) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let fileReplacements = 0;

  // Pour chaque mapping, remplacer dans le fichier
  for (const [oldImport, newImport] of Object.entries(hooksMappings)) {
    // Échapper les caractères spéciaux pour regex
    const escapedOld = oldImport.replace(/\//g, '\\/').replace(/\-/g, '\\-');

    // Regex pour capturer l'import complet
    const regex = new RegExp(`from\\s+['"]${escapedOld}['"]`, 'g');

    if (regex.test(content)) {
      content = content.replace(regex, `from '${newImport}'`);
      fileReplacements++;
      totalReplacements++;
    }
  }

  // Écrire le fichier modifié
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

// Rapport final
console.log(`\n${'='.repeat(60)}`);
console.log(`📊 RAPPORT FINAL\n`);
console.log(`Fichiers analysés: ${filesWithOldHooksImports.length}`);
console.log(`Fichiers modifiés: ${filesModified}`);
console.log(`Imports remplacés: ${totalReplacements}\n`);

if (DRY_RUN) {
  console.log(`⚠️  Mode DRY-RUN : Aucun fichier n'a été modifié`);
  console.log(`Pour appliquer les changements, exécutez:`);
  console.log(`  node scripts/fix-hooks-imports.js\n`);
} else {
  console.log(`✅ Modifications appliquées avec succès!\n`);
}

console.log(`${'='.repeat(60)}\n`);
