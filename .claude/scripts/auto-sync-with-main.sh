#!/bin/bash
# Auto-sync branche actuelle avec main pour éviter divergence

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

# Ne rien faire si on est sur main
if [ "$CURRENT_BRANCH" = "main" ]; then
  exit 0
fi

# Vérifier divergence avec main
git fetch origin main --quiet 2>/dev/null
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")

if [ "$BEHIND" -gt 5 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⚠️  ALERTE: Branche $CURRENT_BRANCH en retard de $BEHIND commits sur main"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "**Best Practice 2026** :"
  echo "\"Short-lived branches promote cleaner merges and deploys\""
  echo "Source: https://www.atlassian.com/git/tutorials/comparing-workflows"
  echo ""
  echo "**Recommandation** : Synchroniser MAINTENANT pour éviter conflits massifs"
  echo ""
  echo "1️⃣ Option A (Recommandée) : Rebase sur main"
  echo "   git fetch origin && git rebase origin/main"
  echo ""
  echo "2️⃣ Option B (Plus sûr) : Merge main dans branche"
  echo "   git fetch origin && git merge origin/main"
  echo ""
  echo "3️⃣ Option C : Créer PR immédiatement"
  echo "   gh pr create (si feature stable)"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
fi

exit 0
