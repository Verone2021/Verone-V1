#!/bin/bash
# Script wrapper robuste pour statusline
# Utilise ccusage si disponible, sinon fallback statique

# Tente d'exécuter ccusage statusline
result=$(bun x ccusage statusline 2>/dev/null)

# Si résultat vide ou erreur, utilise un fallback
if [ -z "$result" ]; then
  echo "⚡ Claude Code"
else
  echo "$result"
fi
