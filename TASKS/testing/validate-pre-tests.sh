#!/bin/bash
# 🔍 VALIDATION PRÉ-TESTS GROUPE 2
# Exécuter AVANT tests pour vérifier état système

set -e  # Exit on error

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
export PGPASSWORD="ADFVKDJCJDNC934"
export PGHOST="aws-1-eu-west-3.pooler.supabase.com"
export PGPORT="5432"
export PGUSER="postgres.aorroydfjsrygmosnzrl"
export PGDATABASE="postgres"

PROJECT_DIR="/Users/romeodossantos/verone-back-office-V1"

# Compteurs
CHECKS_TOTAL=0
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 VALIDATION PRÉ-TESTS GROUPE 2${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Helper functions
check_pass() {
    ((CHECKS_PASSED++))
    echo -e "${GREEN}✅ PASS${NC} - $1"
}

check_fail() {
    ((CHECKS_FAILED++))
    echo -e "${RED}❌ FAIL${NC} - $1"
}

check_warn() {
    ((CHECKS_WARNING++))
    echo -e "${YELLOW}⚠️  WARN${NC} - $1"
}

# ============================================
# CHECK 1: Serveur Dev
# ============================================
echo -e "${BLUE}[1/8]${NC} Vérification serveur dev..."
((CHECKS_TOTAL++))

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    check_pass "Serveur dev actif (http://localhost:3000)"
else
    check_fail "Serveur dev non démarré"
    echo -e "      ${YELLOW}→ Action: cd $PROJECT_DIR && npm run dev${NC}"
fi
echo ""

# ============================================
# CHECK 2: Connexion Supabase
# ============================================
echo -e "${BLUE}[2/8]${NC} Vérification connexion Supabase..."
((CHECKS_TOTAL++))

if psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c "SELECT NOW();" > /dev/null 2>&1; then
    DB_TIME=$(psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -t -c "SELECT NOW();")
    check_pass "Connexion DB établie (${DB_TIME})"
else
    check_fail "Connexion DB échouée"
    echo -e "      ${YELLOW}→ Vérifier network ou essayer port 6543 (Direct Connection)${NC}"
fi
echo ""

# ============================================
# CHECK 3: Schéma display_order
# ============================================
echo -e "${BLUE}[3/8]${NC} Vérification schéma display_order..."
((CHECKS_TOTAL++))

DISPLAY_ORDER_COUNT=$(psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -t -c "
SELECT COUNT(*)
FROM information_schema.columns
WHERE column_name = 'display_order'
AND table_name IN ('families', 'categories', 'subcategories', 'collections');
" 2>/dev/null | xargs)

if [ "$DISPLAY_ORDER_COUNT" = "4" ]; then
    check_pass "display_order présent dans 4/4 tables"

    # Détails tables
    echo -e "      ${GREEN}→ families ✓${NC}"
    echo -e "      ${GREEN}→ categories ✓${NC}"
    echo -e "      ${GREEN}→ subcategories ✓${NC}"
    echo -e "      ${GREEN}→ collections ✓${NC}"
else
    check_fail "display_order manquant (trouvé $DISPLAY_ORDER_COUNT/4)"
    echo -e "      ${YELLOW}→ Action: Réappliquer migration 20251016_fix_display_order_columns.sql${NC}"
fi
echo ""

# ============================================
# CHECK 4: Code Résiduel sort_order
# ============================================
echo -e "${BLUE}[4/8]${NC} Recherche sort_order résiduel dans code..."
((CHECKS_TOTAL++))

SORT_ORDER_MATCHES=$(grep -r "sort_order" $PROJECT_DIR/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "display_order" | wc -l | xargs)

if [ "$SORT_ORDER_MATCHES" = "0" ]; then
    check_pass "Aucun sort_order résiduel (0 match)"
else
    check_warn "sort_order trouvé dans $SORT_ORDER_MATCHES fichiers"
    echo -e "      ${YELLOW}→ Vérifier: grep -r \"sort_order\" src/ --include=\"*.ts\"${NC}"
fi
echo ""

# ============================================
# CHECK 5: Service Supabase Status
# ============================================
echo -e "${BLUE}[5/8]${NC} Vérification service Supabase..."
((CHECKS_TOTAL++))

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://aorroydfjsrygmosnzrl.supabase.co 2>&1)
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://aorroydfjsrygmosnzrl.supabase.co 2>&1)

if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "200" ]; then
    check_pass "Service Supabase actif (HTTP $HTTP_CODE, ${RESPONSE_TIME}s)"
else
    check_warn "Service Supabase répond $HTTP_CODE"
    echo -e "      ${YELLOW}→ Vérifier status: https://status.supabase.com${NC}"
fi
echo ""

# ============================================
# CHECK 6: Fichiers Migration
# ============================================
echo -e "${BLUE}[6/8]${NC} Vérification fichiers migration..."
((CHECKS_TOTAL++))

MIGRATION_FILE="$PROJECT_DIR/supabase/migrations/20251016_fix_display_order_columns.sql"
if [ -f "$MIGRATION_FILE" ]; then
    FILE_SIZE=$(du -h "$MIGRATION_FILE" | cut -f1)
    check_pass "Migration display_order présente ($FILE_SIZE)"
else
    check_fail "Fichier migration manquant"
    echo -e "      ${YELLOW}→ Fichier attendu: $MIGRATION_FILE${NC}"
fi
echo ""

# ============================================
# CHECK 7: PostgreSQL Version
# ============================================
echo -e "${BLUE}[7/8]${NC} Vérification version PostgreSQL..."
((CHECKS_TOTAL++))

PG_VERSION=$(psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -t -c "SELECT version();" 2>/dev/null | head -1 | xargs)

if [ -n "$PG_VERSION" ]; then
    check_pass "PostgreSQL actif"
    echo -e "      ${GREEN}→ Version: ${PG_VERSION}${NC}"
else
    check_fail "Impossible récupérer version PostgreSQL"
fi
echo ""

# ============================================
# CHECK 8: Test Création Famille SQL
# ============================================
echo -e "${BLUE}[8/8]${NC} Test création famille direct SQL..."
((CHECKS_TOTAL++))

TEST_NAME="test-validation-$(date +%s)"
TEST_SQL="INSERT INTO families (name, slug, description, display_order) VALUES ('$TEST_NAME', '$TEST_NAME', 'Test validation automatique', 999) RETURNING id, name, display_order;"

if RESULT=$(psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -t -c "$TEST_SQL" 2>&1); then
    check_pass "Création famille SQL réussie"
    echo -e "      ${GREEN}→ Famille créée: $TEST_NAME (display_order=999)${NC}"

    # Nettoyage
    psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c "DELETE FROM families WHERE name = '$TEST_NAME';" > /dev/null 2>&1
    echo -e "      ${GREEN}→ Nettoyage: Famille test supprimée${NC}"
else
    check_fail "Création famille SQL échouée"
    echo -e "      ${YELLOW}→ Erreur: $RESULT${NC}"
fi
echo ""

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 RÉSUMÉ VALIDATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Total checks: $CHECKS_TOTAL"
echo -e "${GREEN}✅ Pass: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Fail: $CHECKS_FAILED${NC}"
echo -e "${YELLOW}⚠️  Warn: $CHECKS_WARNING${NC}"
echo ""

# Déterminer statut global
if [ $CHECKS_FAILED -eq 0 ] && [ $CHECKS_WARNING -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎯 SYSTÈME 100% PRÊT - GO POUR TESTS GROUPE 2 !${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
elif [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  WARNINGS PRÉSENTS - Tests possibles mais surveiller${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ ÉCHECS DÉTECTÉS - Corriger avant tests${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📖 Consulter documentation:${NC}"
    echo -e "   - GROUPE-2-QUICK-REFERENCE.md (fixes rapides)"
    echo -e "   - GROUPE-2-DIAGNOSTIC-ERREURS.md (guide complet)"
    echo ""
    exit 1
fi
