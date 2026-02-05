#!/bin/bash
# Simule EXACTEMENT le build Vercel en local

set -e  # Exit si erreur

APP="${1:-back-office}"
FILTER="@verone/$APP"

echo "🔍 Validation locale (simule Vercel)..."
echo "📦 App: $FILTER"
echo ""

# 1. Nettoyer caches (comme CI/CD)
echo "🧹 Nettoyage caches..."
rm -rf apps/$APP/.next apps/$APP/.turbo
echo "✅ Caches nettoyés"
echo ""

# 2. Type-check
echo "📘 Type-check..."
pnpm --filter $FILTER type-check
echo "✅ Type-check OK"
echo ""

# 3. ESLint
echo "📝 ESLint..."
pnpm --filter $FILTER lint
echo "✅ ESLint OK"
echo ""

# 4. BUILD COMPLET (comme Vercel - CRITICAL!)
echo "🏗️  Build complet (détecte exports invalides)..."
pnpm --filter $FILTER build
echo "✅ Build OK - Prêt pour production"
echo ""

echo "🎉 Validation locale réussie - Le déploiement Vercel devrait passer"
