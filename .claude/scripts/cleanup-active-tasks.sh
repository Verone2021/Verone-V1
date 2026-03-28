#!/bin/bash
# Detecte les taches terminees dans ACTIVE.md et rappelle de nettoyer

ACTIVE_FILE="$CLAUDE_PROJECT_DIR/.claude/work/ACTIVE.md"

if [ ! -f "$ACTIVE_FILE" ]; then
  exit 0
fi

# Compter les taches terminees (lignes avec [x])
DONE=$(grep -c '\[x\]' "$ACTIVE_FILE" 2>/dev/null || echo 0)
# Compter les taches en cours (lignes avec [ ])
TODO=$(grep -c '\[ \]' "$ACTIVE_FILE" 2>/dev/null || echo 0)

if [ "$DONE" -gt 5 ]; then
  echo "ACTIVE.md : $DONE taches terminees, $TODO en cours."
  echo "NETTOYAGE RECOMMANDE : supprimer les taches [x] terminees et mergees de ACTIVE.md."
fi

exit 0
