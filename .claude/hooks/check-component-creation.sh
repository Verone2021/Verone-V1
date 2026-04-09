#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# BLOQUANT : composants dans apps/
if [[ "$FILE_PATH" == apps/*/components/*Modal* ]] || \
   [[ "$FILE_PATH" == apps/*/components/*Form* ]] || \
   [[ "$FILE_PATH" == apps/*/components/*Section* ]] || \
   [[ "$FILE_PATH" == apps/*/components/*Table* ]] || \
   [[ "$FILE_PATH" == apps/*/components/*Sheet* ]] || \
   [[ "$FILE_PATH" == apps/*/components/*Dialog* ]] || \
   [[ "$FILE_PATH" == apps/*/components/*Wizard* ]]; then
  echo "BLOQUÉ : Création de composant dans apps/ ($FILE_PATH)." >&2
  echo "RÈGLE : Les composants DOIVENT être dans packages/@verone/." >&2
  echo "ACTION : 1) Lire docs/current/INDEX-COMPOSANTS-FORMULAIRES.md 2) Vérifier si un composant similaire existe 3) Si oui, réutilise-le. Si non, crée dans packages/@verone/." >&2
  exit 2
fi

# WARNING : nouveau composant dans packages/@verone/
if [[ "$FILE_PATH" == packages/@verone/*/src/components/* ]]; then
  if [ ! -f "$FILE_PATH" ]; then
    echo "ATTENTION : Nouveau composant $FILE_PATH." >&2
    echo "As-tu vérifié INDEX-COMPOSANTS-FORMULAIRES.md ? Après création, ajoute-le dans l'index." >&2
  fi
fi

exit 0
