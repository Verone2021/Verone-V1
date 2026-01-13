#!/bin/bash
set -euo pipefail

# =====================================================
# Handoff Export - READ → WRITE Mailbox
# =====================================================
#
# Copie le plan le plus récent vers ~/.claude/handoff/LATEST.md
# Exécuté automatiquement à la fin d'une session READ (Stop hook)
#
# Usage: bash .claude/scripts/handoff-export.sh

PLANS_DIR="$HOME/.claude/plans"
HANDOFF_DIR="$HOME/.claude/handoff"
HANDOFF_FILE="$HANDOFF_DIR/LATEST.md"

# Trouver le plan le plus récent
PLAN_FILE=$(ls -t "$PLANS_DIR"/*.md 2>/dev/null | head -1 || echo "")

# Si aucun plan, exit silencieusement
if [ -z "$PLAN_FILE" ] || [ ! -f "$PLAN_FILE" ]; then
  echo "ℹ️  No plan file found in $PLANS_DIR"
  exit 0
fi

# Créer le dossier handoff si absent
mkdir -p "$HANDOFF_DIR"

# Écrire le fichier avec en-tête
{
  echo "# HANDOFF - READ → WRITE"
  echo ""
  echo "**Exported**: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "**Source**: $PLAN_FILE"
  echo ""
  echo "---"
  echo ""
  cat "$PLAN_FILE"
} > "$HANDOFF_FILE"

echo "✅ Handoff exported to $HANDOFF_FILE"
