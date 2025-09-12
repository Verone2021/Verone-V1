#!/bin/bash

# Script pour appliquer la correction des photos de couverture
# Utilise psql directement avec les variables d'environnement

set -e

echo "🔧 Application de la correction des photos de couverture..."

# Source environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Extract connection details from Supabase URL
DB_HOST=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co.*|.supabase.co|')
DB_NAME="postgres"
DB_USER="postgres"

# Apply the migration
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -p 5432 \
  -f "supabase/migrations/04-proprietes/122_fix_cover_photo_view_mapping.sql"

echo "✅ Migration appliquée avec succès!"
echo "🔍 Les photos de couverture devraient maintenant s'afficher dans la liste des propriétés."