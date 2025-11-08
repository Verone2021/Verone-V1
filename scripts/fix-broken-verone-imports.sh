#!/bin/bash

# Script de correction MASSIVE des imports @verone/* cassés par sed
# Problème : '@verone/ui'button' → '@verone/ui'
# Cause : sed a remplacé '@/components/ui/' par '@verone/ui' sans supprimer le reste

set -e

echo "🔧 Correction BATCH des imports @verone/* cassés..."
echo ""

# Compter avant correction
BEFORE=$(grep -r "from '@verone/ui'[a-z]" packages/@verone --include="*.ts" --include="*.tsx" | wc -l | xargs)
echo "📊 Imports cassés détectés : $BEFORE"
echo ""

# Pattern de correction :
# '@verone/ui'alert' → '@verone/ui'
# '@verone/ui'button' → '@verone/ui'
# etc.

echo "🚀 Application corrections..."

# Trouver tous les fichiers .ts et .tsx dans packages/@verone
find packages/@verone -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  # Appliquer sed : supprimer tout ce qui est entre '@verone/ui' et le second '
  # Pattern : from '@verone/PACKAGE'TEXTE_A_SUPPRIMER' → from '@verone/PACKAGE'

  # Correction pour tous les packages @verone
  sed -i '' \
    -e "s|from '@verone/ui'[a-z/\-]*'|from '@verone/ui'|g" \
    -e "s|from '@verone/utils'[a-z/\-]*'|from '@verone/utils'|g" \
    -e "s|from '@verone/types'[a-z/\-]*'|from '@verone/types'|g" \
    -e "s|from '@verone/kpi'[a-z/\-]*'|from '@verone/kpi'|g" \
    -e "s|from '@verone/config'[a-z/\-]*'|from '@verone/config'|g" \
    "$file"
done

echo "✅ Corrections appliquées"
echo ""

# Compter après correction
AFTER=$(grep -r "from '@verone/ui'[a-z]" packages/@verone --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs || echo "0")
echo "📊 Imports cassés restants : $AFTER"
echo ""

if [ "$AFTER" -eq "0" ]; then
  echo "🎉 SUCCÈS ! Tous les imports ont été corrigés"
else
  echo "⚠️  Il reste des imports cassés à vérifier manuellement"
fi

echo ""
echo "🔍 Vérification TypeScript en cours..."
npm run type-check 2>&1 | head -50
