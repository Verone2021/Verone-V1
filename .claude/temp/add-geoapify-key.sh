#!/bin/bash
# Script pour ajouter la clé Geoapify dans les .env.local

GEOAPIFY_KEY="fdf6b7d7cd334d019f34bef94d53f7ba"

# Ajouter dans LinkMe
if ! grep -q "NEXT_PUBLIC_GEOAPIFY_API_KEY" /Users/romeodossantos/verone-back-office-V1/apps/linkme/.env.local 2>/dev/null; then
  echo "" >> /Users/romeodossantos/verone-back-office-V1/apps/linkme/.env.local
  echo "# === Geoapify API (Geocoding) ===" >> /Users/romeodossantos/verone-back-office-V1/apps/linkme/.env.local
  echo "# Documentation: https://www.geoapify.com/geocoding-api" >> /Users/romeodossantos/verone-back-office-V1/apps/linkme/.env.local
  echo "NEXT_PUBLIC_GEOAPIFY_API_KEY=$GEOAPIFY_KEY" >> /Users/romeodossantos/verone-back-office-V1/apps/linkme/.env.local
  echo "✅ Clé Geoapify ajoutée dans apps/linkme/.env.local"
else
  echo "⚠️  Clé déjà présente dans apps/linkme/.env.local"
fi

# Ajouter dans Back-Office
if ! grep -q "NEXT_PUBLIC_GEOAPIFY_API_KEY" /Users/romeodossantos/verone-back-office-V1/apps/back-office/.env.local 2>/dev/null; then
  echo "" >> /Users/romeodossantos/verone-back-office-V1/apps/back-office/.env.local
  echo "# === Geoapify API (Geocoding) ===" >> /Users/romeodossantos/verone-back-office-V1/apps/back-office/.env.local
  echo "# Documentation: https://www.geoapify.com/geocoding-api" >> /Users/romeodossantos/verone-back-office-V1/apps/back-office/.env.local
  echo "NEXT_PUBLIC_GEOAPIFY_API_KEY=$GEOAPIFY_KEY" >> /Users/romeodossantos/verone-back-office-V1/apps/back-office/.env.local
  echo "✅ Clé Geoapify ajoutée dans apps/back-office/.env.local"
else
  echo "⚠️  Clé déjà présente dans apps/back-office/.env.local"
fi

echo ""
echo "🎯 Clé API Geoapify configurée : fdf6b7d7cd334d019f34bef94d53f7ba"
