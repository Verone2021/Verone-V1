#!/bin/bash

# =====================================================
# Claude Code Stop Hook - Plan Sync Verification
# =====================================================
#
# Verifie que le plan est synchronise apres un commit avec Task ID
# Bloque si le plan n'a pas ete mis a jour depuis le dernier commit
#
# Bypass: FORCE_STOP=1 ou pas de fichier ACTIVE.md

ACTIVE_PLAN=".claude/work/ACTIVE.md"
TASK_ID_REGEX='(BO|LM|WEB)-[A-Z0-9]{2,}-[0-9]{3}'

# =====================================================
# BYPASS CHECK
# =====================================================
if [ "$FORCE_STOP" = "1" ]; then
  echo "⚠️  FORCE_STOP=1, skipping plan sync check"
  if command -v afplay >/dev/null 2>&1; then
    afplay /System/Library/Sounds/Hero.aiff 2>/dev/null &
  fi
  exit 0
fi

# =====================================================
# CHECK IF ACTIVE.md EXISTS
# =====================================================
if [ ! -f "$ACTIVE_PLAN" ]; then
  echo "✅ Claude Code: Tache terminee avec succes !"
  if command -v afplay >/dev/null 2>&1; then
    afplay /System/Library/Sounds/Hero.aiff 2>/dev/null &
  fi
  if command -v osascript >/dev/null 2>&1; then
    osascript -e 'display notification "Tache Claude Code terminee avec succes !" with title "Verone Back Office" sound name "Hero"' 2>/dev/null &
  fi
  exit 0
fi

# =====================================================
# GET LAST COMMIT INFO
# =====================================================
LAST_COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null)
LAST_COMMIT_TIME=$(git log -1 --format=%ct 2>/dev/null)

if [ -z "$LAST_COMMIT_TIME" ]; then
  # No commits yet, allow
  echo "✅ Claude Code: Tache terminee avec succes !"
  if command -v afplay >/dev/null 2>&1; then
    afplay /System/Library/Sounds/Hero.aiff 2>/dev/null &
  fi
  exit 0
fi

# Get ACTIVE.md modification time (macOS vs Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  ACTIVE_MTIME=$(stat -f %m "$ACTIVE_PLAN" 2>/dev/null)
else
  ACTIVE_MTIME=$(stat -c %Y "$ACTIVE_PLAN" 2>/dev/null)
fi

# =====================================================
# CHECK IF LAST COMMIT HAS TASK ID
# =====================================================
# Skip check if commit is a chore(plan) sync commit
if echo "$LAST_COMMIT_MSG" | grep -qE "^chore\(plan\):"; then
  echo "✅ Claude Code: Tache terminee avec succes !"
  echo "   (chore(plan) commit, sync check skipped)"
  if command -v afplay >/dev/null 2>&1; then
    afplay /System/Library/Sounds/Hero.aiff 2>/dev/null &
  fi
  exit 0
fi

if echo "$LAST_COMMIT_MSG" | grep -qE "$TASK_ID_REGEX"; then
  # Last commit contains a Task ID

  # Check if ACTIVE.md was modified AFTER the commit
  if [ -n "$ACTIVE_MTIME" ] && [ "$ACTIVE_MTIME" -lt "$LAST_COMMIT_TIME" ]; then
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
    echo "   Bypass: FORCE_STOP=1 claude ..." >&2
    echo "" >&2

    # Error sound
    if command -v afplay >/dev/null 2>&1; then
      afplay /System/Library/Sounds/Sosumi.aiff 2>/dev/null &
    fi

    # Log
    if [ -d ".claude/logs" ]; then
      echo "$(date '+%Y-%m-%d %H:%M:%S') - Stop hook BLOCKED: plan not synced" >> .claude/logs/hooks.log
    fi

    exit 2
  fi
fi

# =====================================================
# SUCCESS
# =====================================================
echo "✅ Claude Code: Tache terminee avec succes !"
echo "   Plan sync: OK"

# Success sound
if command -v afplay >/dev/null 2>&1; then
  afplay /System/Library/Sounds/Hero.aiff 2>/dev/null &
fi

# macOS notification
if command -v osascript >/dev/null 2>&1; then
  osascript -e 'display notification "Tache Claude Code terminee avec succes !" with title "Verone Back Office" sound name "Hero"' 2>/dev/null &
fi

# Log
if [ -d ".claude/logs" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Task completed successfully" >> .claude/logs/hooks.log
fi

exit 0
