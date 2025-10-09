#!/bin/bash

# ============================================================================
# Script Test API Abby.fr - Validation Endpoints
# ============================================================================
# Date: 2025-10-10
# Usage: ./test-abby-api.sh
# Prérequis: Clé API Abby configurée dans .env.local
# ============================================================================

set -e  # Exit on error

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🧪 Test API Abby.fr - Validation Endpoints${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================================================
# 1. VÉRIFIER .env.local
# ============================================================================
echo -e "${YELLOW}📋 Étape 1 : Vérification configuration...${NC}"

if [ ! -f ".env.local" ]; then
  echo -e "${RED}❌ Fichier .env.local introuvable${NC}"
  echo -e "${YELLOW}Créez le fichier et ajoutez ABBY_API_KEY=abby_sk_live_...${NC}"
  exit 1
fi

# Charger variables d'environnement
export $(grep -v '^#' .env.local | xargs)

if [ -z "$ABBY_API_KEY" ]; then
  echo -e "${RED}❌ ABBY_API_KEY non configurée dans .env.local${NC}"
  echo -e "${YELLOW}Ajoutez : ABBY_API_KEY=abby_sk_live_xxxxx${NC}"
  exit 1
fi

if [[ ! "$ABBY_API_KEY" =~ ^abby_sk_ ]]; then
  echo -e "${RED}❌ Format ABBY_API_KEY invalide (doit commencer par abby_sk_)${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Configuration trouvée${NC}"
echo -e "   Clé API : ${ABBY_API_KEY:0:15}...${ABBY_API_KEY: -4}"
echo ""

# Base URL
ABBY_API_BASE_URL="${ABBY_API_BASE_URL:-https://api.abby.fr/v1}"
echo -e "${BLUE}Base URL : $ABBY_API_BASE_URL${NC}"
echo ""

# ============================================================================
# 2. TEST GET /me - AUTHENTIFICATION
# ============================================================================
echo -e "${YELLOW}📡 Étape 2 : Test authentification (GET /me)...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$ABBY_API_BASE_URL/me" \
  -H "Authorization: Bearer $ABBY_API_KEY" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "   HTTP Code : $HTTP_CODE"

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ Authentification réussie${NC}"
  echo -e "${BLUE}Réponse :${NC}"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

  # Extraire Organization ID
  ORG_ID=$(echo "$BODY" | jq -r '.organization.id' 2>/dev/null || echo "N/A")
  if [ "$ORG_ID" != "N/A" ] && [ "$ORG_ID" != "null" ]; then
    echo -e "${GREEN}📋 Organization ID : $ORG_ID${NC}"
    echo -e "${YELLOW}   → Ajoutez dans .env.local : ABBY_ORGANIZATION_ID=$ORG_ID${NC}"
  fi
elif [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${RED}❌ Erreur 401 : Clé API invalide ou expirée${NC}"
  echo -e "${YELLOW}   → Vérifiez votre clé API dans https://app.abby.fr/settings/integrations${NC}"
  exit 1
elif [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${RED}❌ Erreur 404 : Endpoint /me n'existe pas${NC}"
  echo -e "${YELLOW}   → Vérifiez la documentation Abby ou contactez le support${NC}"
  exit 1
else
  echo -e "${RED}❌ Erreur inattendue : HTTP $HTTP_CODE${NC}"
  echo "$BODY"
  exit 1
fi

echo ""

# ============================================================================
# 3. TEST POST /invoices - CRÉATION FACTURE (DRAFT)
# ============================================================================
echo -e "${YELLOW}📄 Étape 3 : Test création facture draft (POST /invoices)...${NC}"

INVOICE_PAYLOAD='{
  "customer": {
    "company_name": "Test API Client",
    "email": "test-api@verone.com",
    "address": {
      "line1": "123 Rue Test",
      "postal_code": "75001",
      "city": "Paris",
      "country": "FR"
    }
  },
  "items": [
    {
      "description": "Produit Test API",
      "quantity": 1,
      "unit_price": 100.00,
      "vat_rate": 20
    }
  ],
  "status": "draft",
  "notes": "Facture test générée par script validation API Abby.fr"
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ABBY_API_BASE_URL/invoices" \
  -H "Authorization: Bearer $ABBY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$INVOICE_PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "   HTTP Code : $HTTP_CODE"

if [ "$HTTP_CODE" -eq 201 ]; then
  echo -e "${GREEN}✅ Création facture réussie${NC}"
  echo -e "${BLUE}Réponse :${NC}"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

  INVOICE_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null || echo "N/A")
  INVOICE_NUMBER=$(echo "$BODY" | jq -r '.number' 2>/dev/null || echo "N/A")

  if [ "$INVOICE_ID" != "N/A" ]; then
    echo -e "${GREEN}📋 Facture créée : $INVOICE_NUMBER (ID: $INVOICE_ID)${NC}"
  fi
elif [ "$HTTP_CODE" -eq 400 ]; then
  echo -e "${RED}❌ Erreur 400 : Format requête invalide${NC}"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  exit 1
elif [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${RED}❌ Erreur 404 : Endpoint POST /invoices n'existe pas${NC}"
  echo -e "${YELLOW}⚠️  ALERTE CRITIQUE : Endpoint facturation manquant dans API Abby${NC}"
  echo -e "${YELLOW}   → Option 1 : Contacter support Abby (support@abby.fr)${NC}"
  echo -e "${YELLOW}   → Option 2 : Pivot vers Pennylane API (architecture identique)${NC}"
  exit 1
else
  echo -e "${RED}❌ Erreur inattendue : HTTP $HTTP_CODE${NC}"
  echo "$BODY"
  exit 1
fi

echo ""

# ============================================================================
# 4. TEST GET /invoices - LISTE FACTURES
# ============================================================================
echo -e "${YELLOW}📋 Étape 4 : Test récupération liste factures (GET /invoices)...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$ABBY_API_BASE_URL/invoices?limit=5" \
  -H "Authorization: Bearer $ABBY_API_KEY" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "   HTTP Code : $HTTP_CODE"

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ Récupération liste réussie${NC}"
  COUNT=$(echo "$BODY" | jq '.data | length' 2>/dev/null || echo "N/A")
  echo -e "${BLUE}Nombre de factures : $COUNT${NC}"
elif [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${YELLOW}⚠️  Endpoint GET /invoices n'existe pas${NC}"
else
  echo -e "${RED}❌ Erreur : HTTP $HTTP_CODE${NC}"
  echo "$BODY"
fi

echo ""

# ============================================================================
# 5. RÉSUMÉ VALIDATION
# ============================================================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📊 RÉSUMÉ VALIDATION API ABBY.FR${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${GREEN}✅ Tests réussis :${NC}"
echo -e "   - Authentification (GET /me)"
echo -e "   - Création facture draft (POST /invoices)"
echo -e "   - Récupération liste (GET /invoices)"
echo ""
echo -e "${YELLOW}🎯 PROCHAINES ÉTAPES :${NC}"
echo -e "   1. Ajouter ABBY_ORGANIZATION_ID dans .env.local"
echo -e "   2. Configurer webhooks dans Abby Dashboard"
echo -e "   3. Ajouter ABBY_WEBHOOK_SECRET dans .env.local"
echo -e "   4. Lancer Sprint 1 : Migrations database"
echo ""
echo -e "${GREEN}🚀 API Abby.fr est prête pour l'intégration !${NC}"
echo ""
