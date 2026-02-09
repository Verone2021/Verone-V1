#!/bin/bash
# Vérifie et affiche la branche active au début de chaque session

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
BRANCH_UPSTREAM=$(git rev-parse --abbrev-ref @{u} 2>/dev/null)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 SESSION CONTEXT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌿 Branche actuelle : $CURRENT_BRANCH"
echo ""

# Vérifier si branche est à jour avec remote
if [ -n "$BRANCH_UPSTREAM" ]; then
  BEHIND=$(git rev-list --count HEAD..$BRANCH_UPSTREAM 2>/dev/null || echo "0")
  AHEAD=$(git rev-list --count $BRANCH_UPSTREAM..HEAD 2>/dev/null || echo "0")

  if [ "$BEHIND" -gt 0 ]; then
    echo "⚠️  ATTENTION: $BEHIND commits de retard sur remote"
    echo "   Faire: git pull origin $CURRENT_BRANCH"
    echo ""
  fi

  if [ "$AHEAD" -gt 0 ]; then
    echo "📤 $AHEAD commits locaux non pushés"
    echo ""
  fi
fi

# Vérifier divergence avec main
BEHIND_MAIN=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
if [ "$CURRENT_BRANCH" != "main" ] && [ "$BEHIND_MAIN" -gt 0 ]; then
  echo "⚠️  DIVERGENCE avec main: $BEHIND_MAIN commits"
  echo "   Considérer un rebase: git rebase origin/main"
  echo ""
fi

# Vérifier s'il y a des changements non commités
if ! git diff-index --quiet HEAD 2>/dev/null; then
  echo "⚠️  Changements non commités détectés"
  echo "   Faire: git status"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 RÈGLE: Ne PAS changer de branche sans autorisation"
echo "💡 RÈGLE: Ne PAS créer de branche sans autorisation"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0
