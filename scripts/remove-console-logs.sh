#!/bin/bash

# 🧹 Script de suppression des console.log en production
# Vérone Back Office - Sécurité & Performance 2025

echo "🔍 Recherche des fichiers avec console.log/error/warn..."

# Compteur initial
TOTAL_FILES=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l | tr -d ' ')
echo "📊 Total fichiers à scanner: $TOTAL_FILES"

# Compter les console.log avant suppression
CONSOLE_LOGS_BEFORE=$(grep -r "console\.\(log\|error\|warn\|debug\)" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "⚠️  Console.log trouvés: $CONSOLE_LOGS_BEFORE"

# Backup avant modification
echo "💾 Création backup..."
tar -czf "console-logs-backup-$(date +%Y%m%d-%H%M%S).tar.gz" src/

# Suppression des console.log (mais garde console.error dans catch blocks)
echo "🗑️  Suppression console.log/warn/debug (garde console.error dans catch)..."

find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e '/console\.log/d' \
  -e '/console\.warn/d' \
  -e '/console\.debug/d' \
  {} +

# Compter après
CONSOLE_LOGS_AFTER=$(grep -r "console\.\(log\|error\|warn\|debug\)" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
REMOVED=$((CONSOLE_LOGS_BEFORE - CONSOLE_LOGS_AFTER))

echo "✅ Suppression terminée!"
echo "📊 Résultats:"
echo "   - Console logs supprimés: $REMOVED"
echo "   - Console restants: $CONSOLE_LOGS_AFTER (error dans catch blocks)"
echo ""
echo "💡 Prochaines étapes:"
echo "   1. Vérifier les modifications: git diff src/"
echo "   2. Tester l'application: npm run dev"
echo "   3. Commiter si OK: git add . && git commit -m 'fix: Remove console.log from production code'"
echo ""
echo "⚠️  Backup créé: console-logs-backup-*.tar.gz"
