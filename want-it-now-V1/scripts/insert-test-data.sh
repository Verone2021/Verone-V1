#!/bin/bash

# Script d'insertion des données de test pour contrats
# Usage: ./scripts/insert-test-data.sh

set -e

echo "🚀 Insertion des données de test pour contrats..."

# Vérifier que Supabase CLI est disponible
if ! command -v npx supabase &> /dev/null; then
    echo "❌ Supabase CLI non trouvé. Veuillez l'installer."
    exit 1
fi

# Exécuter le script d'insertion
node scripts/insert-via-curl.sh

echo "✅ Données de test insérées avec succès !"
echo ""
echo "📊 Données créées :"
echo "   - 5 propriétés (France)"
echo "   - 6 unités"  
echo "   - 4 propriétaires"
echo "   - 2 contrats (1 fixe, 1 variable)"
echo ""
echo "🔗 Vous pouvez maintenant :"
echo "   - Accéder à /contrats pour voir la liste"
echo "   - Accéder à /reservations pour les propriétés avec contrats"