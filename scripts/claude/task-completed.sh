#!/bin/bash

# =====================================================
# Claude Code Stop Hook - Plan Sync Verification
# =====================================================
#
# Verifie que le plan est synchronise apres un commit avec Task ID
# Bloque si le plan n'a pas ete mis a jour depuis le dernier commit
#
# Bypass: FORCE_STOP=1

# Use CLAUDE_PROJECT_DIR if available, otherwise try to find repo root
if [ -n "$CLAUDE_PROJECT_DIR" ]; then
  PROJECT_DIR="$CLAUDE_PROJECT_DIR"
else
  PROJECT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
fi

ACTIVE_PLAN="$PROJECT_DIR/.claude/work/ACTIVE.md"
TASK_ID_REGEX='(BO|LM|WEB)-[A-Z0-9]{2,}-[0-9]{3}'

# =====================================================
# Helper function for success exit
# =====================================================
success_exit() {
  echo "✅ Claude Code: Tache terminee avec succes !"
  [ -n "$1" ] && echo "   $1"
  command -v afplay >/dev/null 2>&1 && afplay /System/Library/Sounds/Hero.aiff 2>/dev/null &
  # macOS notification
  command -v osascript >/dev/null 2>&1 && osascript -e 'display notification "Tache Claude Code terminee !" with title "Verone Back Office"' 2>/dev/null &
  # Log
  [ -d "$PROJECT_DIR/.claude/logs" ] && echo "$(date '+%Y-%m-%d %H:%M:%S') - Task completed: $1" >> "$PROJECT_DIR/.claude/logs/hooks.log"
  exit 0
}

# =====================================================
# BYPASS CHECK
# =====================================================
[ "$FORCE_STOP" = "1" ] && success_exit "FORCE_STOP=1, sync check skipped"

# =====================================================
# CHECK IF ACTIVE.md EXISTS
# =====================================================
[ ! -f "$ACTIVE_PLAN" ] && success_exit "No ACTIVE.md, sync check skipped"

# =====================================================
# GET LAST COMMIT INFO
# =====================================================
cd "$PROJECT_DIR" || success_exit "Could not cd to project dir"

LAST_COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")
LAST_COMMIT_TIME=$(git log -1 --format=%ct 2>/dev/null || echo "0")

# No commits yet
[ -z "$LAST_COMMIT_TIME" ] || [ "$LAST_COMMIT_TIME" = "0" ] && success_exit "No commits yet"

# =====================================================
# SKIP CHORE(PLAN) COMMITS
# =====================================================
echo "$LAST_COMMIT_MSG" | grep -qE "^chore\(plan\):" && success_exit "chore(plan) commit, sync check skipped"

# =====================================================
# CHECK IF LAST COMMIT HAS TASK ID
# =====================================================
if echo "$LAST_COMMIT_MSG" | grep -qE "$TASK_ID_REGEX"; then
  # Get ACTIVE.md mtime (macOS vs Linux)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    ACTIVE_MTIME=$(stat -f %m "$ACTIVE_PLAN" 2>/dev/null || echo "0")
  else
    ACTIVE_MTIME=$(stat -c %Y "$ACTIVE_PLAN" 2>/dev/null || echo "0")
  fi

  # If mtime is valid and plan not synced after commit
  if [ "$ACTIVE_MTIME" != "0" ] && [ "$ACTIVE_MTIME" -lt "$LAST_COMMIT_TIME" ]; then
    echo "" >&2
    echo "❌ Plan non synchronise." >&2
    echo "" >&2
    echo "   Le dernier commit contient un Task ID mais ACTIVE.md" >&2
    echo "   n'a pas ete mis a jour depuis." >&2
    echo "" >&2
    echo "   Actions requises:" >&2
    echo "   1. pnpm plan:sync" >&2
    echo "   2. git commit -am \"chore(plan): sync\"" >&2
    echo "" >&2
    echo "   Bypass: FORCE_STOP=1" >&2
    echo "" >&2

    # Error sound
    command -v afplay >/dev/null 2>&1 && afplay /System/Library/Sounds/Sosumi.aiff 2>/dev/null &

    # Log
    [ -d "$PROJECT_DIR/.claude/logs" ] && echo "$(date '+%Y-%m-%d %H:%M:%S') - Stop hook BLOCKED: plan not synced" >> "$PROJECT_DIR/.claude/logs/hooks.log"

    exit 2
  fi
fi

# =====================================================
# SUCCESS - All checks passed
# =====================================================
success_exit "Plan sync: OK"
