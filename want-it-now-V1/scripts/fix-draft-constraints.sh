#!/bin/bash

# Script pour corriger les contraintes draft mode
echo "🔧 Correction contraintes mode brouillon..."

# Lire les variables d'environnement
source .env.local

# SQL pour corriger les contraintes
SQL_FIX="
-- Supprimer l'ancienne contrainte stricte
ALTER TABLE proprietaires DROP CONSTRAINT IF EXISTS proprietaires_physique_check;

-- Ajouter nouvelle contrainte qui respecte le mode brouillon
ALTER TABLE proprietaires ADD CONSTRAINT proprietaires_physique_check CHECK (
    type != 'physique' OR is_brouillon = true OR (
        prenom IS NOT NULL AND 
        LENGTH(TRIM(prenom)) > 0 AND
        date_naissance IS NOT NULL AND
        lieu_naissance IS NOT NULL AND
        nationalite IS NOT NULL
    )
);

-- Même logique pour la contrainte personne morale
ALTER TABLE proprietaires DROP CONSTRAINT IF EXISTS proprietaires_morale_check;

ALTER TABLE proprietaires ADD CONSTRAINT proprietaires_morale_check CHECK (
    type != 'morale' OR is_brouillon = true OR (
        forme_juridique IS NOT NULL AND
        numero_identification IS NOT NULL AND
        capital_social IS NOT NULL AND
        nombre_parts_total IS NOT NULL AND
        nombre_parts_total > 0
    )
);
"

# Exécuter via curl avec service role
curl -X POST \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"${SQL_FIX}\"}"

echo "✅ Contraintes mode brouillon mises à jour"