#!/bin/bash

# Fixed status line for Claude Code
# Reads from stdin if available, otherwise shows basic info

if [ -t 0 ]; then
  # No stdin data - show basic model info
  MODEL="Sonnet 4.5"
  echo "🤖 ${MODEL} | 💾 200K ctx | ⚡ Active"
else
  # Has stdin data - pass to ccusage
  cat | npx ccusage@latest statusline --visual-burn-rate emoji --no-offline 2>/dev/null || {
    # Fallback if ccusage fails
    echo "🤖 Sonnet 4.5 | 💾 200K ctx | ⚡ Active"
  }
fi
