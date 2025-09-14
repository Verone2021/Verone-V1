#!/bin/bash

# Script de notification pour tâche terminée
# Déclenché par l'événement "Stop" de Claude Code

echo "🎉 Claude Code: Tâche terminée avec succès !"

# Son de notification macOS (Hero)
if command -v afplay >/dev/null 2>&1; then
    afplay /System/Library/Sounds/Hero.aiff 2>/dev/null &
fi

# Notification système macOS (optionnel)
if command -v osascript >/dev/null 2>&1; then
    osascript -e 'display notification "Tâche Claude Code terminée avec succès !" with title "Vérone Back Office" sound name "Hero"' 2>/dev/null &
fi

# Log dans fichier si répertoire logs existe
if [ -d ".claude/logs" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Task completed successfully" >> .claude/logs/hooks.log
fi

exit 0