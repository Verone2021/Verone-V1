#!/bin/bash
# task-completed.sh — Post-completion checklist reminder
# Referenced by: .claude/README.md

echo "=== Task Completion Checklist ==="
echo ""
echo "Before marking done:"
echo "  [ ] Code changes reviewed (git diff --staged)"
echo "  [ ] Type-check passes (pnpm --filter @verone/[app] type-check)"
echo "  [ ] ESLint clean on modified files"
echo "  [ ] Tested with Playwright (if UI change)"
echo "  [ ] Committed on feature branch (not main)"
echo ""
echo "Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo "Uncommitted changes: $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') files"
exit 0
