#!/usr/bin/env bash
# Worktree Context Display - Shows current worktree/branch
# Add to your shell prompt (PS1) or run manually

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

PRIMARY_WORKTREE="/Users/romeodossantos/verone-worktrees/PRIMARY"
SECONDARY_WORKTREE="/Users/romeodossantos/verone-worktrees/SECONDARY"
MAIN_REPO="/Users/romeodossantos/verone-back-office-V1"

if [[ "$REPO_ROOT" == "$PRIMARY_WORKTREE" ]]; then
  echo "📍 PRIMARY [$CURRENT_BRANCH]"
elif [[ "$REPO_ROOT" == "$SECONDARY_WORKTREE" ]]; then
  echo "📍 SECONDARY [$CURRENT_BRANCH]"
elif [[ "$REPO_ROOT" == "$MAIN_REPO" ]]; then
  echo "📍 MAIN REPO [$CURRENT_BRANCH]"
else
  echo "📍 Unknown [$CURRENT_BRANCH]"
fi
