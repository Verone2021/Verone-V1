#!/bin/bash

# 🔧 Script de démarrage Next.js avec .env.local FORCÉ
# Solution: Unset system vars AVANT de lancer npm dev
# Source: Stack Overflow + GitHub best practices

echo "🔧 Démarrage Next.js avec .env.local forcé..."

# Unset toutes les variables Google Merchant système
unset GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL
unset GOOGLE_MERCHANT_PRIVATE_KEY
unset GOOGLE_MERCHANT_PRIVATE_KEY_ID
unset GOOGLE_MERCHANT_CLIENT_ID
unset GOOGLE_CLOUD_PROJECT_ID

echo "✅ Variables système Google Merchant désactivées"
echo "📄 Next.js va charger .env.local uniquement"
echo ""

# Démarrer npm dev (qui va charger .env.local automatiquement)
npm run dev
