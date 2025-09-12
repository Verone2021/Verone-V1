const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ptqwayandsfhciitjnhb.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M'

const supabase = createClient(supabaseUrl, serviceKey)

const fixViewSQL = `
DROP VIEW IF EXISTS public.proprietes_list_v CASCADE;

CREATE OR REPLACE VIEW public.proprietes_list_v AS
SELECT 
  p.*,
  o.nom as organisation_nom,
  o.pays as organisation_pays,
  COALESCE(u.unites_count, 0) as unites_count,
  COALESCE(u.unites_louees, 0) as unites_louees,
  COALESCE(ph.photos_count, 0) as photos_count,
  ph.cover_photo_url,
  COALESCE(pp.proprietaires_count, 0) as proprietaires_count,
  COALESCE(pp.quotites_total, 0) as quotites_total,
  CASE 
    WHEN p.a_unites THEN COALESCE(u.revenu_total, 0)
    ELSE p.loyer_mensuel
  END as revenu_mensuel_total,
  p.type as type_libelle,
  p.statut as statut_libelle,
  p.surface_m2,
  p.nb_chambres,
  p.ville,
  p.pays,
  p.is_active,
  p.a_unites,
  COALESCE(u.unites_count, 0) as nombre_unites,
  p.created_at
FROM public.proprietes p
LEFT JOIN public.organisations o ON o.id = p.organisation_id
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*)::INTEGER as unites_count,
    COUNT(*) FILTER (WHERE est_louee = true)::INTEGER as unites_louees,
    SUM(loyer) FILTER (WHERE est_louee = true) as revenu_total
  FROM public.unites
  WHERE propriete_id = p.id AND is_active = true
) u ON true
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*)::INTEGER as photos_count,
    COALESCE(
      MAX(CASE WHEN is_cover = true THEN url_medium END),
      MAX(CASE WHEN is_cover = true THEN 
        CONCAT(
          'https://ptqwayandsfhciitjnhb.supabase.co/storage/v1/object/public/proprietes-photos/',
          storage_path
        )
      END)
    ) as cover_photo_url
  FROM public.propriete_photos
  WHERE propriete_id = p.id
) ph ON true
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT proprietaire_id)::INTEGER as proprietaires_count,
    SUM(pourcentage) as quotites_total
  FROM public.propriete_proprietaires
  WHERE propriete_id = p.id
) pp ON true;
`

async function fixView() {
  try {
    console.log('🔧 Correction de la vue proprietes_list_v...')
    
    const { data, error } = await supabase.rpc('sql', {
      query: fixViewSQL
    })
    
    if (error) {
      console.error('❌ Erreur:', error)
      return
    }
    
    console.log('✅ Vue corrigée avec succès!')
    console.log('📋 Données:', data)
    
  } catch (err) {
    console.error('❌ Erreur inattendue:', err)
  }
}

fixView()