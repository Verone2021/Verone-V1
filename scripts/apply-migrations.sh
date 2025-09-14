#!/bin/bash
# Script d'application des migrations Vérone Architecture Évolutive
# Usage: ./scripts/apply-migrations.sh

set -e

echo "🚀 VÉRONE - Application des migrations architecture évolutive"
echo "============================================================"

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé. Installez-le d'abord:"
    echo "npm install -g supabase"
    exit 1
fi

# Vérifier la configuration .env
if [ ! -f ".env.local" ]; then
    echo "⚠️  Fichier .env.local manquant. Créez-le avec:"
    echo "SUPABASE_ACCESS_TOKEN=sbp_your_token_here"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://qyuvkvgibkuykucqylxq.supabase.co"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    exit 1
fi

# Charger les variables d'environnement
source .env.local

# Vérifier que le token est défini
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN n'est pas défini dans .env.local"
    exit 1
fi

echo "✅ Configuration validée"
echo ""

# Lier le projet à la vraie base Supabase
echo "📡 Liaison au projet Supabase qyuvkvgibkuykucqylxq..."
supabase link --project-ref qyuvkvgibkuykucqylxq

echo ""
echo "📋 Application des migrations dans l'ordre..."

# Application des migrations dans l'ordre correct
migrations=(
    "20250113_001_create_catalogue_tables.sql"
    "20250113_002_create_auth_tables.sql"
    "20250113_003_create_rls_policies.sql"
    "20250113_004_create_feeds_tables.sql"
    "20250113_005_validation_and_seed.sql"
)

for migration in "${migrations[@]}"; do
    echo "⏳ Application de $migration..."
    supabase db push --include-all
    echo "✅ $migration appliquée"
done

echo ""
echo "🎯 Validation de l'architecture..."

# Exécuter les validations
echo "⏳ Validation des tables, RLS et données de base..."
supabase sql --file supabase/migrations/20250113_005_validation_and_seed.sql

echo ""
echo "🎉 SUCCÈS - Migrations appliquées avec succès!"
echo ""
echo "📊 PROCHAINES ÉTAPES:"
echo "1. Créer l'utilisateur veronebyromeo@gmail.com dans Supabase Auth"
echo "2. Connecter l'authentification réelle dans l'application"
echo "3. Tester le flux homepage → login → dashboard"
echo ""
echo "🔗 Accédez à votre projet: https://supabase.com/dashboard/project/qyuvkvgibkuykucqylxq"