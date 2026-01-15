#!/bin/bash

# Script: dev-clean.sh
# Nettoie les ports et caches avant de lancer le serveur dev
# Usage: pnpm dev:clean

set -e

echo "🧹 Nettoyage avant démarrage..."

# 1. Arrêter les processus existants
echo "   → Arrêt des processus existants..."
./scripts/dev-stop.sh

# 2. Nettoyer les caches Next.js (optionnel, commenté par défaut)
# echo "   → Nettoyage des caches Next.js..."
# rm -rf apps/back-office/.next apps/linkme/.next apps/site-internet/.next

# 3. Nettoyer le cache Turbo (optionnel, commenté par défaut)
# echo "   → Nettoyage du cache Turbo..."
# rm -rf .turbo

echo "✅ Nettoyage terminé"
echo ""
echo "🚀 Lancement du serveur..."
pnpm dev
