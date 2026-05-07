#!/bin/sh
# Validation locale type-check + lint sur les apps touchées
# Appelé par : .husky/pre-push ET .claude/settings.json PreToolUse(git push)
# Objectif : bloquer un push qui ferait échouer la CI distante.
#
# Gain estimé : 7 min de CI par cycle évité.
# Source de vérité unique pour la validation pré-push.

set -e

# Déterminer la base de comparaison
REMOTE_REF=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "")

if [ -n "$REMOTE_REF" ]; then
  COMPARE_BASE="$REMOTE_REF"
else
  # Premier push de la branche : compare contre staging
  COMPARE_BASE="origin/staging"
fi

# Récupérer les fichiers modifiés entre la base et HEAD
CHANGED_FILES=$(git diff --name-only "$COMPARE_BASE"...HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo "ℹ️  Aucun fichier modifié vs $COMPARE_BASE — validation skip."
  exit 0
fi

APPS_TOUCHED=$(echo "$CHANGED_FILES" | grep -oE 'apps/[^/]+' | sort -u || echo "")
PACKAGES_TOUCHED=$(echo "$CHANGED_FILES" | grep -E '^packages/@verone/' | grep -oE 'packages/@verone/[^/]+' | sort -u || echo "")

# Si aucun code applicatif n'est touché (juste docs/scratchpad), skip
if [ -z "$APPS_TOUCHED" ] && [ -z "$PACKAGES_TOUCHED" ]; then
  echo "ℹ️  Aucun code applicatif modifié — validation skip."
  exit 0
fi

# Si un package partagé change, valider les 3 apps (défensif)
if [ -n "$PACKAGES_TOUCHED" ]; then
  echo "📦 Package(s) partagé(s) modifié(s) → validation des 3 apps"
  APPS_TOUCHED="apps/back-office apps/linkme apps/site-internet"
fi

echo ""
echo "🔎 Validation locale type-check + lint avant push"
echo "   Apps : $(echo $APPS_TOUCHED | tr '\n' ' ')"
echo ""

FAILED=0
for APP_PATH in $APPS_TOUCHED; do
  APP=$(basename "$APP_PATH")
  echo "──── @verone/$APP ────"

  if ! pnpm --filter "@verone/$APP" type-check; then
    echo "❌ type-check FAILED on @verone/$APP"
    FAILED=1
  fi

  if ! pnpm --filter "@verone/$APP" lint; then
    echo "❌ lint FAILED on @verone/$APP"
    FAILED=1
  fi

  echo ""
done

if [ "$FAILED" = "1" ]; then
  echo "🚫 Validation locale ÉCHOUÉE — corriger les erreurs ci-dessus."
  echo "   Ne pas contourner avec --no-verify (déjà bloqué côté Claude Code)."
  exit 1
fi

echo "✅ Validation locale OK"
exit 0
