#!/usr/bin/env bash
# Supprime screenshots générés > 30 jours

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
GENERATED_DIR="$PROJECT_ROOT/.claude/audits/generated/screenshots"
RETENTION_DAYS=30

echo "🧹 Nettoyage screenshots > $RETENTION_DAYS jours..."

# Trouver dossiers datés > 30 jours
deleted=0
while IFS= read -r -d '' dir; do
  rm -rf "$dir"
  ((deleted++)) || true
done < <(find "$GENERATED_DIR" -maxdepth 1 -type d -name "2[0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]" -mtime +$RETENTION_DAYS -print0 2>/dev/null)

if [ $deleted -gt 0 ]; then
  echo "✅ $deleted dossiers supprimés"
else
  echo "ℹ️  Aucun dossier à supprimer"
fi
