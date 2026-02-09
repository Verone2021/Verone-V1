#!/bin/bash
# Synchronise TOUTES les branches locales avec main
# Utile après un merge important sur main

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 SYNCHRONISATION GLOBALE avec main"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Update main first
echo "1️⃣ Mise à jour main..."
git checkout main --quiet
git pull origin main --quiet
MAIN_SHA=$(git rev-parse HEAD)
echo "✅ Main up-to-date ($(git rev-parse --short HEAD))"
echo ""

# List all local branches except main
BRANCHES=$(git branch | grep -v "^\*" | grep -v "main" | sed 's/^[ \t]*//')

if [ -z "$BRANCHES" ]; then
  echo "ℹ️  Aucune branche à synchroniser (seulement main)"
  exit 0
fi

echo "2️⃣ Branches à synchroniser:"
echo "$BRANCHES" | sed 's/^/   - /'
echo ""

# Ask confirmation
read -p "Continuer? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Annulé"
  exit 1
fi

echo ""
echo "3️⃣ Synchronisation en cours..."
echo ""

# Sync each branch
for BRANCH in $BRANCHES; do
  echo "📌 Branche: $BRANCH"

  # Checkout branch
  git checkout "$BRANCH" --quiet 2>/dev/null
  if [ $? -ne 0 ]; then
    echo "   ❌ Impossible de checkout $BRANCH (skip)"
    continue
  fi

  # Check if behind main
  BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")

  if [ "$BEHIND" -eq 0 ]; then
    echo "   ✅ Déjà à jour"
  else
    echo "   🔄 $BEHIND commits de retard, rebase..."

    # Try rebase
    git rebase origin/main --quiet
    if [ $? -eq 0 ]; then
      echo "   ✅ Rebase réussi"

      # Ask if push
      read -p "   Push force? (y/N) " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push --force-with-lease --quiet
        echo "   ✅ Pushed"
      fi
    else
      echo "   ❌ CONFLIT détecté - Rebase aborté"
      echo "   → Résoudre manuellement: git checkout $BRANCH && git rebase origin/main"
      git rebase --abort 2>/dev/null
    fi
  fi

  echo ""
done

# Return to main
git checkout main --quiet
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Synchronisation terminée"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
