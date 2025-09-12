#!/bin/bash

# Script simple pour appliquer du SQL directement à Supabase
# Usage: ./scripts/apply-sql-direct.sh "fichier.sql"

set -e

SQL_FILE="$1"

if [ -z "$SQL_FILE" ]; then
    echo "❌ Usage: $0 <fichier.sql>"
    exit 1
fi

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Fichier SQL non trouvé: $SQL_FILE"
    exit 1
fi

echo "🔧 Application du fichier SQL: $SQL_FILE"

# Utiliser psql avec la DB URL depuis l'environnement
if [ -f .env.local ]; then
    # Extraire NEXT_PUBLIC_SUPABASE_URL depuis .env.local
    SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
    
    # Construire DB_URL pour psql
    DB_HOST=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co.*|.supabase.co|')
    
    echo "🌐 Connexion à: $DB_HOST"
    echo "📝 Mot de passe requis pour postgres user"
    
    # Utiliser psql directement
    psql "postgresql://postgres:[password]@${DB_HOST}:5432/postgres" -f "$SQL_FILE"
    
else
    echo "❌ Fichier .env.local non trouvé"
    exit 1
fi

echo "✅ SQL appliqué avec succès!"