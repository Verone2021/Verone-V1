#!/bin/bash
# Auto-sync: BLOQUE le commit si la branche est en retard sur staging
# Evite les regressions silencieuses lors du merge de PR

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

# Ne rien faire si on est sur main ou staging
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "staging" ]; then
  exit 0
fi

# Fetch staging silencieusement
git fetch origin staging --quiet 2>/dev/null

# Compter combien de commits staging a en avance
BEHIND=$(git rev-list --count HEAD..origin/staging 2>/dev/null || echo "0")

if [ "$BEHIND" -gt 0 ]; then
  echo ""
  echo "BLOQUE: Branche $CURRENT_BRANCH en retard de $BEHIND commits sur staging"
  echo ""
  echo "Cela peut causer des REGRESSIONS silencieuses (fichiers supprimes qui reviennent, modifications ecrasees)."
  echo ""
  echo "AVANT de commiter, synchroniser avec staging :"
  echo "  git fetch origin && git merge origin/staging"
  echo ""
  echo "Puis re-tenter le commit."
  exit 1
fi

exit 0
