#!/bin/bash

# Script de notification pour validation requise
# Déclenché par l'événement "Notification" de Claude Code

echo "🤔 Claude Code: Validation utilisateur requise"

# Son de notification macOS (Sosumi - attention)
if command -v afplay >/dev/null 2>&1; then
    afplay /System/Library/Sounds/Sosumi.aiff 2>/dev/null &
fi

# Notification système macOS avec boutons
if command -v osascript >/dev/null 2>&1; then
    osascript -e 'display notification "Claude Code attend votre validation pour continuer" with title "Vérone Back Office - Action requise" sound name "Sosumi"' 2>/dev/null &
fi

# Log dans fichier si répertoire logs existe
if [ -d ".claude/logs" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - User validation required" >> .claude/logs/hooks.log
fi

exit 0