#!/usr/bin/env bash
# Nettoyage automatique Playwright MCP - Pattern professionnel
# Usage: pnpm playwright:cleanup

set -euo pipefail

PLAYWRIGHT_DIR=".playwright-mcp"
RETENTION_DAYS=7

echo "🧹 [Playwright Cleanup] Starting..."

# Vérifier que le dossier existe
if [ ! -d "$PLAYWRIGHT_DIR" ]; then
  echo "  ℹ️  Directory $PLAYWRIGHT_DIR not found, skipping cleanup"
  exit 0
fi

cd "$PLAYWRIGHT_DIR"

# Calculer taille avant nettoyage
INITIAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo "  📊 Initial size: $INITIAL_SIZE"

# 1. Supprimer logs console (100% temporaires)
if find . -name "console-*.log" -type f 2>/dev/null | grep -q .; then
  LOGS_COUNT=$(find . -name "console-*.log" -type f | wc -l | tr -d ' ')
  echo "  ➜ Deleting $LOGS_COUNT console logs..."
  find . -name "console-*.log" -type f -delete
  echo "    ✅ Console logs deleted"
else
  echo "  ℹ️  No console logs to delete"
fi

# 2. Supprimer screenshots horodatés > RETENTION_DAYS
if find . -name "page-*T*.png" -type f -mtime +$RETENTION_DAYS 2>/dev/null | grep -q .; then
  SCREENSHOTS_COUNT=$(find . -name "page-*T*.png" -type f -mtime +$RETENTION_DAYS | wc -l | tr -d ' ')
  echo "  ➜ Deleting $SCREENSHOTS_COUNT timestamped screenshots (>$RETENTION_DAYS days)..."
  find . -name "page-*T*.png" -type f -mtime +$RETENTION_DAYS -delete
  echo "    ✅ Old screenshots deleted"
else
  echo "  ℹ️  No old screenshots to delete"
fi

# 3. Supprimer fichiers temporaires PDF (UUID)
if find . -name "*-*-*-*-*.pdf" -type f 2>/dev/null | grep -q .; then
  PDFS_COUNT=$(find . -name "*-*-*-*-*.pdf" -type f | wc -l | tr -d ' ')
  echo "  ➜ Deleting $PDFS_COUNT temporary PDFs (UUID)..."
  find . -name "*-*-*-*-*.pdf" -type f -delete
  echo "    ✅ Temporary PDFs deleted"
else
  echo "  ℹ️  No temporary PDFs to delete"
fi

# 4. Supprimer dossier imbriqué anomal (si existe)
if [ -d ".playwright-mcp" ]; then
  echo "  ➜ Deleting nested .playwright-mcp directory..."
  rm -rf .playwright-mcp
  echo "    ✅ Nested directory deleted"
fi

# 5. Calculer taille après nettoyage
FINAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo ""
echo "✅ [Playwright Cleanup] Complete"
echo "   📊 Initial size: $INITIAL_SIZE"
echo "   📊 Final size: $FINAL_SIZE"
echo "   📝 Retention policy: $RETENTION_DAYS days for timestamped files"
