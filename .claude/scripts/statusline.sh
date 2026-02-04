#!/bin/bash
# Wrapper ccusage avec fallback gracieux
set -euo pipefail

result=$(ccusage statusline --visual-burn-rate emoji 2>/dev/null) || result=""

if [ -z "$result" ]; then
  # Fallback si ccusage échoue
  echo "⚡ Claude Code (ccusage unavailable)"
else
  echo "$result"
fi
