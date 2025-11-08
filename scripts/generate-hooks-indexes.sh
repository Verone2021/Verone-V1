#!/bin/bash

# Script pour générer automatiquement les index.ts des hooks dans tous les packages @verone

set -e

echo "🔧 Génération automatique des index.ts pour hooks..."
echo ""

# Packages avec hooks
PACKAGES=(
  "admin"
  "categories"
  "channels"
  "collections"
  "consultations"
  "customers"
  "dashboard"
  "finance"
  "notifications"
  "orders"
  "organisations"
  "products"
  "stock"
  "testing"
  "ui-business"
)

for pkg in "${PACKAGES[@]}"; do
  HOOKS_DIR="packages/@verone/$pkg/src/hooks"
  INDEX_FILE="$HOOKS_DIR/index.ts"

  if [ ! -d "$HOOKS_DIR" ]; then
    echo "⏭️  Skip $pkg (no hooks dir)"
    continue
  fi

  echo "📝 Génération $pkg/src/hooks/index.ts..."

  # Créer index.ts avec exports de tous les hooks
  echo "// Auto-generated hooks index for @verone/$pkg" > "$INDEX_FILE"
  echo "" >> "$INDEX_FILE"

  # Trouver tous les fichiers .ts sauf index.ts
  find "$HOOKS_DIR" -maxdepth 1 -name "*.ts" -not -name "index.ts" | while read -r hook_file; do
    # Extraire nom fichier sans extension
    hook_name=$(basename "$hook_file" .ts)

    # Export simple sans spécifier les exports nommés
    echo "export * from './$hook_name';" >> "$INDEX_FILE"
  done

  echo "✅ $pkg/src/hooks/index.ts créé"
done

echo ""
echo "🎉 Génération terminée !"
echo ""
echo "🔍 Vérification imports common/hooks..."

# Corriger common/hooks/index.ts en supprimant les re-exports cassés
COMMON_HOOKS="packages/@verone/common/src/hooks/index.ts"

cat > "$COMMON_HOOKS" << 'EOF'
// ===== LOCAL HOOKS ONLY =====
export { useBaseHook } from './use-base-hook';
export { useImageUpload, type UseImageUploadProps } from './use-image-upload';
export { useInlineEdit, type EditableSection } from './use-inline-edit';
export { useLogoUpload } from './use-logo-upload';
export { useSectionLocking } from './use-section-locking';
export { useSimpleImageUpload } from './use-simple-image-upload';
export { useSmartSuggestions } from './use-smart-suggestions';
export { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
export { useToast } from './use-toast';
export { useToggleFavorite } from './use-toggle-favorite';

// Note: Specialized hooks are now imported directly from their packages
// Example: import { useProducts } from '@verone/products/hooks';
EOF

echo "✅ common/hooks/index.ts corrigé (suppression re-exports)"
echo ""
echo "🧪 Test TypeScript..."
npm run type-check 2>&1 | head -20
