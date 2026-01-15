#!/bin/bash

# Test Form Submission API Routes
# Usage: ./test-form-api.sh

# Configuration
BASE_URL="http://localhost:3002"
API_FORMS_SUBMIT="${BASE_URL}/api/forms/submit"
API_EMAIL_CONFIRMATION="${BASE_URL}/api/emails/form-confirmation"
API_EMAIL_NOTIFICATION="${BASE_URL}/api/emails/form-notification"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Form Submission API${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Submit a form (selection_inquiry)
echo -e "${YELLOW}Test 1: Submit Selection Inquiry Form${NC}"
RESPONSE=$(curl -s -X POST "${API_FORMS_SUBMIT}" \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "selection_inquiry",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+33612345678",
    "company": "Dupont Décoration",
    "role": "Gérant",
    "subject": "Demande de renseignements sur une sélection",
    "message": "Bonjour, je suis intéressé par votre sélection de mobilier haut de gamme pour mon restaurant. Pourriez-vous me contacter pour discuter des options disponibles?",
    "source": "linkme",
    "priority": "medium",
    "metadata": {
      "selection_id": "test-selection-001",
      "user_agent": "curl-test"
    }
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Success${NC}"
  SUBMISSION_ID=$(echo "$RESPONSE" | grep -o '"submissionId":"[^"]*"' | cut -d'"' -f4)
  echo -e "Response: $RESPONSE"
  echo -e "Submission ID: ${GREEN}${SUBMISSION_ID}${NC}\n"
else
  echo -e "${RED}✗ Failed${NC}"
  echo -e "Response: $RESPONSE\n"
fi

# Test 2: Submit a product inquiry
echo -e "${YELLOW}Test 2: Submit Product Inquiry${NC}"
RESPONSE=$(curl -s -X POST "${API_FORMS_SUBMIT}" \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "product_inquiry",
    "firstName": "Marie",
    "lastName": "Martin",
    "email": "marie.martin@example.com",
    "phone": "+33687654321",
    "subject": "Question sur le canapé Velours Bleu",
    "message": "Bonjour, je souhaiterais connaître les dimensions exactes du canapé Velours Bleu référence VB-001. Est-il disponible en d'"'"'autres coloris?",
    "source": "website",
    "priority": "low"
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Success${NC}"
  echo -e "Response: $RESPONSE\n"
else
  echo -e "${RED}✗ Failed${NC}"
  echo -e "Response: $RESPONSE\n"
fi

# Test 3: Submit an urgent SAV request
echo -e "${YELLOW}Test 3: Submit Urgent SAV Request${NC}"
RESPONSE=$(curl -s -X POST "${API_FORMS_SUBMIT}" \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "sav_request",
    "firstName": "Pierre",
    "lastName": "Bernard",
    "email": "pierre.bernard@example.com",
    "phone": "+33698765432",
    "company": "Restaurant Le Gourmet",
    "subject": "Problème avec la livraison",
    "message": "URGENT: La commande #12345 livrée ce matin présente des dommages importants sur 3 chaises. Nous avons besoin d'"'"'une intervention rapide car nous ouvrons demain.",
    "source": "linkme",
    "priority": "urgent"
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Success${NC}"
  URGENT_SUBMISSION_ID=$(echo "$RESPONSE" | grep -o '"submissionId":"[^"]*"' | cut -d'"' -f4)
  echo -e "Response: $RESPONSE"
  echo -e "Urgent Submission ID: ${RED}${URGENT_SUBMISSION_ID}${NC}\n"
else
  echo -e "${RED}✗ Failed${NC}"
  echo -e "Response: $RESPONSE\n"
fi

# Test 4: Validation errors - Missing required fields
echo -e "${YELLOW}Test 4: Validation - Missing Required Fields${NC}"
RESPONSE=$(curl -s -X POST "${API_FORMS_SUBMIT}" \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "general_inquiry",
    "firstName": "Test"
  }')

if echo "$RESPONSE" | grep -q '"error"'; then
  echo -e "${GREEN}✓ Validation working (expected error)${NC}"
  echo -e "Response: $RESPONSE\n"
else
  echo -e "${RED}✗ Validation failed (should return error)${NC}"
  echo -e "Response: $RESPONSE\n"
fi

# Test 5: Invalid form type
echo -e "${YELLOW}Test 5: Validation - Invalid Form Type${NC}"
RESPONSE=$(curl -s -X POST "${API_FORMS_SUBMIT}" \
  -H "Content-Type: application/json" \
  -d '{
    "formType": "invalid_form_type",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "message": "Test message",
    "source": "test"
  }')

if echo "$RESPONSE" | grep -q '"error"'; then
  echo -e "${GREEN}✓ Validation working (expected error)${NC}"
  echo -e "Response: $RESPONSE\n"
else
  echo -e "${RED}✗ Validation failed (should return error)${NC}"
  echo -e "Response: $RESPONSE\n"
fi

# Test 6: Manual email notification (if submission ID is available)
if [ -n "$URGENT_SUBMISSION_ID" ]; then
  echo -e "${YELLOW}Test 6: Manual Email Notification${NC}"
  RESPONSE=$(curl -s -X POST "${API_EMAIL_NOTIFICATION}" \
    -H "Content-Type: application/json" \
    -d "{
      \"submissionId\": \"${URGENT_SUBMISSION_ID}\"
    }")

  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Success${NC}"
    echo -e "Response: $RESPONSE\n"
  else
    echo -e "${RED}✗ Failed${NC}"
    echo -e "Response: $RESPONSE\n"
  fi
else
  echo -e "${YELLOW}Test 6: Skipped (no submission ID available)${NC}\n"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "All API routes are available at:"
echo -e "  - ${GREEN}POST ${API_FORMS_SUBMIT}${NC}"
echo -e "  - ${GREEN}POST ${API_EMAIL_CONFIRMATION}${NC}"
echo -e "  - ${GREEN}POST ${API_EMAIL_NOTIFICATION}${NC}"
echo -e ""
echo -e "To test manually with Postman:"
echo -e "  1. Import the endpoints above"
echo -e "  2. Use the JSON payloads from this script"
echo -e "  3. Check your email for confirmation"
echo -e "  4. Check back-office notifications at http://localhost:3000\n"
