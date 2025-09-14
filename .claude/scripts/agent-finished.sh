#!/bin/bash

# Script de notification pour agent terminé
# Déclenché par l'événement "SubagentStop" de Claude Code

echo "⚡ Claude Code: Agent MCP terminé"

# Son de notification macOS (Tink - subtil)
if command -v afplay >/dev/null 2>&1; then
    afplay /System/Library/Sounds/Tink.aiff 2>/dev/null &
fi

# Notification système macOS
if command -v osascript >/dev/null 2>&1; then
    osascript -e 'display notification "Un agent MCP a terminé son travail" with title "Vérone Back Office" sound name "Tink"' 2>/dev/null &
fi

# Log dans fichier si répertoire logs existe
if [ -d ".claude/logs" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - MCP agent finished" >> .claude/logs/hooks.log
fi

exit 0