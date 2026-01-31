#!/bin/bash
# ESLint Ratchet Effect Progressif
# Autorise les commits tant qu'on RÉDUIT ou MAINTIENT les warnings (pas obligé d'atteindre 0)
#
# Usage: Appelé automatiquement par lint-staged dans .lintstagedrc.js
# Logique:
# - Pour chaque fichier staged, comparer warnings AVANT vs APRÈS
# - Si APRÈS <= AVANT : ✅ Commit autorisé (progrès ou stable)
# - Si APRÈS > AVANT : ❌ Commit bloqué (régression)
# - Baseline mise à jour automatiquement après commit réussi

set -e

BASELINE_FILE=".eslint-baseline.json"
EXIT_CODE=0
TOTAL_BEFORE=0
TOTAL_AFTER=0

# Créer baseline si n'existe pas
if [ ! -f "$BASELINE_FILE" ]; then
  echo "{}" > "$BASELINE_FILE"
fi

# Si aucun fichier passé en argument, sortir
if [ $# -eq 0 ]; then
  echo "⚪ No files to validate"
  exit 0
fi

echo ""
echo "🔍 ESLint Ratchet Effect Progressif - Validation..."
echo ""

# Pour chaque fichier passé en argument
for file in "$@"; do
  # Ignorer fichiers non-existants (ex: fichiers supprimés)
  if [ ! -f "$file" ]; then
    continue
  fi

  # 1. Récupérer baseline (warnings précédents dans ce fichier)
  BEFORE=$(jq -r ".[\"$file\"] // -1" "$BASELINE_FILE" 2>/dev/null || echo "-1")

  # Si pas de baseline, compter les warnings actuels (état initial)
  if [ "$BEFORE" -eq -1 ]; then
    # Compter warnings AVANT les modifications staged (git stash)
    git stash -q --keep-index 2>/dev/null || true
    BEFORE=$(pnpm eslint "$file" --format json 2>/dev/null | jq '[.[] | .warningCount] | add // 0' || echo "0")
    git stash pop -q 2>/dev/null || true
  fi

  # 2. Linter le fichier APRÈS modifications (déjà linté avec --fix par lint-staged)
  # 3. Compter warnings APRÈS
  AFTER=$(pnpm eslint "$file" --format json 2>/dev/null | jq '[.[] | .warningCount] | add // 0' || echo "0")

  # Accumuler totaux
  TOTAL_BEFORE=$((TOTAL_BEFORE + BEFORE))
  TOTAL_AFTER=$((TOTAL_AFTER + AFTER))

  # 4. Comparer
  if [ "$AFTER" -gt "$BEFORE" ]; then
    echo "❌ RÉGRESSION: $file ($BEFORE → $AFTER warnings)"
    EXIT_CODE=1
  elif [ "$AFTER" -lt "$BEFORE" ]; then
    DIFF=$((BEFORE - AFTER))
    echo "✅ PROGRÈS: $file (-$DIFF warnings: $BEFORE → $AFTER)"
    # 5. Mettre à jour baseline
    TMP_FILE=$(mktemp)
    jq ".[\"$file\"] = $AFTER" "$BASELINE_FILE" > "$TMP_FILE" 2>/dev/null || echo "{\"$file\": $AFTER}" > "$TMP_FILE"
    mv "$TMP_FILE" "$BASELINE_FILE"
  else
    if [ "$AFTER" -eq 0 ]; then
      echo "🎉 CLEAN: $file (0 warnings)"
      # Retirer du baseline si 0 warnings
      TMP_FILE=$(mktemp)
      jq "del(.[\"$file\"])" "$BASELINE_FILE" > "$TMP_FILE" 2>/dev/null || echo "{}" > "$TMP_FILE"
      mv "$TMP_FILE" "$BASELINE_FILE"
    else
      echo "⚪ STABLE: $file ($AFTER warnings)"
    fi
  fi
done

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  TOTAL_DIFF=$((TOTAL_BEFORE - TOTAL_AFTER))
  if [ $TOTAL_DIFF -gt 0 ]; then
    echo "✅ Ratchet Effect: -$TOTAL_DIFF warnings ($TOTAL_BEFORE → $TOTAL_AFTER)"
  elif [ $TOTAL_AFTER -eq 0 ]; then
    echo "🎉 All files clean! (0 warnings)"
  else
    echo "✅ Ratchet Effect: Stable ($TOTAL_AFTER warnings)"
  fi
  echo "✅ Commit autorisé"
else
  echo "❌ Ratchet Effect: RÉGRESSION détectée"
  echo "❌ Commit bloqué - Corriger les régressions avant de commit"
fi
echo ""

exit $EXIT_CODE
