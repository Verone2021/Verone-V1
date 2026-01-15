#!/bin/bash

# Script: dev-stop.sh
# Arrête proprement tous les serveurs de développement
# Usage: pnpm dev:stop

set -e

echo "🛑 Arrêt des serveurs de développement..."

# 1. Tuer tous les processus "next dev"
echo "   → Arrêt des processus Next.js..."
pkill -f "next dev" 2>/dev/null || true

# 2. Libérer les ports 3000, 3001, 3002
echo "   → Libération des ports 3000, 3001, 3002..."
lsof -ti:3000,3001,3002 | xargs kill -9 2>/dev/null || true

# 3. Attendre que les ports soient libres
sleep 1

# 4. Vérifier que les ports sont libres
PORTS_OCCUPIED=$(lsof -ti:3000,3001,3002 2>/dev/null | wc -l)

if [ "$PORTS_OCCUPIED" -eq 0 ]; then
  echo "✅ Tous les serveurs sont arrêtés"
  echo "✅ Ports 3000, 3001, 3002 libérés"
else
  echo "⚠️  Attention : $PORTS_OCCUPIED processus encore actifs"
  echo "   Réessayez ou utilisez: lsof -ti:3000,3001,3002 | xargs kill -9"
fi
