#!/bin/bash

# Script to test API access and check organizations via Supabase REST API
echo "🔍 Testing API access and checking organizations..."

SUPABASE_URL="https://ptqwayandsfhciitjnhb.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M"

echo "📊 Checking organizations..."
curl -s -X GET "$SUPABASE_URL/rest/v1/organisations?select=id,nom,pays,is_active&limit=5" \
     -H "apikey: $SUPABASE_SERVICE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
     -H "Content-Type: application/json" | jq .

echo -e "\n👤 Checking super admin users..."
curl -s -X GET "$SUPABASE_URL/rest/v1/utilisateurs?select=id,email,role&role=eq.super_admin&limit=3" \
     -H "apikey: $SUPABASE_SERVICE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
     -H "Content-Type: application/json" | jq .

echo -e "\n🔐 Testing RLS policies for contracts..."
curl -s -X GET "$SUPABASE_URL/rest/v1/contrats?limit=1" \
     -H "apikey: $SUPABASE_SERVICE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
     -H "Content-Type: application/json" | jq .