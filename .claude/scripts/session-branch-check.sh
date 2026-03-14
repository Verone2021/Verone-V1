#!/bin/bash
# session-branch-check.sh — Displays session context (current branch, recent commits)
# Referenced by: .claude/rules/dev/multi-agent.md

BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
LAST_COMMITS=$(git log --oneline -5 2>/dev/null || echo "no commits")

echo "=== Session Context ==="
echo "  Branch: $BRANCH"
echo "  Remote: $(git config --get branch."$BRANCH".remote 2>/dev/null || echo 'none')"
echo ""
echo "  Last 5 commits:"
echo "$LAST_COMMITS" | sed 's/^/    /'
echo ""

# Warn if on main
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "⚠ WARNING: You are on $BRANCH. Create a feature branch before coding!"
  exit 1
fi

echo "✓ On feature branch. Ready to work."
exit 0
