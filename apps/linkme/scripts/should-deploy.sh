#!/bin/bash
# Smart deployment filtering for linkme monorepo app
#
# Deploys only if changes affect:
# - apps/linkme/ (this app)
# - packages/ (shared dependencies)
# - Root config (package.json, turbo.json, etc.)
#
# Usage: Called by Vercel via vercel.json ignoreCommand
# Exit 1 = deploy, Exit 0 = skip

# Get changed files since last deployment
CHANGED=$(git diff --name-only HEAD~1 HEAD)

# Deploy if changes in relevant paths
if echo "$CHANGED" | grep -qE "^(apps/linkme|packages|package\.json|turbo\.json|pnpm-lock\.yaml)"; then
  echo "✅ Changes detected in linkme dependencies - deploying"
  exit 1  # Vercel: exit 1 = deploy
else
  echo "⏭️  No relevant changes for linkme - skipping deployment"
  exit 0  # Vercel: exit 0 = skip
fi
