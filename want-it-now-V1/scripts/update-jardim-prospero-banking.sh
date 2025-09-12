#!/bin/bash

# Script pour mettre à jour les coordonnées bancaires réelles de JARDIM PRÓSPERO LDA

PROJECT_REF="ptqwayandsfhciitjnhb"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M"
SUPABASE_URL="https://ptqwayandsfhciitjnhb.supabase.co"

echo "🏦 Mise à jour coordonnées bancaires JARDIM PRÓSPERO LDA..."
echo "📋 Informations strictement nécessaires selon SEPA 2025"

# Insérer ou mettre à jour avec les vraies coordonnées bancaires
curl -X POST "$SUPABASE_URL/rest/v1/proprietaires" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d '{
    "type": "morale",
    "nom": "JARDIM PRÓSPERO, LDA",
    "pays": "PT",
    "pays_constitution": "PT", 
    "forme_juridique": "LDA",
    "nipc_numero": "123456789",
    "capital_social": 5000.00,
    "nombre_parts_total": 5000,
    "iban": "LT32325005050627932",
    "account_holder_name": "JARDIM PRÓSPERO, LDA",
    "bank_name": "Revolut Bank UAB",
    "swift_bic": "REVOLT21",
    "risk_profile": "medium",
    "kyc_status": "pending",
    "is_brouillon": true,
    "juridiction": "Portugal",
    "registre_commerce": "Conservatória do Registo Comercial"
  }'

echo ""
echo "✅ Coordonnées bancaires mises à jour :"
echo "  🏦 IBAN: LT32325005050627932"
echo "  👤 Titulaire: JARDIM PRÓSPERO, LDA"
echo "  🏛️ Banque: Revolut Bank UAB"
echo "  🔀 BIC: REVOLT21"
echo ""
echo "📋 Conformité SEPA 2025 : IBAN + Nom titulaire = suffisant pour paiements"