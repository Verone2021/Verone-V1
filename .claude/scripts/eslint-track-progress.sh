#!/bin/bash
# Script de tracking des progrès ESLint
# Usage: bash .claude/scripts/eslint-track-progress.sh

set -e

AUDIT_DIR=".claude/audits"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="$AUDIT_DIR/eslint-progress-$TIMESTAMP.json"

echo "🔍 Audit ESLint en cours..."

# Fonction pour compter warnings par règle
count_warnings() {
  local app=$1
  local rule=$2
  pnpm --filter "$app" lint 2>&1 | grep -c "$rule" || echo "0"
}

# Fonction pour compter total warnings
count_total() {
  local app=$1
  pnpm --filter "$app" lint 2>&1 | tail -1 | grep -oE '[0-9]+ warnings' | cut -d' ' -f1 || echo "0"
}

# Back-Office
echo "📊 Analyse Back-Office..."
BO_TOTAL=$(count_total "@verone/back-office")
BO_UNSAFE_MEMBER=$(count_warnings "@verone/back-office" "no-unsafe-member-access")
BO_UNSAFE_ASSIGN=$(count_warnings "@verone/back-office" "no-unsafe-assignment")
BO_EXPLICIT_ANY=$(count_warnings "@verone/back-office" "no-explicit-any")
BO_UNSAFE_CALL=$(count_warnings "@verone/back-office" "no-unsafe-call")
BO_NULLISH=$(count_warnings "@verone/back-office" "prefer-nullish-coalescing")
BO_REACT_HOOKS=$(count_warnings "@verone/back-office" "react-hooks/exhaustive-deps")

# LinkMe
echo "📊 Analyse LinkMe..."
LM_TOTAL=$(count_total "@verone/linkme")
LM_UNSAFE_MEMBER=$(count_warnings "@verone/linkme" "no-unsafe-member-access")
LM_UNSAFE_ASSIGN=$(count_warnings "@verone/linkme" "no-unsafe-assignment")
LM_EXPLICIT_ANY=$(count_warnings "@verone/linkme" "no-explicit-any")
LM_NULLISH=$(count_warnings "@verone/linkme" "prefer-nullish-coalescing")

# Site-Internet
echo "📊 Analyse Site-Internet..."
SI_TOTAL=$(count_total "@verone/site-internet")

# Total monorepo
TOTAL_WARNINGS=$((BO_TOTAL + LM_TOTAL + SI_TOTAL))

# Générer rapport JSON
cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date +"%Y-%m-%d")",
  "total_warnings": $TOTAL_WARNINGS,
  "by_app": {
    "back-office": {
      "total": $BO_TOTAL,
      "by_rule": {
        "no-unsafe-member-access": $BO_UNSAFE_MEMBER,
        "no-unsafe-assignment": $BO_UNSAFE_ASSIGN,
        "no-explicit-any": $BO_EXPLICIT_ANY,
        "no-unsafe-call": $BO_UNSAFE_CALL,
        "prefer-nullish-coalescing": $BO_NULLISH,
        "react-hooks/exhaustive-deps": $BO_REACT_HOOKS
      }
    },
    "linkme": {
      "total": $LM_TOTAL,
      "by_rule": {
        "no-unsafe-member-access": $LM_UNSAFE_MEMBER,
        "no-unsafe-assignment": $LM_UNSAFE_ASSIGN,
        "no-explicit-any": $LM_EXPLICIT_ANY,
        "prefer-nullish-coalescing": $LM_NULLISH
      }
    },
    "site-internet": {
      "total": $SI_TOTAL
    }
  }
}
EOF

# Afficher résumé
echo ""
echo "✅ Rapport généré : $REPORT_FILE"
echo ""
echo "📊 Résumé :"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Total warnings  : $TOTAL_WARNINGS"
echo "  ├─ Back-Office  : $BO_TOTAL"
echo "  ├─ LinkMe       : $LM_TOTAL"
echo "  └─ Site-Internet: $SI_TOTAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Comparer avec baseline si existe
BASELINE="$AUDIT_DIR/eslint-progress-baseline.json"
if [ -f "$BASELINE" ]; then
  BASELINE_TOTAL=$(jq -r '.total_warnings' "$BASELINE")
  DIFF=$((TOTAL_WARNINGS - BASELINE_TOTAL))

  if [ $DIFF -lt 0 ]; then
    echo "🎉 Progrès : ${DIFF#-} warnings fixés depuis baseline !"
  elif [ $DIFF -gt 0 ]; then
    echo "⚠️  Régression : +$DIFF warnings depuis baseline"
  else
    echo "➖ Aucun changement depuis baseline"
  fi

  echo "   Baseline : $BASELINE_TOTAL warnings ($(jq -r '.date' "$BASELINE"))"
  echo "   Actuel   : $TOTAL_WARNINGS warnings ($(date +"%Y-%m-%d"))"
else
  echo "ℹ️  Baseline non trouvée, créer avec :"
  echo "   cp $REPORT_FILE $BASELINE"
fi

echo ""

# Top 5 règles problématiques
echo "🔝 Top 5 règles (Back-Office) :"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. no-unsafe-member-access : $BO_UNSAFE_MEMBER"
echo "  2. no-unsafe-assignment    : $BO_UNSAFE_ASSIGN"
echo "  3. no-explicit-any         : $BO_EXPLICIT_ANY"
echo "  4. no-unsafe-call          : $BO_UNSAFE_CALL"
echo "  5. prefer-nullish-coalescing : $BO_NULLISH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Recommandations
if [ $BO_REACT_HOOKS -gt 0 ]; then
  echo "🔴 CRITIQUE : $BO_REACT_HOOKS warnings react-hooks/exhaustive-deps"
  echo "   → À corriger IMMÉDIATEMENT (bugs potentiels)"
  echo ""
fi

if [ $BO_EXPLICIT_ANY -gt 100 ]; then
  echo "⚠️  $BO_EXPLICIT_ANY usages de 'any' type détectés"
  echo "   → Voir eslint-correction-guide.md pour patterns"
  echo ""
fi

# Progression vers objectif
TARGET=1000
PROGRESS=$(echo "scale=1; (1 - $TOTAL_WARNINGS / 3792) * 100" | bc)
echo "📈 Progression vers objectif ($TARGET warnings) :"
echo "   Actuel  : $TOTAL_WARNINGS warnings"
echo "   Objectif: $TARGET warnings"
echo "   Progrès : ${PROGRESS}% de réduction depuis départ"
echo ""

echo "✅ Audit terminé !"
