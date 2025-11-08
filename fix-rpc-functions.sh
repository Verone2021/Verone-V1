#!/bin/bash

# Script pour corriger les fonctions RPC Google Merchant
# À exécuter manuellement

SUPABASE_URL="https://aorroydfjsrygmosnzrl.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNjIzNTk5NSwiZXhwIjoyMDMxODExOTk1fQ.1UWm0iZkHHtk6f_lZe0FD0LPbMRfM0lWQC9WPSqXHCU"

echo "🔧 Correction des fonctions RPC Google Merchant..."

# DROP les fonctions existantes
psql "$DATABASE_URL" <<SQL
DROP FUNCTION IF EXISTS get_google_merchant_products() CASCADE;
DROP FUNCTION IF EXISTS get_google_merchant_stats() CASCADE;
SQL

echo "✅ Fonctions supprimées. Appliquez maintenant la migration 118."
echo "   npx supabase db push"
