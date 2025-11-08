#!/bin/bash

# Script SIMPLE pour corriger les imports de hooks vers leurs packages respectifs
# Utilise sed uniquement pour replacements simples ligne par ligne

set -e

echo "🔧 Correction BATCH imports hooks vers packages spécialisés..."
echo ""

# Compteur
FIXED=0

# Trouver tous les fichiers TypeScript dans packages/@verone
find packages/@verone -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do

  # Vérifier si le fichier contient des imports depuis @verone/common/hooks
  if grep -q "from '@verone/common/hooks'" "$file" 2>/dev/null; then

    # Créer fichier temporaire pour modifications
    cp "$file" "$file.tmp"

    # Remplacements spécifiques (hooks individuels sur ligne séparée)
    # Categories
    sed -i '' -e "s|import { useFamilies } from '@verone/common/hooks'|import { useFamilies } from '@verone/categories/hooks'|g" "$file.tmp"
    sed -i '' -e "s|import { useCategories } from '@verone/common/hooks'|import { useCategories } from '@verone/categories/hooks'|g" "$file.tmp"
    sed -i '' -e "s|import { useSubcategories } from '@verone/common/hooks'|import { useSubcategories } from '@verone/categories/hooks'|g" "$file.tmp"

    # Products
    sed -i '' -e "s|import { useProducts } from '@verone/common/hooks'|import { useProducts } from '@verone/products/hooks'|g" "$file.tmp"
    sed -i '' -e "s|import { useProductImages } from '@verone/common/hooks'|import { useProductImages } from '@verone/products/hooks'|g" "$file.tmp"

    # Organisations
    sed -i '' -e "s|import { useOrganisations } from '@verone/common/hooks'|import { useOrganisations } from '@verone/organisations/hooks'|g" "$file.tmp"

    # Consultations
    sed -i '' -e "s|import { useConsultations } from '@verone/common/hooks'|import { useConsultations } from '@verone/consultations/hooks'|g" "$file.tmp"
    sed -i '' -e "s|import { useConsultationImages } from '@verone/common/hooks'|import { useConsultationImages } from '@verone/consultations/hooks'|g" "$file.tmp"
    sed -i '' -e "s|import { useConsultationItems } from '@verone/common/hooks'|import { useConsultationItems } from '@verone/consultations/hooks'|g" "$file.tmp"

    # Collections
    sed -i '' -e "s|import { useCollections } from '@verone/common/hooks'|import { useCollections } from '@verone/collections/hooks'|g" "$file.tmp"
    sed -i '' -e "s|import { useCollection } from '@verone/common/hooks'|import { useCollection } from '@verone/collections/hooks'|g" "$file.tmp"

    # Appliquer si modifications
    if ! diff -q "$file" "$file.tmp" > /dev/null 2>&1; then
      mv "$file.tmp" "$file"
      FIXED=$((FIXED + 1))
    else
      rm "$file.tmp"
    fi

  fi

done

echo "✅ $FIXED fichiers modifiés"
echo ""

# Maintenant, corriger les imports MULTI-hooks sur une ligne
# Exemple: import { useFamilies, useCategories } from '@verone/common/hooks'
# → Diviser en plusieurs imports

echo "🔄 Phase 2: Division des imports multiples..."

find packages/@verone -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "from '@verone/common/hooks'" {} \; | while read -r file; do
  # Vérifier imports multi-hooks (présence de virgule)
  if grep "import {[^}]*,[^}]*} from '@verone/common/hooks'" "$file" > /dev/null 2>&1; then
    echo "⚠️  Import multiple détecté: $file"
    echo "   → Nécessite correction manuelle ou script Node.js"
  fi
done

echo ""
echo "🧪 Vérification TypeScript..."
npm run type-check 2>&1 | grep -c "error TS" || echo "0"
