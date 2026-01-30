#!/bin/bash
# Nettoyage cache Turbo + redémarrage daemon
set -e

echo "🧹 Nettoyage Turborepo..."

# 1. Arrêter daemon
echo "   → Arrêt daemon..."
turbo daemon stop 2>/dev/null || true

# 2. Nettoyer cache
echo "   → Nettoyage cache..."
rm -rf .turbo/cache/*
rm -rf node_modules/.cache/turbo

# 3. Nettoyer logs anciens (> 7 jours)
find .turbo/daemon -name "*.log.*" -mtime +7 -delete 2>/dev/null || true

# 4. Redémarrer daemon
echo "   → Redémarrage daemon..."
turbo daemon start

# 5. Vérifier statut
turbo daemon status

echo "✅ Cleanup terminé"
