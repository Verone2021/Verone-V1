#!/bin/bash

# Script de restauration automatique des composants manquants depuis Git

set -e

echo "🔧 Restauration composants manquants..."
echo ""

# Fonction pour restaurer un composant
restore_component() {
    local commit=$1
    local src_path=$2
    local dest_path=$3
    local component_name=$4

    echo "📦 Restauration: $component_name"

    # Créer répertoire destination
    mkdir -p "$(dirname "$dest_path")"

    # Extraire du commit
    if git show "$commit:$src_path" > "/tmp/${component_name}.tsx" 2>/dev/null; then
        lines=$(wc -l < "/tmp/${component_name}.tsx")
        cp "/tmp/${component_name}.tsx" "$dest_path"
        echo "   ✅ $lines lignes restaurées → $dest_path"
        return 0
    else
        echo "   ❌ Échec extraction depuis $commit"
        return 1
    fi
}

# Composants à restaurer
# Format: commit|src_path|dest_path|component_name

COMPONENTS=(
    # Organisations
    "c2352fe|src/components/business/customer-form-modal.tsx|src/shared/modules/customers/components/modals/CustomerFormModal.tsx|CustomerFormModal"
    "9e8043b|src/components/business/heart-badge.tsx|src/shared/modules/organisations/components/badges/HeartBadge.tsx|HeartBadge"

    # À compléter avec les autres...
)

# Restaurer tous les composants
success=0
failed=0

for component_spec in "${COMPONENTS[@]}"; do
    IFS='|' read -r commit src dest name <<< "$component_spec"

    if restore_component "$commit" "$src" "$dest" "$name"; then
        ((success++))
    else
        ((failed++))
    fi
    echo ""
done

echo "📊 Résumé:"
echo "   ✅ Réussis: $success"
echo "   ❌ Échecs: $failed"
echo ""
echo "✨ Restauration terminée !"
