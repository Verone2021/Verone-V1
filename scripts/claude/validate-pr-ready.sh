#!/bin/bash

# Validation pre-PR - S'assurer qu'une feature est prête
# Basé sur CLAUDE.md v9.0.0 et workflow-professionnel-2026

set -e

echo "🔍 Validation pre-PR..."
echo ""

# 1. Vérifier que tous les tests passent
echo "📝 Running type-check..."
npm run type-check || { echo "❌ type-check failed"; exit 1; }
echo "✅ type-check passed"
echo ""

echo "🏗️  Running build..."
npm run build || { echo "❌ build failed"; exit 1; }
echo "✅ build passed"
echo ""

# 2. Vérifier qu'il y a au moins 2 commits (pas juste 1)
echo "📦 Checking commit count..."
COMMIT_COUNT=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')
if [ "$COMMIT_COUNT" -lt 2 ]; then
  echo "⚠️  Seulement $COMMIT_COUNT commit(s) sur cette branche"
  echo "💡 Best practice: Plusieurs commits atomiques par feature"
  echo "   (1 commit toutes les 10-20 min recommandé)"
  echo ""
  read -p "Continuer quand même? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Validation annulée"
    exit 1
  fi
else
  echo "✅ $COMMIT_COUNT commits trouvés"
fi
echo ""

# 3. Vérifier qu'on est sur une branche feature
echo "🌳 Checking branch name..."
BRANCH=$(git branch --show-current)
if [[ ! $BRANCH =~ ^(feat|fix|docs)/ ]]; then
  echo "❌ Branche doit commencer par feat/, fix/, ou docs/"
  echo "   Branche actuelle: $BRANCH"
  exit 1
fi
echo "✅ Branche: $BRANCH"
echo ""

# 4. Vérifier qu'il n'y a pas de changements non commités
echo "🔒 Checking for uncommitted changes..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "⚠️  Changements non commités détectés"
  echo ""
  git status --short
  echo ""
  echo "💡 Commit et push tous les changements avant de créer une PR"
  exit 1
fi
echo "✅ Tous les changements sont commités"
echo ""

# 5. Vérifier que la branche est à jour avec remote
echo "☁️  Checking remote sync..."
git fetch origin "$BRANCH" 2>/dev/null || true
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "none")
if [ "$REMOTE" != "none" ] && [ "$LOCAL" != "$REMOTE" ]; then
  echo "⚠️  Branche locale pas synchronisée avec remote"
  echo "💡 Exécuter: git push"
  exit 1
fi
echo "✅ Branche synchronisée avec remote"
echo ""

# Succès
echo "✅ Pre-PR validation passed"
echo ""
echo "Vous pouvez maintenant créer votre PR:"
echo "  gh pr create --title \"[APP-DOMAIN-NNN] feat: description\" \\"
echo "    --body \"Summary + Test Plan + Liste commits\""
echo ""
