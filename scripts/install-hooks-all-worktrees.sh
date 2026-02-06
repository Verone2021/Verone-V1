#!/bin/bash
# Script pour installer les hooks Git dans TOUS les worktrees existants

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔍 Recherche des worktrees existants..."

# Lister tous les worktrees (sauf le repo principal)
git worktree list --porcelain | grep "worktree" | sed 's/worktree //' | while read -r WORKTREE_PATH; do
  # Ignorer le repo principal
  if [ "$WORKTREE_PATH" = "/Users/romeodossantos/verone-back-office-V1" ]; then
    continue
  fi

  echo ""
  echo "📁 Worktree: $WORKTREE_PATH"
  bash "$SCRIPT_DIR/install-git-hooks.sh" "$WORKTREE_PATH"
done

# Installer aussi dans le repo principal
echo ""
echo "📁 Repo principal: /Users/romeodossantos/verone-back-office-V1"
bash "$SCRIPT_DIR/install-git-hooks.sh" "/Users/romeodossantos/verone-back-office-V1"

echo ""
echo "✅ Hooks installés dans tous les worktrees + repo principal"
