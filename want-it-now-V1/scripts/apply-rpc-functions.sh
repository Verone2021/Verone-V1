#!/bin/bash

# Script pour appliquer les fonctions RPC via Supabase API

# Configuration avec service role key
PROJECT_REF="ptqwayandsfhciitjnhb"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M"
SUPABASE_URL="https://ptqwayandsfhciitjnhb.supabase.co"

echo "🚀 Application des fonctions RPC pour suppression propriétaires..."
echo "🔑 Utilisation service role key..."

# Exécuter le SQL directement via API Supabase
curl -X POST "$SUPABASE_URL/rest/v1/rpc/sql" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "query": "-- Function 1: can_delete_proprietaire\nCREATE OR REPLACE FUNCTION can_delete_proprietaire(prop_id UUID)\nRETURNS BOOLEAN AS $func$\nDECLARE\n    has_properties BOOLEAN := FALSE;\n    has_active_associates BOOLEAN := FALSE;\nBEGIN\n    -- Vérifier si le propriétaire possède des propriétés\n    SELECT EXISTS(\n        SELECT 1 FROM propriete_proprietaires \n        WHERE proprietaire_id = prop_id\n    ) INTO has_properties;\n    \n    -- Vérifier si le propriétaire a des associés actifs\n    SELECT EXISTS(\n        SELECT 1 FROM associes \n        WHERE proprietaire_id = prop_id \n        AND date_sortie IS NULL\n        AND is_active = true\n    ) INTO has_active_associates;\n    \n    -- Ne peut pas supprimer si possède des propriétés ou a des associés actifs\n    RETURN NOT (has_properties OR has_active_associates);\nEND;\n$func$ LANGUAGE plpgsql SECURITY DEFINER;"
  }'

echo "✅ Fonction can_delete_proprietaire créée"

# Function 2: get_proprietaire_deletion_impact
curl -X POST "$SUPABASE_URL/rest/v1/rpc/sql" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "query": "CREATE OR REPLACE FUNCTION get_proprietaire_deletion_impact(prop_id UUID)\nRETURNS jsonb AS $func$\nDECLARE\n    proprietaire_record RECORD;\n    properties_data jsonb := '\''[]'\'';\n    associates_data jsonb := '\''[]'\'';\n    result jsonb;\nBEGIN\n    -- Récupérer les informations du propriétaire\n    SELECT * INTO proprietaire_record\n    FROM proprietaires\n    WHERE id = prop_id AND is_active = true;\n    \n    IF NOT FOUND THEN\n        RETURN jsonb_build_object(\n            '\''error'\'', '\''Propriétaire non trouvé ou inactif'\'',\n            '\''can_delete'\'', false\n        );\n    END IF;\n    \n    -- Récupérer les propriétés\n    SELECT jsonb_agg(\n        jsonb_build_object(\n            '\''propriete_id'\'', p.id,\n            '\''propriete_nom'\'', p.nom,\n            '\''pourcentage'\'', pp.pourcentage\n        )\n    ) INTO properties_data\n    FROM propriete_proprietaires pp\n    JOIN proprietes p ON pp.propriete_id = p.id\n    WHERE pp.proprietaire_id = prop_id\n    AND p.is_active = true;\n    \n    -- Construire le résultat\n    result := jsonb_build_object(\n        '\''proprietaire'\'', jsonb_build_object(\n            '\''id'\'', proprietaire_record.id,\n            '\''nom_complet'\'', CASE \n                WHEN proprietaire_record.type = '\''physique'\'' \n                THEN CONCAT(proprietaire_record.prenom, '\'' '\'', proprietaire_record.nom)\n                ELSE proprietaire_record.nom\n            END,\n            '\''type'\'', proprietaire_record.type\n        ),\n        '\''impact'\'', jsonb_build_object(\n            '\''properties_count'\'', COALESCE(jsonb_array_length(properties_data), 0),\n            '\''properties'\'', COALESCE(properties_data, '\''[]'\'')\n        ),\n        '\''can_delete'\'', can_delete_proprietaire(prop_id)\n    );\n    \n    RETURN result;\nEND;\n$func$ LANGUAGE plpgsql SECURITY DEFINER;"
  }'

echo "✅ Fonction get_proprietaire_deletion_impact créée"

# Function 3: Permissions
curl -X POST "$SUPABASE_URL/rest/v1/rpc/sql" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "query": "GRANT EXECUTE ON FUNCTION can_delete_proprietaire(UUID) TO authenticated; GRANT EXECUTE ON FUNCTION get_proprietaire_deletion_impact(UUID) TO authenticated;"
  }'

echo "✅ Permissions accordées"
echo "🎉 Fonctions RPC appliquées avec succès !"
echo ""
echo "🧪 Test de vérification:"
echo "curl -X POST \"$SUPABASE_URL/rest/v1/rpc/get_proprietaire_deletion_impact\" \\"
echo "  -H \"apikey: $SERVICE_ROLE_KEY\" \\"  
echo "  -H \"Authorization: Bearer $SERVICE_ROLE_KEY\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"prop_id\": \"d0b7af99-cdb4-449c-8398-5d6774f98fb6\"}'"