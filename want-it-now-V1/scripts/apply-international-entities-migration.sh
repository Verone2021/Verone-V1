#!/bin/bash

# Script pour appliquer la migration des entités corporatives internationales

# Configuration avec service role key
PROJECT_REF="ptqwayandsfhciitjnhb"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M"
SUPABASE_URL="https://ptqwayandsfhciitjnhb.supabase.co"

echo "🚀 Application migration entités corporatives internationales..."
echo "🔑 Utilisation service role key..."

# Lire et exécuter la migration
MIGRATION_SQL=$(cat supabase/migrations/118_extend_international_corporate_entities.sql)

curl -X POST "$SUPABASE_URL/rest/v1/rpc/sql" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"query\": $(echo "$MIGRATION_SQL" | jq -Rs .)}"

echo ""
echo "✅ Migration appliquée"
echo "🌍 Support international ajouté :"
echo "  - Formes juridiques : Portugal, Espagne, UK, Allemagne"
echo "  - Champs bancaires minimaux SEPA 2025"
echo "  - Validation IBAN et compliance KYC"
echo "  - Données test JARDIM PRÓSPERO LDA"
echo ""
echo "🔗 Vérifiez : http://localhost:3000/proprietaires"