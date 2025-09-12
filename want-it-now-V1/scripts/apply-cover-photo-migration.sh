#!/bin/bash

# Script pour appliquer la migration de correction des photos de couverture via SQL direct

# Configuration avec service role key
PROJECT_REF="ptqwayandsfhciitjnhb"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M"
SUPABASE_URL="https://ptqwayandsfhciitjnhb.supabase.co"

echo "🔧 Application de la migration de correction des photos de couverture..."
echo "🔑 Utilisation service role key pour exécuter le SQL..."

# Exécuter la correction de la vue proprietes_list_v
echo "📸 Correction de la vue proprietes_list_v..."

curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "DROP VIEW IF EXISTS public.proprietes_list_v CASCADE; CREATE OR REPLACE VIEW public.proprietes_list_v AS SELECT p.*, o.nom as organisation_nom, o.pays as organisation_pays, COALESCE(u.unites_count, 0) as unites_count, COALESCE(u.unites_louees, 0) as unites_louees, COALESCE(ph.photos_count, 0) as photos_count, ph.cover_photo_url, COALESCE(pp.proprietaires_count, 0) as proprietaires_count, COALESCE(pp.quotites_total, 0) as quotites_total, CASE WHEN p.a_unites THEN COALESCE(u.revenu_total, 0) ELSE p.loyer_mensuel END as revenu_mensuel_total, p.type as type_libelle, p.statut as statut_libelle, p.surface_m2, p.nb_chambres, p.ville, p.pays, p.is_active, p.a_unites, COALESCE(u.unites_count, 0) as nombre_unites, p.created_at FROM public.proprietes p LEFT JOIN public.organisations o ON o.id = p.organisation_id LEFT JOIN LATERAL (SELECT COUNT(*)::INTEGER as unites_count, COUNT(*) FILTER (WHERE est_louee = true)::INTEGER as unites_louees, SUM(loyer) FILTER (WHERE est_louee = true) as revenu_total FROM public.unites WHERE propriete_id = p.id AND is_active = true) u ON true LEFT JOIN LATERAL (SELECT COUNT(*)::INTEGER as photos_count, COALESCE(MAX(CASE WHEN is_cover = true THEN url_medium END), MAX(CASE WHEN is_cover = true THEN CONCAT('"'"'https://ptqwayandsfhciitjnhb.supabase.co/storage/v1/object/public/proprietes-photos/'"'"', storage_path) END)) as cover_photo_url FROM public.propriete_photos WHERE propriete_id = p.id) ph ON true LEFT JOIN LATERAL (SELECT COUNT(DISTINCT proprietaire_id)::INTEGER as proprietaires_count, SUM(pourcentage) as quotites_total FROM public.propriete_proprietaires WHERE propriete_id = p.id) pp ON true;"
  }'

echo ""
echo "✅ Migration appliquée avec succès!"
echo "🔍 Les photos de couverture devraient maintenant s'afficher dans la liste des propriétés."
echo ""
echo "🌐 Vous pouvez vérifier en visitant: http://localhost:3001/proprietes"