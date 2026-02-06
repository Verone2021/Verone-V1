#!/bin/bash
set -euo pipefail

TASK_ID="$1"
BRANCH_NAME="${2:-feat/$TASK_ID}"
WORKTREE_DIR="/Users/romeodossantos/verone-worktrees/$TASK_ID"

# Protection ABSOLUE : Interdire création worktree sur main
if [ "$BRANCH_NAME" = "main" ] || [ "$BRANCH_NAME" = "master" ]; then
  echo ""
  echo "🚨 ============================================== 🚨"
  echo "❌ INTERDIT: Création worktree sur main refusée"
  echo "🚨 ============================================== 🚨"
  echo ""
  echo "Vous devez créer une FEATURE BRANCH."
  echo ""
  echo "Usage correct:"
  echo "  ./scripts/worktree-create.sh NOM feat/APP-DOMAIN-NNN-description"
  echo ""
  echo "Exemples:"
  echo "  ./scripts/worktree-create.sh orders feat/BO-ORD-001-fix-status"
  echo "  ./scripts/worktree-create.sh ui feat/LM-UI-002-new-form"
  echo ""
  exit 1
fi

# Vérifier nombre worktrees actifs
ACTIVE_COUNT=$(git worktree list | grep -v "(bare)" | wc -l | tr -d ' ')
if [ "$ACTIVE_COUNT" -ge 3 ]; then  # 1 repo principal + 2 worktrees = 3
  echo "❌ Maximum 2 worktrees atteint. Nettoyer un worktree d'abord :"
  git worktree list
  exit 1
fi

# Créer worktree
if [ -d "$WORKTREE_DIR" ]; then
  echo "❌ Worktree $TASK_ID existe déjà"
  exit 1
fi

echo "📁 Création worktree $TASK_ID..."
git worktree add "$WORKTREE_DIR" "$BRANCH_NAME" || \
  git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR"

echo "📦 Installation dépendances (2-3 min)..."
cd "$WORKTREE_DIR"
pnpm install --frozen-lockfile

# Installer hooks Git de protection main
echo "🔒 Installation hooks Git de protection..."
bash "$(dirname "$0")/install-git-hooks.sh" "$WORKTREE_DIR"

echo "✅ Worktree $TASK_ID prêt!"
echo ""
echo "📌 Next steps:"
echo "  cd $WORKTREE_DIR"
echo "  code . && claude"
