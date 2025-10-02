#!/bin/bash

# 🔍 SCRIPT DE VÉRIFICATION - FIXES #2 ET #3
# Vérifie que les fixes sont bien appliqués dans le code source

echo "🔍 VÉRIFICATION FIXES #2 ET #3"
echo "================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
PASS=0
FAIL=0

# ============================================================================
# FIX #3: AUTO-GÉNÉRATION SLUG ORGANISATIONS
# ============================================================================

echo "📋 FIX #3: Auto-génération slug organisations"
echo "--------------------------------------------"

# Vérification 1: Fonction generateSlug existe
echo -n "  1. Fonction generateSlug() définie... "
if grep -q "const generateSlug = (name: string)" src/components/business/organisation-form.tsx; then
    echo -e "${GREEN}✓ TROUVÉ${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ MANQUANT${NC}"
    echo "     → Ligne attendue: const generateSlug = (name: string): string =>"
    ((FAIL++))
fi

# Vérification 2: Slug utilisé dans organisationData
echo -n "  2. Slug utilisé dans insert/update... "
if grep -q "slug," src/components/business/organisation-form.tsx; then
    echo -e "${GREEN}✓ TROUVÉ${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ MANQUANT${NC}"
    echo "     → Ligne attendue: slug, (dans organisationData)"
    ((FAIL++))
fi

# Vérification 3: Preview slug visible
echo -n "  3. Preview slug dans UI... "
if grep -q "Identifiant automatique" src/components/business/organisation-form.tsx; then
    echo -e "${GREEN}✓ TROUVÉ${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ MANQUANT${NC}"
    echo "     → Section preview slug manquante"
    ((FAIL++))
fi

# Vérification 4: Normalisation NFD (suppression accents)
echo -n "  4. Normalisation NFD accents... "
if grep -q "normalize('NFD')" src/components/business/organisation-form.tsx; then
    echo -e "${GREEN}✓ TROUVÉ${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ MANQUANT${NC}"
    echo "     → normalize('NFD') manquant"
    ((FAIL++))
fi

echo ""

# ============================================================================
# FIX #2: IMAGE FACULTATIVE SOURCING RAPIDE
# ============================================================================

echo "📋 FIX #2: Image facultative sourcing rapide"
echo "-------------------------------------------"

# Vérification 5: Validation image commentée
echo -n "  5. Validation image commentée... "
if grep -q "// if (!selectedImage)" src/components/business/sourcing-quick-form.tsx; then
    echo -e "${GREEN}✓ TROUVÉ${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ MANQUANT${NC}"
    echo "     → Ligne 103 devrait être commentée"
    ((FAIL++))
fi

# Vérification 6: Commentaire explicatif présent
echo -n "  6. Commentaire FIX présent... "
if grep -q "FIX: Image facultative" src/components/business/sourcing-quick-form.tsx; then
    echo -e "${GREEN}✓ TROUVÉ${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ RECOMMANDÉ${NC}"
    echo "     → Commentaire explicatif manquant (non bloquant)"
    ((PASS++))
fi

# Vérification 7: Label "(facultatif)"
echo -n "  7. Label image facultative... "
if grep -q "(facultatif)" src/components/business/sourcing-quick-form.tsx; then
    echo -e "${GREEN}✓ TROUVÉ${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ MANQUANT${NC}"
    echo "     → Label devrait contenir '(facultatif)'"
    ((FAIL++))
fi

# Vérification 8: ImageFile optional dans productData
echo -n "  8. ImageFile optional type... "
if grep -q "imageFile: selectedImage || undefined" src/components/business/sourcing-quick-form.tsx; then
    echo -e "${GREEN}✓ TROUVÉ${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ MANQUANT${NC}"
    echo "     → imageFile devrait être optional (|| undefined)"
    ((FAIL++))
fi

echo ""

# ============================================================================
# VÉRIFICATIONS ADDITIONNELLES
# ============================================================================

echo "📋 VÉRIFICATIONS ADDITIONNELLES"
echo "------------------------------"

# Vérification 9: Hook useSourcingProducts existe
echo -n "  9. Hook useSourcingProducts... "
if [ -f "src/hooks/use-sourcing-products.ts" ]; then
    echo -e "${GREEN}✓ EXISTE${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ MANQUANT${NC}"
    ((FAIL++))
fi

# Vérification 10: Hook useOrganisations existe
echo -n " 10. Hook useOrganisations... "
if [ -f "src/hooks/use-organisations.ts" ]; then
    echo -e "${GREEN}✓ EXISTE${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ MANQUANT${NC}"
    ((FAIL++))
fi

echo ""

# ============================================================================
# MIGRATIONS DATABASE
# ============================================================================

echo "📋 MIGRATIONS DATABASE"
echo "---------------------"

# Vérification 11: Migration sourcing system
echo -n " 11. Migration sourcing system... "
if [ -f "supabase/migrations/20250922_002_product_sourcing_system.sql" ]; then
    echo -e "${GREEN}✓ EXISTE${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ MANQUANT${NC}"
    ((FAIL++))
fi

# Vérification 12: Migration organisations slug
echo -n " 12. Migration organisations (slug)... "
if grep -q "slug VARCHAR" supabase/migrations/20250113_002_create_auth_tables.sql; then
    echo -e "${GREEN}✓ TROUVÉ${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ MANQUANT${NC}"
    ((FAIL++))
fi

echo ""

# ============================================================================
# RÉSUMÉ
# ============================================================================

echo "================================"
echo "📊 RÉSUMÉ VÉRIFICATION"
echo "================================"
echo ""

TOTAL=$((PASS + FAIL))
PERCENT=$((PASS * 100 / TOTAL))

echo "  Tests réussis: ${GREEN}${PASS}${NC}/${TOTAL}"
echo "  Tests échoués: ${RED}${FAIL}${NC}/${TOTAL}"
echo "  Score: ${PERCENT}%"
echo ""

# Déterminer statut global
if [ $FAIL -eq 0 ]; then
    echo -e "  Statut: ${GREEN}✓ TOUS LES FIXES APPLIQUÉS${NC}"
    echo ""
    echo "✅ Vous pouvez procéder aux tests manuels"
    echo "📄 Guide: /TASKS/testing/GUIDE_RAPIDE_TESTS_FIXES.md"
    exit 0
elif [ $FAIL -le 2 ]; then
    echo -e "  Statut: ${YELLOW}⚠ FIXES PARTIELS${NC}"
    echo ""
    echo "⚠️  Certaines vérifications ont échoué (non critiques)"
    echo "📋 Vérifier détails ci-dessus avant tests manuels"
    exit 1
else
    echo -e "  Statut: ${RED}✗ FIXES INCOMPLETS${NC}"
    echo ""
    echo "❌ Plusieurs fixes manquants - Ne pas tester"
    echo "🔧 Appliquer les fixes manquants avant tests"
    exit 2
fi
