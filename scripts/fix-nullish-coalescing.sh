#!/bin/bash
# Script: Corriger prefer-nullish-coalescing warnings
# Remplace || par ?? dans les cas sûrs (strings, null, numbers, arrays, objects vides)

set -e

echo "🔧 Correction automatique: prefer-nullish-coalescing"
echo "Patterns sûrs: || '' → ?? '', || null → ?? null, etc."
echo ""

# Compter warnings avant
BEFORE=$(pnpm lint 2>&1 | grep "prefer-nullish-coalescing" | wc -l | tr -d ' ')
echo "Warnings avant: $BEFORE"

# Fonction pour corriger un pattern dans tous les fichiers TS/TSX
fix_pattern() {
  local pattern="$1"
  local replacement="$2"
  local description="$3"

  echo "  - $description"
  find apps packages -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s/$pattern/$replacement/g" {} \;
}

# Patterns sûrs à corriger
fix_pattern " || ''" " ?? ''" "|| '' → ?? ''"
fix_pattern " || \"\"" " ?? \"\"" '|| "" → ?? ""'
fix_pattern " || null" " ?? null" "|| null → ?? null"
fix_pattern " || 0" " ?? 0" "|| 0 → ?? 0"
fix_pattern " || \[\]" " ?? []" "|| [] → ?? []"
fix_pattern " || {}" " ?? {}" "|| {} → ?? {}"
fix_pattern " || false" " ?? false" "|| false → ?? false"

echo ""
echo "✅ Corrections appliquées"
echo ""

# Compter warnings après
AFTER=$(pnpm lint 2>&1 | grep "prefer-nullish-coalescing" | wc -l | tr -d ' ')
echo "Warnings après: $AFTER"
echo "Corrigés: $((BEFORE - AFTER))"
