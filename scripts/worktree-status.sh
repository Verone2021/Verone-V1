#!/bin/bash

echo "📊 Worktrees actifs :"
git worktree list

echo ""
echo "📝 Capacité : 2 worktrees max"
ACTIVE=$(git worktree list | grep -v "(bare)" | wc -l | tr -d ' ')
REMAINING=$((3 - ACTIVE))  # 3 = 1 repo + 2 worktrees
echo "   Utilisés : $((ACTIVE - 1))/2"
echo "   Disponibles : $((REMAINING - 1))"
