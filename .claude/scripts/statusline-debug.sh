#!/usr/bin/env bash
# Debug wrapper for ccusage statusline
# Logs the JSON input from Claude Code to diagnose format changes
# Usage: set as statusLine command, then check /tmp/claude-statusline-debug.log

INPUT=$(cat)
LOG_FILE="/tmp/claude-statusline-debug.log"

# Log the raw JSON input (keep only last 5 entries)
echo "---[$(date +%H:%M:%S)]---" >> "$LOG_FILE"
echo "$INPUT" >> "$LOG_FILE"
tail -30 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"

# Pass through to ccusage
echo "$INPUT" | ccusage statusline --visual-burn-rate emoji 2>/dev/null
