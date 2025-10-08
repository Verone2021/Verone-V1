#!/bin/bash
# Script: Validation RLS Coverage - Vérone Security
# Description: Vérifie que 100% des tables ont RLS enabled
# Usage: ./scripts/security/validate-rls-coverage.sh
# Exit codes: 0 = success, 1 = échec

set -e

echo "🔒 VALIDATION RLS COVERAGE - VÉRONE SECURITY"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DATABASE_URL=${DATABASE_URL:-$SUPABASE_DB_URL}

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ ERREUR: DATABASE_URL non défini${NC}"
  echo "   Export DATABASE_URL ou SUPABASE_DB_URL avant d'exécuter ce script"
  exit 1
fi

# Fonction: Compter tables sans RLS
count_tables_without_rls() {
  psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*)
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false;
  " | xargs
}

# Fonction: Lister tables sans RLS
list_tables_without_rls() {
  psql "$DATABASE_URL" -t -c "
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false
    ORDER BY tablename;
  "
}

# Fonction: Compter total tables
count_total_tables() {
  psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*)
    FROM pg_tables
    WHERE schemaname = 'public';
  " | xargs
}

# Fonction: Compter policies par table
count_policies_per_table() {
  psql "$DATABASE_URL" -c "
    SELECT
      schemaname,
      tablename,
      COUNT(*) as policies_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
    ORDER BY policies_count ASC, tablename;
  "
}

echo "📊 Analyse RLS Coverage..."
echo ""

# Compter tables
TOTAL_TABLES=$(count_total_tables)
NO_RLS_COUNT=$(count_tables_without_rls)
RLS_COUNT=$((TOTAL_TABLES - NO_RLS_COUNT))

# Calculer pourcentage
if [ "$TOTAL_TABLES" -gt 0 ]; then
  COVERAGE_PERCENT=$((RLS_COUNT * 100 / TOTAL_TABLES))
else
  COVERAGE_PERCENT=0
fi

echo "📈 Statistiques RLS:"
echo "   Total tables public: $TOTAL_TABLES"
echo "   Tables avec RLS: $RLS_COUNT"
echo "   Tables SANS RLS: $NO_RLS_COUNT"
echo "   Coverage: ${COVERAGE_PERCENT}%"
echo ""

# Validation
if [ "$NO_RLS_COUNT" -gt 0 ]; then
  echo -e "${RED}❌ ÉCHEC: $NO_RLS_COUNT tables sans RLS détectées${NC}"
  echo ""
  echo "🚨 Tables vulnérables (SANS RLS):"
  list_tables_without_rls | while read -r table; do
    echo -e "   ${RED}├─ $table${NC}"
  done
  echo ""
  echo "🔧 Action requise:"
  echo "   1. Appliquer migration: supabase/migrations/20251008_003_fix_missing_rls_policies.sql"
  echo "   2. Créer policies RLS pour tables listées ci-dessus"
  echo "   3. Re-exécuter ce script pour validation"
  echo ""
  exit 1
else
  echo -e "${GREEN}✅ SUCCÈS: Toutes les tables ont RLS enabled (100% coverage)${NC}"
  echo ""
fi

# Vérifier policies (warning si <4 policies par table critique)
echo "📋 Analyse Policies RLS..."
echo ""

CRITICAL_TABLES=("variant_groups" "sample_orders" "sample_order_items" "contacts" "products" "user_profiles")

for table in "${CRITICAL_TABLES[@]}"; do
  POLICIES_COUNT=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = '$table';
  " | xargs)

  if [ "$POLICIES_COUNT" -lt 4 ]; then
    echo -e "   ${YELLOW}⚠️  $table: $POLICIES_COUNT policies (attendu: ≥4)${NC}"
  else
    echo -e "   ${GREEN}✅ $table: $POLICIES_COUNT policies${NC}"
  fi
done

echo ""
echo "📊 Détail Policies par Table:"
count_policies_per_table

echo ""
echo -e "${GREEN}🎉 VALIDATION RLS COMPLÈTE${NC}"
echo ""
echo "Prochaines étapes:"
echo "   1. Tests accès multi-organisations"
echo "   2. Tests RLS bypass attempts"
echo "   3. Monitoring production activé"
echo ""

exit 0
