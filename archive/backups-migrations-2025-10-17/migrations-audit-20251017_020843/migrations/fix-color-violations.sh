#!/bin/bash

# 🎨 Migration Couleurs Vérone - Éradication violations (150+)
# Date: 8 Octobre 2025
# Objectif: Remplacer toutes couleurs interdites (orange/yellow/amber) par noir/blanc/gris

echo "🎨 Début migration couleurs Design System Vérone..."
echo ""

# Backup avant migration
BACKUP_DIR="./backups/design-migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Création backup dans $BACKUP_DIR"
cp -R src "$BACKUP_DIR/"
echo "✅ Backup créé"
echo ""

# Compteurs
TOTAL_CHANGES=0

# Phase 1: Orange → Noir/Gris
echo "📍 Phase 1: Migration Orange → Noir/Gris"

# text-orange-600 → text-black (textes importants)
echo "  - text-orange-600 → text-black"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "text-orange-600" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/text-orange-600/text-black/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# text-orange-500 → text-gray-900
echo "  - text-orange-500 → text-gray-900"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "text-orange-500" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/text-orange-500/text-gray-900/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# text-orange-700 → text-gray-800
echo "  - text-orange-700 → text-gray-800"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "text-orange-700" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/text-orange-700/text-gray-800/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# text-orange-800 → text-gray-900
echo "  - text-orange-800 → text-gray-900"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "text-orange-800" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/text-orange-800/text-gray-900/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# bg-orange-100 → bg-gray-100
echo "  - bg-orange-100 → bg-gray-100"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "bg-orange-100" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/bg-orange-100/bg-gray-100/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# bg-orange-50 → bg-gray-50
echo "  - bg-orange-50 → bg-gray-50"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "bg-orange-50" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/bg-orange-50/bg-gray-50/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# border-orange-300 → border-gray-300
echo "  - border-orange-300 → border-gray-300"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "border-orange-300" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/border-orange-300/border-gray-300/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# border-orange-200 → border-gray-200
echo "  - border-orange-200 → border-gray-200"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "border-orange-200" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/border-orange-200/border-gray-200/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# border-orange-400 → border-gray-400
echo "  - border-orange-400 → border-gray-400"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "border-orange-400" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/border-orange-400/border-gray-400/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# border-orange-500 → border-black (alertes importantes)
echo "  - border-orange-500 → border-black"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "border-orange-500" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/border-orange-500/border-black/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# bg-orange-500 → bg-black (badges importants)
echo "  - bg-orange-500 → bg-black"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "bg-orange-500" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/bg-orange-500/bg-black/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# hover:text-orange-700 → hover:text-black
echo "  - hover:text-orange-700 → hover:text-black"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "hover:text-orange-700" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/hover:text-orange-700/hover:text-black/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# hover:bg-orange-700 → hover:bg-gray-800
echo "  - hover:bg-orange-700 → hover:bg-gray-800"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "hover:bg-orange-700" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/hover:bg-orange-700/hover:bg-gray-800/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

echo ""
echo "📍 Phase 2: Migration Yellow → Gris"

# text-yellow-600 → text-gray-700
echo "  - text-yellow-600 → text-gray-700"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "text-yellow-600" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/text-yellow-600/text-gray-700/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# text-yellow-700 → text-gray-800
echo "  - text-yellow-700 → text-gray-800"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "text-yellow-700" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/text-yellow-700/text-gray-800/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# text-yellow-800 → text-gray-900
echo "  - text-yellow-800 → text-gray-900"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "text-yellow-800" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/text-yellow-800/text-gray-900/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# text-yellow-400 → text-gray-600
echo "  - text-yellow-400 → text-gray-600"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "text-yellow-400" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/text-yellow-400/text-gray-600/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# text-yellow-500 → text-gray-700
echo "  - text-yellow-500 → text-gray-700"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "text-yellow-500" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/text-yellow-500/text-gray-700/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# bg-yellow-100 → bg-gray-100
echo "  - bg-yellow-100 → bg-gray-100"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "bg-yellow-100" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/bg-yellow-100/bg-gray-100/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# bg-yellow-50 → bg-gray-50
echo "  - bg-yellow-50 → bg-gray-50"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "bg-yellow-50" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/bg-yellow-50/bg-gray-50/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# border-yellow-500 → border-gray-500
echo "  - border-yellow-500 → border-gray-500"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "border-yellow-500" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/border-yellow-500/border-gray-500/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# border-yellow-200 → border-gray-200
echo "  - border-yellow-200 → border-gray-200"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "border-yellow-200" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/border-yellow-200/border-gray-200/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# fill-yellow-400 → fill-gray-600
echo "  - fill-yellow-400 → fill-gray-600"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "fill-yellow-400" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/fill-yellow-400/fill-gray-600/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# hover:text-yellow-400 → hover:text-gray-600
echo "  - hover:text-yellow-400 → hover:text-gray-600"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "hover:text-yellow-400" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/hover:text-yellow-400/hover:text-gray-600/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# focus:ring-yellow-500 → focus:ring-gray-500
echo "  - focus:ring-yellow-500 → focus:ring-gray-500"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "focus:ring-yellow-500" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/focus:ring-yellow-500/focus:ring-gray-500/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

echo ""
echo "📍 Phase 3: Migration Amber → Noir"

# bg-amber-500 → bg-black (notifications importantes)
echo "  - bg-amber-500 → bg-black"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "bg-amber-500" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/bg-amber-500/bg-black/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# text-amber-600 → text-white (sur fond noir)
echo "  - text-amber-600 → text-white"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "text-amber-600" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/text-amber-600/text-white/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

# bg-amber-100 → bg-gray-100
echo "  - bg-amber-100 → bg-gray-100"
COUNT=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "bg-amber-100" {} \; | wc -l)
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/bg-amber-100/bg-gray-100/g' {} \;
echo "    ✅ $COUNT fichiers modifiés"
TOTAL_CHANGES=$((TOTAL_CHANGES + COUNT))

echo ""
echo "📍 Phase 4: Fichiers Critiques Spécifiques"

# Fix session-config.ts (warnings système)
if grep -q "bg-amber-500\|text-amber-600" src/lib/auth/session-config.ts 2>/dev/null; then
  echo "  - Correction src/lib/auth/session-config.ts (système auth)"
  sed -i '' "s/'bg-amber-500'/'bg-black'/g" src/lib/auth/session-config.ts
  sed -i '' "s/text-amber-600/text-white/g" src/lib/auth/session-config.ts
  echo "    ✅ Fichier critique corrigé"
  TOTAL_CHANGES=$((TOTAL_CHANGES + 1))
fi

# Fix product-status-utils.ts
if grep -q "text-orange-600" src/lib/product-status-utils.ts 2>/dev/null; then
  echo "  - Correction src/lib/product-status-utils.ts (statuts produits)"
  sed -i '' "s/text-orange-600/text-black/g" src/lib/product-status-utils.ts
  echo "    ✅ Fichier critique corrigé"
  TOTAL_CHANGES=$((TOTAL_CHANGES + 1))
fi

echo ""
echo "✅ Migration terminée !"
echo ""
echo "📊 Résumé:"
echo "  - Total changements: ~$TOTAL_CHANGES fichiers affectés"
echo "  - Backup disponible: $BACKUP_DIR"
echo ""
echo "🔍 Vérification violations restantes:"

# Vérifier violations restantes
VIOLATIONS=$(grep -r "text-orange\|bg-orange\|border-orange\|text-yellow\|bg-yellow\|border-yellow\|text-amber\|bg-amber" src --include="*.tsx" --include="*.ts" | wc -l)

if [ "$VIOLATIONS" -eq 0 ]; then
  echo "  ✅ AUCUNE violation détectée - Migration 100% réussie !"
else
  echo "  ⚠️  $VIOLATIONS violations restantes détectées"
  echo "  Fichiers concernés:"
  grep -r "text-orange\|bg-orange\|border-orange\|text-yellow\|bg-yellow\|border-yellow\|text-amber\|bg-amber" src --include="*.tsx" --include="*.ts" -l | head -10
  echo ""
  echo "  💡 Violations probablement dans commentaires ou strings - Vérification manuelle requise"
fi

echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifier visuellement l'application (npm run dev)"
echo "  2. Tester pages critiques: Dashboard, Catalogue, Stocks"
echo "  3. Valider avec Playwright Browser (console errors)"
echo "  4. Si OK, commit: git add . && git commit -m '🎨 FIX: Éradication couleurs interdites (150+ violations)'"
echo ""
echo "🎨 Design System Vérone - Migration complétée"
