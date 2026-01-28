#!/usr/bin/env bash
# Classifie screenshots root → .claude/audits/generated/screenshots/YYYY-MM-DD/

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
GENERATED_DIR="$PROJECT_ROOT/.claude/audits/generated/screenshots"
TODAY=$(date +%Y-%m-%d)
TARGET_DIR="$GENERATED_DIR/$TODAY"

# Créer dossier cible
mkdir -p "$TARGET_DIR"

# Déplacer screenshots root
echo "🔍 Recherche screenshots à la racine..."
count=0
for file in "$PROJECT_ROOT"/*.{png,jpg,jpeg} 2>/dev/null; do
  [ -f "$file" ] || continue
  mv "$file" "$TARGET_DIR/"
  ((count++)) || true
done

# Déplacer screenshots Playwright (optionnel)
PLAYWRIGHT_DIR="$PROJECT_ROOT/.playwright-mcp"
if [ -d "$PLAYWRIGHT_DIR" ]; then
  echo "🔍 Recherche screenshots Playwright..."
  mkdir -p "$TARGET_DIR/playwright"
  for file in "$PLAYWRIGHT_DIR"/*.{png,jpg,jpeg} 2>/dev/null; do
    [ -f "$file" ] || continue
    mv "$file" "$TARGET_DIR/playwright/"
    ((count++)) || true
  done
fi

# Résumé
if [ $count -gt 0 ]; then
  echo "✅ $count screenshots classés dans $TARGET_DIR"
else
  echo "ℹ️  Aucun screenshot à classer"
fi
