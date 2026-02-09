#!/bin/bash
# Valide que les screenshots Playwright utilisent le bon output directory

TOOL_NAME="$1"
PARAMS="$2"

# Vérifier si c'est un outil screenshot Playwright
if [[ "$TOOL_NAME" == "mcp__playwright-lane-"*"__browser_take_screenshot" ]]; then
  # Extraire filename des paramètres JSON
  FILENAME=$(echo "$PARAMS" | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)

  # Vérifier si filename commence par .playwright-mcp/screenshots/
  if [[ ! "$FILENAME" =~ ^\.playwright-mcp/screenshots/ ]]; then
    echo "❌ ERREUR: Screenshot doit être dans .playwright-mcp/screenshots/"
    echo "   Fichier demandé: $FILENAME"
    echo "   Pattern correct: .playwright-mcp/screenshots/[nom].png"
    echo ""
    echo "Voir CLAUDE.md section 'Règles MCP Playwright' pour pattern standard"
    exit 1
  fi

  echo "✅ Screenshot path valide: $FILENAME"
fi

exit 0
