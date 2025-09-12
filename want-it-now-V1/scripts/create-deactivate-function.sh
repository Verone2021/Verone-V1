#!/bin/bash

# Script pour créer la fonction deactivate_proprietaire manquante

# Configuration avec service role key
PROJECT_REF="ptqwayandsfhciitjnhb"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M"
SUPABASE_URL="https://ptqwayandsfhciitjnhb.supabase.co"

echo "🚀 Création de la fonction deactivate_proprietaire manquante..."
echo "🔑 Utilisation service role key..."

# Créer la fonction deactivate_proprietaire
curl -X POST "$SUPABASE_URL/rest/v1/rpc/sql" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d @- << 'EOF'
{
  "query": "CREATE OR REPLACE FUNCTION deactivate_proprietaire(prop_id UUID) RETURNS jsonb AS $$ DECLARE proprietaire_record RECORD; proprietaire_nom TEXT; BEGIN SELECT * INTO proprietaire_record FROM proprietaires WHERE id = prop_id AND is_active = true; IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Propriétaire non trouvé ou déjà inactif', 'message', 'Le propriétaire spécifié n''existe pas ou est déjà archivé'); END IF; proprietaire_nom := CASE WHEN proprietaire_record.type = 'physique' THEN CONCAT(proprietaire_record.prenom, ' ', proprietaire_record.nom) ELSE proprietaire_record.nom END; UPDATE proprietaires SET is_active = false, updated_at = NOW() WHERE id = prop_id; RETURN jsonb_build_object('success', true, 'message', format('Propriétaire \"%s\" archivé avec succès', proprietaire_nom), 'proprietaire_id', prop_id, 'proprietaire_nom', proprietaire_nom, 'archived_at', NOW()); EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', 'Erreur inattendue lors de l''archivage', 'message', SQLERRM); END; $$ LANGUAGE plpgsql SECURITY DEFINER;"
}
EOF

echo ""
echo "✅ Fonction deactivate_proprietaire créée"

# Accorder les permissions
curl -X POST "$SUPABASE_URL/rest/v1/rpc/sql" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "query": "GRANT EXECUTE ON FUNCTION deactivate_proprietaire(UUID) TO authenticated;"
  }'

echo "✅ Permissions accordées à authenticated users"
echo "🎉 Fonction deactivate_proprietaire appliquée avec succès !"
echo ""
echo "🧪 Maintenant les propriétaires archivés devraient apparaître dans la section Archives"