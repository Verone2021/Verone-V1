#!/bin/bash
# Script de correction automatique des références obsolètes src/ dans la documentation
# Phase 4 - Turborepo Migration Cleanup
# Date: 2025-11-11

echo "🔧 Correction références obsolètes src/ dans docs/"
echo "================================================"
echo ""

# Backup docs/
BACKUP_DIR="docs-backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Création backup: $BACKUP_DIR"
cp -r docs "$BACKUP_DIR"
echo "✅ Backup créé: $BACKUP_DIR"
echo ""

# Compter fichiers avant
TOTAL_FILES=$(find docs -name "*.md" -type f | wc -l | tr -d ' ')
echo "📊 Fichiers .md à traiter: $TOTAL_FILES"
echo ""

# Remplacement global dans tous les .md
echo "🔄 Remplacement src/ → apps/back-office/src/ ..."
echo ""

# 1. src/app/ → apps/back-office/src/app/
echo "  1/6: src/app/ → apps/back-office/src/app/"
find docs -name "*.md" -type f -exec sed -i '' 's|`src/app/|`apps/back-office/src/app/|g' {} \;
find docs -name "*.md" -type f -exec sed -i '' 's|src/app/|apps/back-office/src/app/|g' {} \;

# 2. src/components/ → apps/back-office/src/components/
echo "  2/6: src/components/ → apps/back-office/src/components/"
find docs -name "*.md" -type f -exec sed -i '' 's|`src/components/|`apps/back-office/src/components/|g' {} \;
find docs -name "*.md" -type f -exec sed -i '' 's|src/components/|apps/back-office/src/components/|g' {} \;

# 3. src/hooks/ → apps/back-office/src/hooks/
echo "  3/6: src/hooks/ → apps/back-office/src/hooks/"
find docs -name "*.md" -type f -exec sed -i '' 's|`src/hooks/|`apps/back-office/src/hooks/|g' {} \;
find docs -name "*.md" -type f -exec sed -i '' 's|src/hooks/|apps/back-office/src/hooks/|g' {} \;

# 4. src/lib/ → apps/back-office/src/lib/
echo "  4/6: src/lib/ → apps/back-office/src/lib/"
find docs -name "*.md" -type f -exec sed -i '' 's|`src/lib/|`apps/back-office/src/lib/|g' {} \;
find docs -name "*.md" -type f -exec sed -i '' 's|src/lib/|apps/back-office/src/lib/|g' {} \;

# 5. src/types/ → apps/back-office/src/types/
echo "  5/6: src/types/ → apps/back-office/src/types/"
find docs -name "*.md" -type f -exec sed -i '' 's|`src/types/|`apps/back-office/src/types/|g' {} \;
find docs -name "*.md" -type f -exec sed -i '' 's|src/types/|apps/back-office/src/types/|g' {} \;

# 6. src/styles/ → apps/back-office/src/styles/
echo "  6/6: src/styles/ → apps/back-office/src/styles/"
find docs -name "*.md" -type f -exec sed -i '' 's|`src/styles/|`apps/back-office/src/styles/|g' {} \;
find docs -name "*.md" -type f -exec sed -i '' 's|src/styles/|apps/back-office/src/styles/|g' {} \;

echo ""
echo "✅ Remplacement terminé"
echo ""

# Validation: compter références obsolètes restantes
echo "🔍 Validation: Recherche références obsolètes restantes..."
OBSOLETE_COUNT=$(grep -r "src/app\|src/components\|src/hooks\|src/lib\|src/types\|src/styles" docs --include="*.md" | \
  grep -v "apps/back-office/src" | \
  grep -v "apps/site-internet/src" | \
  grep -v "apps/linkme/src" | \
  wc -l | tr -d ' ')

echo "📊 Références obsolètes restantes: $OBSOLETE_COUNT"
echo ""

if [ "$OBSOLETE_COUNT" -eq 0 ]; then
  echo "✅ ✅ ✅ SUCCESS: Aucune référence obsolète détectée!"
  echo "📁 Backup disponible: $BACKUP_DIR"
  echo ""
  echo "🎯 Prochaines étapes:"
  echo "  1. Vérifier git diff docs/ pour valider modifications"
  echo "  2. Si OK → git add docs/"
  echo "  3. Si problème → rm -rf docs && mv $BACKUP_DIR docs"
else
  echo "⚠️  WARNING: $OBSOLETE_COUNT références obsolètes restantes"
  echo "   Vérification manuelle requise"
  echo ""
  echo "Fichiers concernés:"
  grep -r "src/app\|src/components\|src/hooks\|src/lib\|src/types\|src/styles" docs --include="*.md" | \
    grep -v "apps/back-office/src" | \
    grep -v "apps/site-internet/src" | \
    grep -v "apps/linkme/src" | \
    cut -d':' -f1 | sort -u | head -10
fi

echo ""
echo "================================================"
echo "🏁 Script terminé"
echo "================================================"
