#!/usr/bin/env bash

# Wrapper robuste pour Claude Code statusLine
# - Si lancé "à la main" (stdin = TTY) → fallback lisible
# - Si Claude fournit du JSON sur stdin → passe à ccusage

if [ -t 0 ]; then
  echo "🤖 Claude | ✅ statusline ready"
  exit 0
fi

input="$(cat)"

# 1) binaire global (le + stable / rapide)
if command -v ccusage >/dev/null 2>&1; then
  printf '%s' "$input" | ccusage statusline --visual-burn-rate emoji 2>/dev/null && exit 0
fi

# 2) fallback npx (pinné) si pas de binaire global
printf '%s' "$input" | npx -y ccusage@17.2.0 statusline --visual-burn-rate emoji 2>/dev/null && exit 0

# 3) dernier recours
echo "🤖 Claude | ⚠️ statusline fallback"
exit 0
