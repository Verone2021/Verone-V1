-- ============================================================================
-- MIGRATION 113: FIX RESERVATIONS - REMOVE CONTRAT_ID
-- ============================================================================
-- Correction: Les réservations ne doivent PAS avoir de contrat_id
-- Le contrat est déjà lié à la propriété dans la table contrats
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: SUPPRIMER LES ÉLÉMENTS LIÉS À CONTRAT_ID
-- ============================================================================

-- Supprimer l'index sur contrat_id
DROP INDEX IF EXISTS public.idx_reservations_contrat;

-- Supprimer le trigger de validation contrat actif
DROP TRIGGER IF EXISTS trg_validate_contrat_actif ON public.reservations;
DROP FUNCTION IF EXISTS validate_contrat_actif_reservation();

-- Supprimer la colonne contrat_id de la table reservations
ALTER TABLE public.reservations 
DROP COLUMN IF EXISTS contrat_id;

-- ============================================================================
-- ÉTAPE 2: CRÉER TABLE PRIX DYNAMIQUES
-- ============================================================================

-- Table pour gérer les prix par nuit/période (style Airbnb)
CREATE TABLE IF NOT EXISTS public.prix_dynamiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Liens propriété/unité (XOR)
  propriete_id UUID REFERENCES public.proprietes(id) ON DELETE CASCADE,
  unite_id UUID REFERENCES public.unites(id) ON DELETE CASCADE,
  
  -- Période et prix
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  prix_nuit DECIMAL(10,2) NOT NULL,
  prix_weekend DECIMAL(10,2), -- Prix spécial weekend (vendredi/samedi)
  prix_semaine DECIMAL(10,2), -- Prix pour 7+ nuits
  prix_mois DECIMAL(10,2), -- Prix pour 28+ nuits
  
  -- Règles de séjour
  sejour_minimum INTEGER DEFAULT 1,
  sejour_maximum INTEGER,
  arrivee_autorisee_jours INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=dimanche, 6=samedi
  depart_autorise_jours INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  
  -- Frais additionnels
  frais_menage DECIMAL(10,2) DEFAULT 0,
  frais_service_pourcentage DECIMAL(5,2) DEFAULT 0,
  taxe_sejour_par_nuit DECIMAL(10,2) DEFAULT 0,
  
  -- Métadonnées
  nom_periode TEXT, -- Ex: "Haute saison", "Vacances Noël"
  couleur_calendrier TEXT DEFAULT '#D4841A', -- Pour affichage visuel
  priorite INTEGER DEFAULT 0, -- Pour gérer les chevauchements
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Contraintes
  CONSTRAINT check_property_or_unit_prix CHECK (
    (propriete_id IS NOT NULL AND unite_id IS NULL) OR
    (propriete_id IS NULL AND unite_id IS NOT NULL)
  ),
  CONSTRAINT check_dates_coherent_prix CHECK (date_fin >= date_debut),
  CONSTRAINT check_prix_positif CHECK (
    prix_nuit > 0 AND
    (prix_weekend IS NULL OR prix_weekend > 0) AND
    (prix_semaine IS NULL OR prix_semaine > 0) AND
    (prix_mois IS NULL OR prix_mois > 0)
  ),
  CONSTRAINT check_sejour_coherent CHECK (
    sejour_minimum >= 1 AND
    (sejour_maximum IS NULL OR sejour_maximum >= sejour_minimum)
  )
);

-- Index pour performance
CREATE INDEX idx_prix_dynamiques_propriete_dates 
ON public.prix_dynamiques(propriete_id, date_debut, date_fin) 
WHERE propriete_id IS NOT NULL;

CREATE INDEX idx_prix_dynamiques_unite_dates 
ON public.prix_dynamiques(unite_id, date_debut, date_fin) 
WHERE unite_id IS NOT NULL;

CREATE INDEX idx_prix_dynamiques_priorite 
ON public.prix_dynamiques(priorite DESC);

-- ============================================================================
-- ÉTAPE 3: CRÉER VUE PROPRIÉTÉS AVEC CONTRATS ACTIFS
-- ============================================================================

-- Vue pour afficher uniquement les propriétés/unités avec contrats actifs
CREATE OR REPLACE VIEW public.v_proprietes_avec_contrats_actifs AS
SELECT DISTINCT
  p.id as propriete_id,
  p.nom as propriete_nom,
  p.adresse,
  p.ville,
  p.code_postal,
  p.pays,
  p.type as propriete_type,
  p.superficie_m2,
  p.nb_pieces,
  p.a_unites,
  p.organisation_id,
  o.nom as organisation_nom,
  c.id as contrat_id,
  c.type_contrat,
  c.date_debut as contrat_date_debut,
  c.date_fin as contrat_date_fin,
  c.commission_pourcentage,
  c.usage_proprietaire_jours_max,
  -- Prix par défaut (peut être overridé par prix_dynamiques)
  COALESCE(c.loyer_mensuel_fixe / 30, c.prix_nuit_base, 100) as prix_nuit_defaut,
  -- Photos
  (SELECT url FROM public.photos_proprietes 
   WHERE propriete_id = p.id AND is_cover = true 
   LIMIT 1) as photo_cover,
  -- Statistiques
  (SELECT COUNT(*) FROM public.reservations r 
   WHERE r.propriete_id = p.id 
   AND r.statut IN ('confirmee', 'en_cours')) as nb_reservations_actives,
  -- Disponibilité aujourd'hui
  NOT EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.propriete_id = p.id
    AND CURRENT_DATE BETWEEN r.date_arrivee AND r.date_depart - INTERVAL '1 day'
    AND r.statut IN ('confirmee', 'en_cours')
  ) as disponible_aujourdhui
FROM public.proprietes p
INNER JOIN public.contrats c ON c.propriete_id = p.id
INNER JOIN public.organisations o ON p.organisation_id = o.id
WHERE c.date_debut <= CURRENT_DATE
  AND c.date_fin >= CURRENT_DATE
  AND p.is_active = true
  AND NOT p.a_unites -- Propriétés sans unités

UNION ALL

-- Unités avec contrats actifs
SELECT DISTINCT
  u.id as propriete_id, -- On utilise l'ID de l'unité comme "propriete_id" pour simplifier
  CONCAT(p.nom, ' - ', u.nom) as propriete_nom,
  p.adresse,
  p.ville,
  p.code_postal,
  p.pays,
  u.type as propriete_type,
  u.superficie_m2,
  u.nb_pieces,
  false as a_unites, -- Les unités n'ont pas de sous-unités
  p.organisation_id,
  o.nom as organisation_nom,
  c.id as contrat_id,
  c.type_contrat,
  c.date_debut as contrat_date_debut,
  c.date_fin as contrat_date_fin,
  c.commission_pourcentage,
  c.usage_proprietaire_jours_max,
  COALESCE(c.loyer_mensuel_fixe / 30, c.prix_nuit_base, 100) as prix_nuit_defaut,
  -- Photos
  COALESCE(
    (SELECT url FROM public.photos_unites WHERE unite_id = u.id AND is_cover = true LIMIT 1),
    (SELECT url FROM public.photos_proprietes WHERE propriete_id = p.id AND is_cover = true LIMIT 1)
  ) as photo_cover,
  -- Statistiques
  (SELECT COUNT(*) FROM public.reservations r 
   WHERE r.unite_id = u.id 
   AND r.statut IN ('confirmee', 'en_cours')) as nb_reservations_actives,
  -- Disponibilité aujourd'hui
  NOT EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.unite_id = u.id
    AND CURRENT_DATE BETWEEN r.date_arrivee AND r.date_depart - INTERVAL '1 day'
    AND r.statut IN ('confirmee', 'en_cours')
  ) as disponible_aujourdhui
FROM public.unites u
INNER JOIN public.proprietes p ON u.propriete_id = p.id
INNER JOIN public.contrats c ON c.unite_id = u.id
INNER JOIN public.organisations o ON p.organisation_id = o.id
WHERE c.date_debut <= CURRENT_DATE
  AND c.date_fin >= CURRENT_DATE
  AND p.is_active = true
  AND u.is_active = true;

-- ============================================================================
-- ÉTAPE 4: FONCTION POUR OBTENIR LE CONTRAT ACTIF D'UNE PROPRIÉTÉ/UNITÉ
-- ============================================================================

CREATE OR REPLACE FUNCTION get_contrat_actif(
  p_propriete_id UUID DEFAULT NULL,
  p_unite_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_contrat_id UUID;
BEGIN
  -- Validation XOR
  IF (p_propriete_id IS NULL AND p_unite_id IS NULL) OR 
     (p_propriete_id IS NOT NULL AND p_unite_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Doit spécifier soit propriete_id soit unite_id, pas les deux';
  END IF;
  
  -- Chercher contrat actif
  IF p_propriete_id IS NOT NULL THEN
    SELECT id INTO v_contrat_id
    FROM public.contrats
    WHERE propriete_id = p_propriete_id
      AND date_debut <= CURRENT_DATE
      AND date_fin >= CURRENT_DATE
    ORDER BY date_debut DESC
    LIMIT 1;
  ELSE
    SELECT id INTO v_contrat_id
    FROM public.contrats
    WHERE unite_id = p_unite_id
      AND date_debut <= CURRENT_DATE
      AND date_fin >= CURRENT_DATE
    ORDER BY date_debut DESC
    LIMIT 1;
  END IF;
  
  RETURN v_contrat_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÉTAPE 5: FONCTION POUR CALCULER LE PRIX D'UNE NUIT
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_prix_nuit(
  p_propriete_id UUID DEFAULT NULL,
  p_unite_id UUID DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE,
  p_nb_nuits INTEGER DEFAULT 1
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_prix DECIMAL(10,2);
  v_jour_semaine INTEGER;
BEGIN
  -- Obtenir le jour de la semaine (0=dimanche, 6=samedi)
  v_jour_semaine := EXTRACT(DOW FROM p_date);
  
  -- Chercher prix dynamique pour cette date
  IF p_propriete_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN v_jour_semaine IN (5, 6) AND prix_weekend IS NOT NULL THEN prix_weekend
        WHEN p_nb_nuits >= 28 AND prix_mois IS NOT NULL THEN prix_mois / 30
        WHEN p_nb_nuits >= 7 AND prix_semaine IS NOT NULL THEN prix_semaine / 7
        ELSE prix_nuit
      END INTO v_prix
    FROM public.prix_dynamiques
    WHERE propriete_id = p_propriete_id
      AND p_date BETWEEN date_debut AND date_fin
    ORDER BY priorite DESC, created_at DESC
    LIMIT 1;
  ELSE
    SELECT 
      CASE 
        WHEN v_jour_semaine IN (5, 6) AND prix_weekend IS NOT NULL THEN prix_weekend
        WHEN p_nb_nuits >= 28 AND prix_mois IS NOT NULL THEN prix_mois / 30
        WHEN p_nb_nuits >= 7 AND prix_semaine IS NOT NULL THEN prix_semaine / 7
        ELSE prix_nuit
      END INTO v_prix
    FROM public.prix_dynamiques
    WHERE unite_id = p_unite_id
      AND p_date BETWEEN date_debut AND date_fin
    ORDER BY priorite DESC, created_at DESC
    LIMIT 1;
  END IF;
  
  -- Si pas de prix dynamique, utiliser prix par défaut du contrat
  IF v_prix IS NULL THEN
    SELECT prix_nuit_defaut INTO v_prix
    FROM public.v_proprietes_avec_contrats_actifs
    WHERE propriete_id = COALESCE(p_propriete_id, p_unite_id);
  END IF;
  
  -- Prix par défaut si toujours null
  RETURN COALESCE(v_prix, 100.00);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÉTAPE 6: TRIGGER POUR AUTO-ASSIGNER ORGANISATION_ID DANS RESERVATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_assign_reservation_organisation()
RETURNS TRIGGER AS $$
BEGIN
  -- Si organisation_id n'est pas fourni, le déduire de la propriété/unité
  IF NEW.organisation_id IS NULL THEN
    IF NEW.propriete_id IS NOT NULL THEN
      SELECT organisation_id INTO NEW.organisation_id
      FROM public.proprietes
      WHERE id = NEW.propriete_id;
    ELSIF NEW.unite_id IS NOT NULL THEN
      SELECT p.organisation_id INTO NEW.organisation_id
      FROM public.unites u
      JOIN public.proprietes p ON u.propriete_id = p.id
      WHERE u.id = NEW.unite_id;
    END IF;
  END IF;
  
  -- Vérifier qu'un contrat actif existe pour cette propriété/unité
  IF NOT EXISTS (
    SELECT 1 FROM public.v_proprietes_avec_contrats_actifs
    WHERE propriete_id = COALESCE(NEW.propriete_id, NEW.unite_id)
  ) THEN
    RAISE EXCEPTION 'Aucun contrat actif pour cette propriété/unité';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_assign_reservation_organisation ON public.reservations;
CREATE TRIGGER trg_auto_assign_reservation_organisation
  BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION auto_assign_reservation_organisation();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.prix_dynamiques IS 
  'Gestion des prix par période pour les propriétés/unités (style Airbnb)';
  
COMMENT ON VIEW public.v_proprietes_avec_contrats_actifs IS 
  'Vue des propriétés et unités ayant un contrat actif, utilisée pour les réservations';

COMMENT ON FUNCTION get_contrat_actif IS 
  'Retourne l''ID du contrat actif pour une propriété ou unité donnée';

COMMENT ON FUNCTION calculate_prix_nuit IS 
  'Calcule le prix par nuit en tenant compte des prix dynamiques et règles spéciales';

-- ============================================================================
-- FIN MIGRATION 113
-- ============================================================================