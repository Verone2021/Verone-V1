#!/bin/bash

# Script pour récupérer les types TypeScript depuis le Dashboard Supabase
# Workflow Vercel : Pas de Docker nécessaire

echo "🚀 Récupération des types depuis Dashboard Supabase..."
echo ""
echo "📝 Instructions :"
echo ""
echo "1. Ouvrez ce lien dans votre navigateur :"
echo "   https://supabase.com/dashboard/project/dmwcnbcussoqychafcjg/api/types"
echo ""
echo "2. Copiez TOUT le code TypeScript affiché"
echo ""
echo "3. Collez le contenu dans :"
echo "   apps/back-office/src/types/supabase.ts"
echo ""
echo "4. Exécutez cette commande pour copier vers packages :"
echo "   cp apps/back-office/src/types/supabase.ts packages/@verone/types/src/supabase.ts"
echo ""
echo "5. Validez avec :"
echo "   npm run type-check"
echo ""
echo "✨ C'est la méthode officielle Supabase sans Docker !"
echo ""

# Ouvrir automatiquement le Dashboard dans le navigateur par défaut
open "https://supabase.com/dashboard/project/dmwcnbcussoqychafcjg/api/types"
