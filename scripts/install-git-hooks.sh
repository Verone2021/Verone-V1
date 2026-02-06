#!/bin/bash
# Script pour installer les hooks Git de protection main
# Usage: ./scripts/install-git-hooks.sh [chemin-vers-worktree]

set -euo pipefail

TARGET_DIR="${1:-.}"
TEMPLATE_DIR="$(dirname "$0")/../.git-hooks-template"

# Déterminer le chemin du dossier .git
if [ -d "$TARGET_DIR/.git" ]; then
  # Repo principal : .git est un dossier
  GIT_DIR="$TARGET_DIR/.git"
elif [ -f "$TARGET_DIR/.git" ]; then
  # Worktree : .git est un fichier pointant vers .git/worktrees/NOM
  GIT_DIR=$(grep "gitdir:" "$TARGET_DIR/.git" | sed 's/gitdir: //')
else
  echo "❌ Erreur: $TARGET_DIR n'est pas un dépôt git"
  exit 1
fi

HOOKS_DIR="$GIT_DIR/hooks"

# Créer dossier hooks si inexistant
mkdir -p "$HOOKS_DIR"

# Copier les hooks depuis le template
echo "📋 Installation hooks Git dans $TARGET_DIR..."

cp "$TEMPLATE_DIR/post-checkout" "$HOOKS_DIR/post-checkout"
cp "$TEMPLATE_DIR/pre-commit" "$HOOKS_DIR/pre-commit"

chmod +x "$HOOKS_DIR/post-checkout"
chmod +x "$HOOKS_DIR/pre-commit"

echo "✅ Hooks installés:"
echo "   - post-checkout (bloque checkout main)"
echo "   - pre-commit (bloque commit main)"
