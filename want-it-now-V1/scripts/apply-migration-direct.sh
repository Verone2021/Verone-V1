#!/bin/bash

# Script pour appliquer la migration directement via psql
# Usage: ./scripts/apply-migration-direct.sh

echo "🔧 Application de la migration de correction des photos de couverture..."
echo "📝 Connexion à la base de données Supabase..."

# Variables de connexion
DB_HOST="aws-0-eu-north-1.pooler.supabase.com"
DB_USER="postgres.ptqwayandsfhciitjnhb"
DB_NAME="postgres"
MIGRATION_FILE="supabase/migrations/04-proprietes/122_fix_cover_photo_view_mapping.sql"

# Vérifier que le fichier de migration existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Fichier de migration non trouvé: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Application du fichier: $MIGRATION_FILE"
echo "🌐 Connexion à: $DB_HOST"
echo ""
echo "💡 Mot de passe requis pour l'utilisateur postgres"
echo ""

# Appliquer la migration
PGPASSWORD="" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p 5432 -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration appliquée avec succès!"
    echo "🔍 Les photos de couverture devraient maintenant s'afficher dans la liste des propriétés."
    echo ""
    echo "🌐 Testez en visitant: http://localhost:3001/proprietes"
else
    echo ""
    echo "❌ Erreur lors de l'application de la migration"
    echo "💡 Vérifiez les logs ci-dessus pour plus de détails"
    exit 1
fi