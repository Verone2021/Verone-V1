#!/bin/bash
# Bloque toute insertion de `eslint-disable` non documentée par
# // JUSTIFICATION: <raison>.
# Empêche les agents de cacher leurs erreurs sous le tapis.
#
# Appelé par : .claude/settings.json PreToolUse(Edit|Write)

CONTENT=$(echo "$TOOL_INPUT" | jq -r '.new_string // .content // empty' 2>/dev/null)
FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty' 2>/dev/null)

# Skip pour les configs ESLint et ce script lui-même
case "$FILE_PATH" in
  *eslint.config.*|*.eslintrc*|*eslint-rules*|*/lint-rules/*|*check-eslint-disable*)
    exit 0
    ;;
esac

[ -z "$CONTENT" ] && exit 0

# Court-circuit si pas de eslint-disable du tout
echo "$CONTENT" | grep -q 'eslint-disable' || exit 0

PREV=""
VIOLATION=""
while IFS= read -r LINE; do
  if echo "$LINE" | grep -q 'eslint-disable'; then
    if echo "$LINE" | grep -q 'JUSTIFICATION:'; then
      PREV="$LINE"
      continue
    fi
    if echo "$PREV" | grep -q 'JUSTIFICATION:'; then
      PREV="$LINE"
      continue
    fi
    VIOLATION="$LINE"
    break
  fi
  PREV="$LINE"
done <<< "$CONTENT"

if [ -n "$VIOLATION" ]; then
  {
    echo ""
    echo "🚫 BLOQUE — eslint-disable sans JUSTIFICATION:"
    echo ""
    echo "   Ligne : $VIOLATION"
    echo ""
    echo "Pattern attendu :"
    echo "  // JUSTIFICATION: <raison technique précise>"
    echo "  // eslint-disable-next-line <règle>"
    echo ""
    echo "Sinon, fix la cause racine. Exemples :"
    echo "  - any TS  → typer createClient<Database>() (cf. code-standards.md)"
    echo "  - max-lines → décomposer en sous-modules"
    echo "  - unused-vars → supprimer le code mort"
    echo ""
  } >&2
  exit 1
fi

exit 0
