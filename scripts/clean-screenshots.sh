#!/bin/bash
# Nettoie les screenshots Playwright temporaires

SCREENSHOTS_DIR=".playwright-mcp/screenshots"

echo "🧹 Nettoyage screenshots Playwright..."

if [ -d "$SCREENSHOTS_DIR" ]; then
  # Compter fichiers avant
  BEFORE=$(find "$SCREENSHOTS_DIR" -name "*.png" -o -name "*.jpg" | wc -l | tr -d ' ')

  # Supprimer screenshots de plus de 7 jours
  find "$SCREENSHOTS_DIR" -name "*.png" -mtime +7 -delete
  find "$SCREENSHOTS_DIR" -name "*.jpg" -mtime +7 -delete

  # Compter fichiers après
  AFTER=$(find "$SCREENSHOTS_DIR" -name "*.png" -o -name "*.jpg" | wc -l | tr -d ' ')

  DELETED=$((BEFORE - AFTER))

  echo "✅ $DELETED screenshots supprimés (anciens > 7 jours)"
  echo "📊 $AFTER screenshots conservés"
else
  echo "⚠️  Dossier $SCREENSHOTS_DIR n'existe pas"
fi
