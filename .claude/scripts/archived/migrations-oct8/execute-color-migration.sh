#!/bin/bash

# Script d'exécution de la migration product_colors via psql
# Nécessite les variables d'environnement Supabase

set -e

# Charger les variables d'environnement
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Vérifier que les variables existent
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "❌ Variable SUPABASE_DB_PASSWORD manquante dans .env.local"
  exit 1
fi

echo "🚀 Exécution migration product_colors..."
echo ""

# Exécuter la migration via psql
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h aws-0-eu-central-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.aorroydfjsrygmosnzrl \
  -d postgres \
  -f supabase/migrations/20251007_001_product_colors_table.sql

echo ""
echo "✅ Migration exécutée avec succès!"
echo ""
echo "🎨 Vérification des couleurs insérées..."

# Compter les couleurs
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h aws-0-eu-central-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.aorroydfjsrygmosnzrl \
  -d postgres \
  -c "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_predefined = true) as predefined FROM product_colors;"

echo ""
echo "🎉 Migration terminée!"
