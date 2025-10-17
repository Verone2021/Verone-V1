#!/bin/bash
# Script: Scan Console.log - Vérone Security
# Description: Détecte console.log en zones critiques et logs credentials
# Usage: ./scripts/security/scan-console-logs.sh
# Exit codes: 0 = pass, 1 = échec

set -e

echo "🔍 SCAN CONSOLE.LOG - VÉRONE SECURITY"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SRC_DIR="src"
CRITICAL_THRESHOLD=50
WARNING_THRESHOLD=300

# Compteurs
TOTAL_COUNT=0
API_COUNT=0
HOOKS_COUNT=0
LIB_COUNT=0
COMPONENTS_COUNT=0
CREDENTIALS_COUNT=0

echo "📊 Analyse Console.log par Zone..."
echo ""

# Fonction: Compter console.log
count_console_in_dir() {
  local dir=$1
  grep -r "console\." "$dir" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs
}

# API Routes (CRITIQUE)
if [ -d "$SRC_DIR/app/api" ]; then
  API_COUNT=$(count_console_in_dir "$SRC_DIR/app/api")
  if [ "$API_COUNT" -gt 0 ]; then
    echo -e "   ${RED}🔴 API Routes: $API_COUNT occurrences${NC}"
  else
    echo -e "   ${GREEN}✅ API Routes: $API_COUNT occurrences${NC}"
  fi
fi

# Hooks (ÉLEVÉ)
if [ -d "$SRC_DIR/hooks" ]; then
  HOOKS_COUNT=$(count_console_in_dir "$SRC_DIR/hooks")
  if [ "$HOOKS_COUNT" -gt 50 ]; then
    echo -e "   ${YELLOW}🟠 Hooks: $HOOKS_COUNT occurrences${NC}"
  elif [ "$HOOKS_COUNT" -gt 0 ]; then
    echo -e "   ${YELLOW}⚠️  Hooks: $HOOKS_COUNT occurrences${NC}"
  else
    echo -e "   ${GREEN}✅ Hooks: $HOOKS_COUNT occurrences${NC}"
  fi
fi

# Lib (ÉLEVÉ)
if [ -d "$SRC_DIR/lib" ]; then
  LIB_COUNT=$(count_console_in_dir "$SRC_DIR/lib")
  if [ "$LIB_COUNT" -gt 50 ]; then
    echo -e "   ${YELLOW}🟠 Lib: $LIB_COUNT occurrences${NC}"
  elif [ "$LIB_COUNT" -gt 0 ]; then
    echo -e "   ${YELLOW}⚠️  Lib: $LIB_COUNT occurrences${NC}"
  else
    echo -e "   ${GREEN}✅ Lib: $LIB_COUNT occurrences${NC}"
  fi
fi

# Components (MOYEN)
if [ -d "$SRC_DIR/components" ]; then
  COMPONENTS_COUNT=$(count_console_in_dir "$SRC_DIR/components")
  if [ "$COMPONENTS_COUNT" -gt 100 ]; then
    echo -e "   ${BLUE}🟡 Components: $COMPONENTS_COUNT occurrences${NC}"
  elif [ "$COMPONENTS_COUNT" -gt 0 ]; then
    echo -e "   ${BLUE}ℹ️  Components: $COMPONENTS_COUNT occurrences${NC}"
  else
    echo -e "   ${GREEN}✅ Components: $COMPONENTS_COUNT occurrences${NC}"
  fi
fi

# Total
TOTAL_COUNT=$((API_COUNT + HOOKS_COUNT + LIB_COUNT + COMPONENTS_COUNT))

echo ""
echo "📈 Total Console.log: $TOTAL_COUNT occurrences"
echo ""

# Scan credentials/secrets (CRITIQUE)
echo "🚨 Scan Logs Credentials Sensibles..."
echo ""

CREDENTIALS_PATTERNS=(
  "password"
  "token"
  "secret"
  "apikey"
  "api_key"
)

for pattern in "${CREDENTIALS_PATTERNS[@]}"; do
  COUNT=$(grep -riE "console\.(log|error|warn).*\b$pattern\b" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)

  if [ "$COUNT" -gt 0 ]; then
    echo -e "   ${RED}🔴 Pattern '$pattern': $COUNT occurrences${NC}"
    CREDENTIALS_COUNT=$((CREDENTIALS_COUNT + COUNT))

    # Afficher fichiers concernés
    echo "      Fichiers:"
    grep -riEl "console\.(log|error|warn).*\b$pattern\b" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | head -5 | while read -r file; do
      echo "      ├─ $file"
    done
    echo ""
  fi
done

if [ "$CREDENTIALS_COUNT" -eq 0 ]; then
  echo -e "   ${GREEN}✅ Aucun log de credentials détecté${NC}"
fi

echo ""

# Top 10 fichiers avec le plus de console.log
echo "📋 Top 10 Fichiers avec Console.log:"
echo ""

grep -r "console\." "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | \
  cut -d: -f1 | \
  sort | \
  uniq -c | \
  sort -rn | \
  head -10 | \
  while read -r count file; do
    if [ "$count" -gt 20 ]; then
      echo -e "   ${RED}🔴 $count occurrences: $file${NC}"
    elif [ "$count" -gt 10 ]; then
      echo -e "   ${YELLOW}🟠 $count occurrences: $file${NC}"
    else
      echo -e "   ${BLUE}🟡 $count occurrences: $file${NC}"
    fi
  done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Validation finale
FAILED=false

# Vérification 1: Zones critiques
CRITICAL_COUNT=$((API_COUNT + HOOKS_COUNT + LIB_COUNT))

if [ "$CRITICAL_COUNT" -gt "$CRITICAL_THRESHOLD" ]; then
  echo -e "${RED}❌ ÉCHEC: $CRITICAL_COUNT console.log en zones critiques (max: $CRITICAL_THRESHOLD)${NC}"
  FAILED=true
fi

# Vérification 2: Total
if [ "$TOTAL_COUNT" -gt "$WARNING_THRESHOLD" ]; then
  echo -e "${YELLOW}⚠️  WARNING: $TOTAL_COUNT console.log total (cible: <$WARNING_THRESHOLD)${NC}"
fi

# Vérification 3: Credentials
if [ "$CREDENTIALS_COUNT" -gt 0 ]; then
  echo -e "${RED}❌ CRITIQUE: $CREDENTIALS_COUNT logs de credentials détectés${NC}"
  FAILED=true
fi

echo ""

if [ "$FAILED" = true ]; then
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ VALIDATION ÉCHEC - CORRECTIONS REQUISES${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "🔧 Actions requises:"
  echo "   1. Remplacer console.log par logger en zones critiques"
  echo "   2. Supprimer logs credentials (password/token/secret)"
  echo "   3. Consulter: docs/guides/GUIDE-MIGRATION-CONSOLE-LOG-TO-LOGGER.md"
  echo ""
  exit 1
else
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ VALIDATION RÉUSSIE${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "📊 Résumé:"
  echo "   ✅ Zones critiques: $CRITICAL_COUNT occurrences (seuil: $CRITICAL_THRESHOLD)"
  echo "   ✅ Aucun log credentials"
  echo "   ℹ️  Total: $TOTAL_COUNT occurrences"
  echo ""
  echo "💡 Recommandation: Continuer migration vers logger pour atteindre <50 total"
  echo ""
  exit 0
fi
