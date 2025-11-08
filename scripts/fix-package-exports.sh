#!/bin/bash

# Script pour ajouter la propriété "exports" à tous les package.json des packages @verone
# Nécessaire pour que TypeScript resolve correctement les imports inter-packages

set -e

echo "🔧 Ajout propriété 'exports' dans tous les package.json..."
echo ""

# Trouver tous les package.json dans packages/@verone
find packages/@verone -name "package.json" -not -path "*/node_modules/*" | while read -r pkg_file; do
  pkg_dir=$(dirname "$pkg_file")
  pkg_name=$(basename "$pkg_dir")

  echo "📝 Mise à jour $pkg_name/package.json..."

  # Utiliser Node.js pour manipuler le JSON proprement
  node -e "
    const fs = require('fs');
    const path = '$pkg_file';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf-8'));

    // Ajouter exports si absent
    if (!pkg.exports) {
      pkg.exports = {
        '.': {
          'types': './src/index.ts',
          'import': './src/index.ts',
          'require': './src/index.ts'
        },
        './hooks': {
          'types': './src/hooks/index.ts',
          'import': './src/hooks/index.ts',
          'require': './src/hooks/index.ts'
        },
        './components/*': {
          'types': './src/components/*/index.ts',
          'import': './src/components/*/index.ts',
          'require': './src/components/*/index.ts'
        }
      };
    }

    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  "

  echo "✅ $pkg_name mis à jour"
done

echo ""
echo "🎉 Tous les package.json mis à jour !"
echo ""
echo "🔍 Vérification TypeScript..."
npm run type-check 2>&1 | grep "error TS" | wc -l || echo "0"
