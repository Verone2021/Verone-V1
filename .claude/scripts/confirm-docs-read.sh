#!/bin/bash
# Confirmation que les docs ont été lues
# Usage: .claude/scripts/confirm-docs-read.sh
#
# Ce script débloque les modifications de code TypeScript pour la session courante.
# Les hooks settings.json vérifient l'existence de /tmp/claude-session-docs-read

echo "📖 CHECKLIST DOCUMENTATION - CONFIRMATION DE LECTURE"
echo ""
echo "Tu confirmes avoir lu les fichiers pertinents pour ta tâche:"
echo ""
echo "  ┌─────────────────────────────────────────────────────────────────┐"
echo "  │ SI ESLINT/WARNINGS:                                             │"
echo "  │   → .claude/commands/fix-warnings.md (~10 min lecture)          │"
echo "  │                                                                 │"
echo "  │ SI ERREURS TYPESCRIPT:                                          │"
echo "  │   → .claude/guides/typescript-errors-debugging.md (~8 min)      │"
echo "  │                                                                 │"
echo "  │ TOUJOURS:                                                       │"
echo "  │   → .claude/guides/expert-workflow.md (workflow TEACH-FIRST)    │"
echo "  │   → CLAUDE.md section COMPORTEMENT MENTOR                       │"
echo "  └─────────────────────────────────────────────────────────────────┘"
echo ""
echo "En exécutant ce script, tu confirmes avoir lu la documentation pertinente."
echo ""

# Créer le fichier de confirmation
touch /tmp/claude-session-docs-read

echo "✅ SESSION DÉBLOQUÉE"
echo ""
echo "Tu peux maintenant modifier les fichiers TypeScript."
echo "Note: Ce déblocage expire à la fin de la session ou au redémarrage."
