#!/bin/bash

# Script pour appliquer la migration étape par étape

PROJECT_REF="ptqwayandsfhciitjnhb"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M"
SUPABASE_URL="https://ptqwayandsfhciitjnhb.supabase.co"

echo "🚀 Application migration entités internationales étape par étape..."

# 1. Étendre enum formes juridiques
echo "📋 Étape 1: Extension formes juridiques..."
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS '\''LDA'\'';"
  }'

curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS '\''SA_PT'\'';"
  }'

echo "✅ Formes juridiques étendues"

# 2. Ajouter colonnes bancaires
echo "💳 Étape 2: Ajout champs bancaires..."
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE proprietaires ADD COLUMN IF NOT EXISTS iban VARCHAR(34);"
  }'

curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE proprietaires ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255);"
  }'

curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE proprietaires ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);"
  }'

echo "✅ Champs bancaires ajoutés"

# 3. Ajouter colonnes internationales
echo "🌍 Étape 3: Ajout champs internationaux..."
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE proprietaires ADD COLUMN IF NOT EXISTS nipc_numero VARCHAR(20);"
  }'

curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE proprietaires ADD COLUMN IF NOT EXISTS pays_constitution VARCHAR(10);"
  }'

echo "✅ Champs internationaux ajoutés"

echo ""
echo "🎉 Migration appliquée avec succès !"
echo "🌍 Support ajouté pour :"
echo "  - Formes juridiques portuguaises (LDA, SA_PT)"
echo "  - Champs bancaires SEPA 2025 (IBAN, Nom titulaire)"
echo "  - Champs pays et identification internationaux"
echo ""
echo "📋 Prochaine étape: Créer formulaire adaptatif"