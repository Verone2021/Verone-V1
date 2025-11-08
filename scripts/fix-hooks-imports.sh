#!/bin/bash

# Script BATCH pour corriger les imports de hooks
# Remplace imports depuis @verone/common/hooks vers packages spécialisés

set -e

echo "🔧 Correction BATCH des imports hooks..."
echo ""

# Patterns de remplacement :
# useFamilies, useCategories, useSubcategories → @verone/categories/hooks
# useProducts, useProductImages → @verone/products/hooks
# useOrganisations → @verone/organisations/hooks
# useConsultations, useConsultationImages → @verone/consultations/hooks
# useCollections, useCollection → @verone/collections/hooks
# Et ainsi de suite...

find packages/@verone -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do

  # Categories hooks
  sed -i '' \
    -e "s|from '@verone/common/hooks';\$|from '@verone/categories/hooks';|g" \
    "$file" 2>/dev/null || true

  # Corriger ligne par ligne les imports groupés (plus complexe)
  # On va devoir faire ça autrement car sed ne gère pas bien le multiline

done

echo "✅ Corrections sed appliquées"
echo ""

# Pour les imports plus complexes, utilisons un script Node.js
cat > /tmp/fix-imports.mjs << 'NODESCRIPT'
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const HOOK_TO_PACKAGE = {
  // Categories
  'useFamilies': '@verone/categories/hooks',
  'useCategories': '@verone/categories/hooks',
  'useSubcategories': '@verone/categories/hooks',

  // Products
  'useProducts': '@verone/products/hooks',
  'useProductImages': '@verone/products/hooks',

  // Organisations
  'useOrganisations': '@verone/organisations/hooks',

  // Consultations
  'useConsultations': '@verone/consultations/hooks',
  'useConsultationImages': '@verone/consultations/hooks',
  'useConsultationItems': '@verone/consultations/hooks',

  // Collections
  'useCollections': '@verone/collections/hooks',
  'useCollection': '@verone/collections/hooks',

  // Finance
  'ABC_CLASSES': '@verone/finance/hooks',
  'AGING_BUCKETS': '@verone/finance/hooks',

  // Orders
  'useOrders': '@verone/orders/hooks',
  'usePurchaseOrders': '@verone/orders/hooks',
  'useSalesOrders': '@verone/orders/hooks',

  // Stock
  'useStockMovements': '@verone/stock/hooks',
  'useStockMetrics': '@verone/stock/hooks',

  // Dashboard
  'useDashboardMetrics': '@verone/dashboard/hooks',

  // Notifications
  'useNotifications': '@verone/notifications/hooks',

  // Customers
  'useCustomers': '@verone/customers/hooks',

  // Suppliers
  'useSuppliers': '@verone/suppliers/hooks',

  // Channels
  'useGoogleMerchantConfig': '@verone/channels/hooks',
  'useGoogleMerchantProducts': '@verone/channels/hooks',
};

const files = glob.sync('packages/@verone/**/*.{ts,tsx}', { ignore: '**/node_modules/**' });

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let modified = false;

  // Détecter imports depuis @verone/common/hooks
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@verone\/common\/hooks['"]/g;

  content = content.replace(importRegex, (match, imports) => {
    const importList = imports.split(',').map(i => i.trim().split(' as ')[0].trim());

    // Grouper par package destination
    const byPackage = {};

    importList.forEach(imp => {
      const targetPkg = HOOK_TO_PACKAGE[imp];

      if (targetPkg) {
        if (!byPackage[targetPkg]) byPackage[targetPkg] = [];
        byPackage[targetPkg].push(imp);
        modified = true;
      } else {
        // Garder dans @verone/common/hooks (hooks locaux)
        if (!byPackage['@verone/common/hooks']) byPackage['@verone/common/hooks'] = [];
        byPackage['@verone/common/hooks'].push(imp);
      }
    });

    // Générer nouveaux imports
    return Object.entries(byPackage)
      .map(([pkg, hooks]) => `import { ${hooks.join(', ')} } from '${pkg}'`)
      .join(';\n');
  });

  if (modified) {
    fs.writeFileSync(file, content);
    fixedCount++;
  }
});

console.log(`✅ ${fixedCount} fichiers corrigés`);
NODESCRIPT

echo "🔄 Exécution script Node.js pour corrections intelligentes..."
node /tmp/fix-imports.mjs

echo ""
echo "🎉 Corrections terminées !"
echo ""
echo "🧪 Vérification TypeScript..."
npm run type-check 2>&1 | grep "error TS" | wc -l || echo "0"
