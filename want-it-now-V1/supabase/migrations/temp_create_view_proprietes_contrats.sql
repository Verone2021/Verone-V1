-- Migration temporaire pour créer la view manquante
-- View v_proprietes_avec_contrats_actifs pour le système de réservations

-- Supprimer la vue si elle existe déjà
DROP VIEW IF EXISTS public.v_proprietes_avec_contrats_actifs;

-- Créer la vue de base avec les propriétés existantes
-- Pour l'instant, on simule les contrats actifs pour toutes les propriétés
CREATE VIEW public.v_proprietes_avec_contrats_actifs AS
SELECT DISTINCT
    p.id as propriete_id,
    p.nom as propriete_nom,
    p.type_propriete as type_propriete,
    p.adresse_ligne1 as adresse,
    p.ville,
    p.code_postal,
    p.pays,
    p.superficie_m2,
    p.nb_pieces,
    p.a_unites,
    p.organisation_id,
    o.nom as organisation_nom,
    
    -- Données simulées pour contrats (temporaire)
    'actif'::text as statut_contrat,
    'fixe'::text as type_contrat,
    15.0::decimal as commission_pourcentage,
    CURRENT_DATE as date_debut_contrat,
    (CURRENT_DATE + interval '1 year')::date as date_fin_contrat,
    800.00::decimal as loyer_mensuel_ht,
    
    -- Métadonnées
    p.created_at,
    p.updated_at
    
FROM public.proprietes p
LEFT JOIN public.organisations o ON o.id = p.organisation_id
WHERE p.is_active = true
  AND p.deleted_at IS NULL;

-- Permissions sur la vue
GRANT SELECT ON public.v_proprietes_avec_contrats_actifs TO authenticated;
GRANT SELECT ON public.v_proprietes_avec_contrats_actifs TO service_role;

-- Créer des indexes pour performance
CREATE INDEX IF NOT EXISTS idx_v_proprietes_contrats_organisation 
ON public.proprietes(organisation_id) 
WHERE is_active = true AND deleted_at IS NULL;

COMMENT ON VIEW public.v_proprietes_avec_contrats_actifs IS 
'View temporaire pour afficher les propriétés avec contrats actifs simulés - Want It Now V1';

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ VIEW TEMPORAIRE CRÉÉE: v_proprietes_avec_contrats_actifs';
  RAISE NOTICE '⚠️  ATTENTION: Cette view simule des contrats actifs pour toutes les propriétés';
  RAISE NOTICE '🔄 À remplacer par une vraie jointure avec table contrats plus tard';
END $$;