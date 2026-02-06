#!/bin/bash
set -euo pipefail

TASK_ID="$1"
WORKTREE_DIR="/Users/romeodossantos/verone-worktrees/$TASK_ID"

if [ ! -d "$WORKTREE_DIR" ]; then
  echo "❌ Worktree $TASK_ID n'existe pas"
  exit 1
fi

echo "🗑️  Suppression worktree $TASK_ID..."
cd /Users/romeodossantos/verone-back-office-V1
git worktree remove "$WORKTREE_DIR" --force

echo "✅ Worktree supprimé"
echo "💡 Branche préservée. Pour supprimer :"
echo "   git branch -D feat/$TASK_ID"
