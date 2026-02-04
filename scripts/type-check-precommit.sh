#!/bin/sh
# Type-check filtré pour pre-commit
# Détecte les apps modifiées dans les fichiers staged et lance type-check filtré
# Impact: +5-12s par commit (acceptable pour la sécurité TypeScript)

STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

CHECK_BO=false
CHECK_LM=false
CHECK_SI=false
CHECK_PACKAGES=false

if echo "$STAGED_FILES" | grep -q "^apps/back-office/"; then
  CHECK_BO=true
fi

if echo "$STAGED_FILES" | grep -q "^apps/linkme/"; then
  CHECK_LM=true
fi

if echo "$STAGED_FILES" | grep -q "^apps/site-internet/"; then
  CHECK_SI=true
fi

if echo "$STAGED_FILES" | grep -q "^packages/"; then
  CHECK_PACKAGES=true
fi

# Skip si aucun fichier TS/TSX modifié
if ! echo "$STAGED_FILES" | grep -qE '\.(ts|tsx)$'; then
  exit 0
fi

FAILED=false

echo ""
echo "📘 Type-check (pre-commit)..."

if [ "$CHECK_PACKAGES" = true ]; then
  echo "   📦 Packages modifiés - type-check complet"
  if ! pnpm type-check; then
    FAILED=true
    echo "   ❌ Type-check complet échoué"
  fi
else
  if [ "$CHECK_BO" = true ]; then
    echo "   → Type-check back-office..."
    if ! pnpm --filter @verone/back-office type-check; then
      FAILED=true
    fi
  fi

  if [ "$CHECK_LM" = true ]; then
    echo "   → Type-check linkme..."
    if ! pnpm --filter @verone/linkme type-check; then
      FAILED=true
    fi
  fi

  if [ "$CHECK_SI" = true ]; then
    echo "   → Type-check site-internet..."
    if ! pnpm --filter @verone/site-internet type-check; then
      FAILED=true
    fi
  fi

  if [ "$CHECK_BO" = false ] && [ "$CHECK_LM" = false ] && [ "$CHECK_SI" = false ]; then
    echo "   → Aucune app modifiée, skip type-check"
  fi
fi

if [ "$FAILED" = true ]; then
  echo ""
  echo "❌ Type-check échoué. Commit bloqué."
  exit 1
fi

echo "✅ Type-check OK"
