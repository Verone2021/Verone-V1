#!/bin/bash
# Valide que les screenshots Playwright utilisent le bon output directory
# Hook input: JSON via stdin (Claude Code hooks standard)

INPUT=$(cat)
FILENAME=$(echo "$INPUT" | jq -r '.tool_input.filename // empty' 2>/dev/null)

# Si pas de filename, laisser passer
if [ -z "$FILENAME" ]; then
  exit 0
fi

# Verifier si filename commence par .playwright-mcp/screenshots/
if [[ ! "$FILENAME" =~ ^\.playwright-mcp/screenshots/ ]]; then
  echo "Screenshot doit etre dans .playwright-mcp/screenshots/" >&2
  echo "Fichier demande: $FILENAME" >&2
  echo "Pattern correct: .playwright-mcp/screenshots/[nom].png" >&2
  exit 2
fi

exit 0
