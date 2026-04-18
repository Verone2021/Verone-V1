#!/bin/bash
# Affiche les PRs ouvertes + signale conflits et oublis.
# Appele par CLAUDE.md section "AU DEBUT DE CHAQUE SESSION".
# Dependance : gh CLI (deja installe).

set -e

if ! command -v gh &> /dev/null; then
  echo "ℹ️  gh CLI non disponible, skip check-open-prs."
  exit 0
fi

echo "📋 PRs ouvertes (vers staging) :"
echo ""

PR_LIST=$(gh pr list --state open --base staging --json number,title,mergeable,createdAt,headRefName 2>/dev/null || echo "[]")

if [ "$PR_LIST" = "[]" ] || [ -z "$PR_LIST" ]; then
  echo "  Aucune PR ouverte."
  exit 0
fi

echo "$PR_LIST" | jq -r '.[] | "  #\(.number) \(.title)\n    branche: \(.headRefName)\n    mergeable: \(.mergeable)\n    creee: \(.createdAt)\n"'

CONFLICTS=$(echo "$PR_LIST" | jq -r '.[] | select(.mergeable == "CONFLICTING") | .number' | tr '\n' ' ')
if [ -n "$CONFLICTS" ]; then
  echo "⚠️  PRs EN CONFLIT : $CONFLICTS"
  echo "    Resoudre via : gh pr checkout <num> && git merge origin/staging"
fi

OLD_PRS=$(echo "$PR_LIST" | jq -r --arg week_ago "$(date -v-7d -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)" \
  '.[] | select(.createdAt < $week_ago) | .number' | tr '\n' ' ')
if [ -n "$OLD_PRS" ]; then
  echo "⏰ PRs de plus de 7 jours : $OLD_PRS"
  echo "    A trancher : merger, rebaser ou fermer."
fi
