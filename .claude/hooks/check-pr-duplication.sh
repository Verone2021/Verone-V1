#!/bin/sh
# check-pr-duplication.sh — INFRA-AGENT-COHERENCE-001 (2026-05-08)
#
# Rôle : avant `gh pr create`, vérifier qu'il n'existe pas déjà une PR
# ouverte qui couvre le même TASK-ID. Bloque le pattern récurrent
# « 1 sprint = 1 nouvelle PR » qui démultiplie inutilement les cycles CI.
#
# Branché par : .claude/settings.json PreToolUse Bash(gh pr create*)
#
# Comportement :
# - Extrait le TASK-ID de la branche courante (format `<type>/<TASK-ID>-...`)
# - Liste les PR ouvertes vers staging via `gh pr list`
# - Si une PR ouverte mentionne le même TASK-ID dans son titre → BLOQUE
#   avec message explicatif (rebaser sur la PR existante au lieu d'en
#   créer une nouvelle).
# - Si aucune PR ne couvre le TASK-ID → laisse passer.

set -e

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [ -z "$CURRENT_BRANCH" ]; then
  exit 0
fi

# Extraire le TASK-ID (ex: BO-FIN-042, INFRA-CI-001) du nom de branche
TASK_ID=$(echo "$CURRENT_BRANCH" | grep -oE '[A-Z]+-[A-Z]+-[0-9]+(-[A-Z]+)?' | head -1 || echo "")
if [ -z "$TASK_ID" ]; then
  # Pas de TASK-ID identifiable → on ne bloque pas (cas rare : hotfix
  # sans tag, branche manuelle…).
  exit 0
fi

# Liste les PR ouvertes vers staging (sortie compacte)
EXISTING_PRS=$(gh pr list --state open --base staging --json number,title,headRefName 2>/dev/null || echo "")
if [ -z "$EXISTING_PRS" ]; then
  exit 0
fi

# Cherche un match exact du TASK-ID dans les titres ou les noms de branche
MATCH=$(echo "$EXISTING_PRS" | grep -F "$TASK_ID" || echo "")

if [ -n "$MATCH" ]; then
  cat <<EOF
❌ PR DUPLIQUÉE DÉTECTÉE — création annulée

TASK-ID détecté dans la branche courante : $TASK_ID
Branche courante : $CURRENT_BRANCH

Une (ou plusieurs) PR ouverte(s) couvre(nt) déjà ce TASK-ID :

$MATCH

Action attendue (cf. .claude/rules/workflow.md « 1 PR = 1 bloc cohérent ») :
1. Vérifier si la PR existante couvre votre sujet → ajouter un commit dessus
2. Sinon, renommer votre branche avec un TASK-ID distinct (ex: -PHASE-2)
3. Sinon, fermer l'ancienne PR avant d'en créer une nouvelle

Voir aussi .claude/rules/memory-lifecycle.md règle 1.
EOF
  exit 1
fi

exit 0
