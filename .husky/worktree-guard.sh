#!/usr/bin/env bash
# Worktree Guard - Prevents commits on main from non-primary worktrees
# Used by: pre-commit, pre-push hooks

set -e

# Detect current worktree location
GIT_DIR=$(git rev-parse --git-dir)
REPO_ROOT=$(git rev-parse --show-toplevel)
CURRENT_BRANCH=$(git branch --show-current)

# Define worktree paths
PRIMARY_WORKTREE="/Users/romeodossantos/verone-worktrees/PRIMARY"
SECONDARY_WORKTREE="/Users/romeodossantos/verone-worktrees/SECONDARY"
MAIN_REPO="/Users/romeodossantos/verone-back-office-V1"

# Check if we're in a worktree (not main repo)
if [[ "$REPO_ROOT" == "$PRIMARY_WORKTREE" ]]; then
  WORKTREE_NAME="PRIMARY"
  ALLOWED_BRANCH="work/primary"
elif [[ "$REPO_ROOT" == "$SECONDARY_WORKTREE" ]]; then
  WORKTREE_NAME="SECONDARY"
  ALLOWED_BRANCH="work/secondary"
elif [[ "$REPO_ROOT" == "$MAIN_REPO" ]]; then
  # In main repo - only allow commits if NOT on main/master
  if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]]; then
    echo ""
    echo "❌ ============================================"
    echo "❌ COMMIT BLOCKED: Cannot commit on main branch"
    echo "❌ ============================================"
    echo ""
    echo "📍 Location: MAIN REPO (not a worktree)"
    echo "🚫 Branch: $CURRENT_BRANCH"
    echo ""
    echo "✅ Solutions:"
    echo "   1. Create feature branch: git checkout -b feat/TASK-NNN-description"
    echo "   2. Switch to worktree: cd /Users/romeodossantos/verone-worktrees/[PRIMARY|SECONDARY]"
    echo ""
    exit 1
  fi
  # Allow commits on feature branches in main repo
  exit 0
else
  # Unknown location - allow (might be a new worktree)
  exit 0
fi

# In a worktree - check branch matches
if [[ "$CURRENT_BRANCH" != "$ALLOWED_BRANCH" ]]; then
  echo ""
  echo "❌ ============================================"
  echo "❌ COMMIT BLOCKED: Wrong branch for worktree"
  echo "❌ ============================================"
  echo ""
  echo "📍 Worktree: $WORKTREE_NAME"
  echo "🚫 Current branch: $CURRENT_BRANCH"
  echo "✅ Expected branch: $ALLOWED_BRANCH"
  echo ""
  echo "✅ Solutions:"
  echo "   1. Switch to correct branch: git checkout $ALLOWED_BRANCH"
  echo "   2. Use correct worktree for this branch"
  echo ""
  exit 1
fi

# All checks passed
exit 0
