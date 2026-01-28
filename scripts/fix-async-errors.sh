#!/bin/bash
# Script pour corriger automatiquement les erreurs async dans LinkMe
# Pattern 1: queryClient.invalidateQueries(...) → await queryClient.invalidateQueries(...)
# Pattern 2: onClick={asyncFunc} → onClick={() => { void asyncFunc().catch(...) }}

set -e

echo "🔧 Fixing async errors in LinkMe..."
echo "======================================"

cd "$(dirname "$0")/.."

# Compter erreurs initiales
INITIAL_ERRORS=$(pnpm --filter @verone/linkme lint 2>&1 | grep -c "error.*@typescript-eslint/no-\(floating-promises\|misused-promises\)" || echo "0")
echo "📊 Erreurs initiales : $INITIAL_ERRORS"
echo ""

# Pattern 1: Dans les hooks, chercher queryClient.invalidateQueries non await
echo "🔍 Pattern 1: queryClient.invalidateQueries non awaited..."
find apps/linkme/src -name "*.ts" -o -name "*.tsx" | while read file; do
  # Chercher les patterns queryClient.invalidateQueries sans await
  if grep -q "queryClient\.invalidateQueries(" "$file" 2>/dev/null; then
    # Afficher le fichier trouvé
    echo "  📄 $file"
  fi
done

echo ""
echo "✅ Analyse terminée"
echo ""
echo "⚠️  Ce script nécessite des modifications manuelles fichier par fichier"
echo "   car les corrections dépendent du contexte (callback async vs non-async)"
echo ""
echo "📚 Utiliser plutôt : Correction manuelle guidée avec Task agent"
