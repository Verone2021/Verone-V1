#!/bin/bash
# Script : check-responsive-violations.sh
# Detecte les anti-patterns responsive dans le code source
# Lancer AVANT commit pour catcher les violations R1-R5

set -e

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

VIOLATIONS=0
REPORT=""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "==================================================="
echo " Audit responsive — Verone"
echo "==================================================="
echo ""

# Check 1 : w-auto sur Table
echo "▸ Check 1 : w-auto sur conteneurs larges..."
MATCHES=$(grep -rn "className=.*w-auto" \
  apps/ packages/ \
  --include="*.tsx" --include="*.jsx" \
  2>/dev/null | grep -i "table\|data-\|list-" || true)

if [ -n "$MATCHES" ]; then
  echo -e "${YELLOW}⚠ Attention : w-auto detecte sur possibles tables/listes${NC}"
  echo "$MATCHES" | head -5
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check 2 : max-w artificiel sur conteneur
echo ""
echo "▸ Check 2 : max-w-[NNNpx] sur conteneurs principaux..."
MATCHES=$(grep -rn "max-w-\[[0-9]*px\]" \
  apps/ packages/ \
  --include="*.tsx" --include="*.jsx" \
  2>/dev/null | grep -v "modal\|dialog\|toast" || true)

if [ -n "$MATCHES" ]; then
  echo -e "${YELLOW}⚠ max-w fixe potentiellement bloquant${NC}"
  echo "$MATCHES" | head -5
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Check 3 : Boutons sans touch target mobile
echo ""
echo "▸ Check 3 : Boutons size=icon sans h-11 mobile..."
MATCHES=$(grep -rn "size=\"icon\"" \
  apps/ packages/ \
  --include="*.tsx" 2>/dev/null | \
  grep -v "h-11\|h-10" || true)

if [ -n "$MATCHES" ]; then
  COUNT=$(echo "$MATCHES" | wc -l)
  echo -e "${YELLOW}⚠ $COUNT boutons icon potentiellement trop petits sur mobile${NC}"
  echo "$MATCHES" | head -3
  echo "..."
fi

# Check 4 : <Table> sans wrapper responsive
echo ""
echo "▸ Check 4 : <Table> nu sans ResponsiveDataView wrapper..."
MATCHES=$(grep -rln "<Table " \
  apps/ packages/ \
  --include="*.tsx" 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  # On compte les fichiers qui ont Table MAIS PAS ResponsiveDataView
  COUNT_TABLE=$(echo "$MATCHES" | wc -l)
  COUNT_RESPONSIVE=0
  for f in $MATCHES; do
    if grep -q "ResponsiveDataView\|md:hidden\|hidden md:" "$f" 2>/dev/null; then
      COUNT_RESPONSIVE=$((COUNT_RESPONSIVE + 1))
    fi
  done
  COUNT_PROBLEM=$((COUNT_TABLE - COUNT_RESPONSIVE))

  if [ "$COUNT_PROBLEM" -gt 0 ]; then
    echo -e "${YELLOW}⚠ ~$COUNT_PROBLEM tables sans wrapper responsive (a migrer)${NC}"
  else
    echo -e "${GREEN}✓ Toutes les tables ont un wrapper responsive${NC}"
  fi
fi

# Check 5 : w-screen (casse avec sidebar)
echo ""
echo "▸ Check 5 : w-screen (casse avec sidebar fixe)..."
MATCHES=$(grep -rn "w-screen" \
  apps/back-office/src apps/linkme/src \
  --include="*.tsx" 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo -e "${RED}✗ w-screen detecte (bug responsive assure)${NC}"
  echo "$MATCHES"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Summary
echo ""
echo "==================================================="
if [ "$VIOLATIONS" -eq 0 ]; then
  echo -e "${GREEN}✓ Audit responsive : aucune violation critique${NC}"
  echo ""
  echo "Prochaine etape : lancer les tests Playwright"
  echo "  pnpm test:e2e tests/e2e/responsive-*.spec.ts"
  exit 0
else
  echo -e "${YELLOW}⚠ Audit responsive : $VIOLATIONS zone(s) a verifier${NC}"
  echo ""
  echo "Ces avertissements ne bloquent pas le commit,"
  echo "mais sont a traiter dans les sprints BO-UI-RESP-NNN."
  exit 0
fi
