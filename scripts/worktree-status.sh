#!/bin/bash
# Affiche le statut du worktree/repo actuel

set -euo pipefail

# Récupérer infos
CURRENT_DIR=$(pwd)
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

# Détecter si worktree ou repo principal
if [ -f ".git" ]; then
  # C'est un worktree (fichier .git pointe vers .git/worktrees/NOM)
  WORKTREE_NAME=$(basename "$CURRENT_DIR")
  TYPE="WORKTREE"
elif [ -d ".git" ]; then
  # C'est le repo principal (dossier .git)
  WORKTREE_NAME="main-repo"
  TYPE="REPO PRINCIPAL"
else
  echo "❌ Pas un dépôt git"
  exit 1
fi

# Affichage coloré
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 SESSION ACTIVE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Type       : $TYPE"
echo "  Nom        : $WORKTREE_NAME"
echo "  Répertoire : $CURRENT_DIR"
echo "  Branche    : $BRANCH"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
