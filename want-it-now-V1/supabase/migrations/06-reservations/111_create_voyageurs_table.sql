-- ============================================================================
-- MIGRATION 111: CREATE VOYAGEURS (CLIENTS) TABLE
-- ============================================================================
-- Table séparée pour les voyageurs/clients avec historique et métriques
-- Préparation pour future authentification et portail client
-- ============================================================================

-- ============================================================================
-- TABLE: voyageurs (clients/locataires)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.voyageurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations personnelles
  nom TEXT NOT NULL,
  prenom TEXT,
  nom_complet TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN prenom IS NOT NULL THEN prenom || ' ' || nom
      ELSE nom
    END
  ) STORED,
  
  -- Contact
  email TEXT UNIQUE,
  telephone TEXT,
  telephone_secondaire TEXT,
  
  -- Adresse
  adresse_ligne1 TEXT,
  adresse_ligne2 TEXT,
  code_postal TEXT,
  ville TEXT,
  pays TEXT DEFAULT 'FR',
  
  -- Profil Airbnb/Booking
  airbnb_user_id TEXT,
  booking_user_id TEXT,
  expedia_user_id TEXT,
  
  -- Évaluation et réputation
  evaluation_moyenne DECIMAL(2,1),
  nombre_evaluations INTEGER DEFAULT 0,
  identite_verifiee BOOLEAN DEFAULT false,
  membre_depuis DATE,
  statut_superhote BOOLEAN DEFAULT false,
  
  -- Métriques (calculées via triggers)
  nombre_reservations INTEGER DEFAULT 0,
  nombre_annulations INTEGER DEFAULT 0,
  total_depense DECIMAL(10,2) DEFAULT 0,
  derniere_reservation DATE,
  
  -- Préférences
  langue_preferee TEXT DEFAULT 'fr',
  newsletter BOOLEAN DEFAULT false,
  preferences JSONB, -- Stockage flexible pour préférences diverses
  
  -- Future authentification
  auth_user_id UUID REFERENCES auth.users(id),
  compte_actif BOOLEAN DEFAULT false,
  date_inscription TIMESTAMPTZ,
  
  -- Notes internes
  notes_internes TEXT,
  tags TEXT[], -- Tags pour segmentation (VIP, Problématique, Fidèle, etc.)
  blackliste BOOLEAN DEFAULT false,
  raison_blacklist TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Contraintes
  CONSTRAINT check_evaluation_range CHECK (
    evaluation_moyenne IS NULL OR 
    (evaluation_moyenne >= 0 AND evaluation_moyenne <= 5)
  ),
  CONSTRAINT check_email_format CHECK (
    email IS NULL OR 
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- ============================================================================
-- MISE À JOUR TABLE RESERVATIONS
-- ============================================================================
-- Ajouter la référence au voyageur
ALTER TABLE public.reservations 
  ADD COLUMN IF NOT EXISTS voyageur_id UUID REFERENCES public.voyageurs(id);

-- Index pour la foreign key
CREATE INDEX IF NOT EXISTS idx_reservations_voyageur 
  ON public.reservations(voyageur_id);

-- ============================================================================
-- FONCTION: Recherche ou création de voyageur
-- ============================================================================
CREATE OR REPLACE FUNCTION find_or_create_voyageur(
  p_nom TEXT,
  p_email TEXT DEFAULT NULL,
  p_telephone TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_voyageur_id UUID;
BEGIN
  -- Recherche par email d'abord (plus fiable)
  IF p_email IS NOT NULL THEN
    SELECT id INTO v_voyageur_id
    FROM voyageurs
    WHERE email = p_email
    LIMIT 1;
    
    IF v_voyageur_id IS NOT NULL THEN
      RETURN v_voyageur_id;
    END IF;
  END IF;
  
  -- Recherche par téléphone
  IF p_telephone IS NOT NULL THEN
    SELECT id INTO v_voyageur_id
    FROM voyageurs
    WHERE telephone = p_telephone
    LIMIT 1;
    
    IF v_voyageur_id IS NOT NULL THEN
      RETURN v_voyageur_id;
    END IF;
  END IF;
  
  -- Recherche par nom exact (moins fiable)
  IF p_nom IS NOT NULL THEN
    SELECT id INTO v_voyageur_id
    FROM voyageurs
    WHERE nom = p_nom
    AND (p_telephone IS NULL OR telephone = p_telephone)
    LIMIT 1;
    
    IF v_voyageur_id IS NOT NULL THEN
      RETURN v_voyageur_id;
    END IF;
  END IF;
  
  -- Créer nouveau voyageur si non trouvé
  INSERT INTO voyageurs (nom, email, telephone)
  VALUES (p_nom, p_email, p_telephone)
  RETURNING id INTO v_voyageur_id;
  
  RETURN v_voyageur_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Mise à jour métriques voyageur
-- ============================================================================
CREATE OR REPLACE FUNCTION update_voyageur_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Mise à jour lors d'une nouvelle réservation
  IF TG_OP = 'INSERT' AND NEW.voyageur_id IS NOT NULL THEN
    UPDATE voyageurs
    SET 
      nombre_reservations = nombre_reservations + 1,
      derniere_reservation = NEW.date_reservation,
      total_depense = total_depense + COALESCE(NEW.total_voyageur, 0),
      updated_at = NOW()
    WHERE id = NEW.voyageur_id;
  END IF;
  
  -- Mise à jour lors d'une annulation
  IF TG_OP = 'UPDATE' AND 
     OLD.statut != 'annulee' AND 
     NEW.statut = 'annulee' AND 
     NEW.voyageur_id IS NOT NULL THEN
    UPDATE voyageurs
    SET 
      nombre_annulations = nombre_annulations + 1,
      updated_at = NOW()
    WHERE id = NEW.voyageur_id;
  END IF;
  
  -- Mise à jour de l'évaluation si fournie
  IF TG_OP = 'UPDATE' AND 
     NEW.voyageur_evaluation IS NOT NULL AND
     NEW.voyageur_id IS NOT NULL THEN
    UPDATE voyageurs
    SET 
      evaluation_moyenne = (
        SELECT AVG(voyageur_evaluation)
        FROM reservations
        WHERE voyageur_id = NEW.voyageur_id
        AND voyageur_evaluation IS NOT NULL
      ),
      nombre_evaluations = (
        SELECT COUNT(*)
        FROM reservations
        WHERE voyageur_id = NEW.voyageur_id
        AND voyageur_evaluation IS NOT NULL
      ),
      updated_at = NOW()
    WHERE id = NEW.voyageur_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_voyageur_metrics
  AFTER INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_voyageur_metrics();

-- ============================================================================
-- TRIGGER: Liaison automatique voyageur lors de création réservation
-- ============================================================================
CREATE OR REPLACE FUNCTION link_voyageur_to_reservation()
RETURNS TRIGGER AS $$
DECLARE
  v_voyageur_id UUID;
BEGIN
  -- Si voyageur_id déjà fourni, ne rien faire
  IF NEW.voyageur_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Trouver ou créer le voyageur
  v_voyageur_id := find_or_create_voyageur(
    NEW.voyageur_nom,
    NEW.voyageur_email,
    NEW.voyageur_telephone,
    NEW.source_reservation::TEXT
  );
  
  NEW.voyageur_id := v_voyageur_id;
  
  -- Mettre à jour les infos du voyageur si nouvelles données
  UPDATE voyageurs
  SET
    email = COALESCE(email, NEW.voyageur_email),
    telephone = COALESCE(telephone, NEW.voyageur_telephone),
    pays = COALESCE(pays, NEW.voyageur_pays),
    ville = COALESCE(ville, NEW.voyageur_ville),
    identite_verifiee = COALESCE(identite_verifiee, NEW.voyageur_identite_verifiee),
    evaluation_moyenne = COALESCE(evaluation_moyenne, NEW.voyageur_evaluation),
    membre_depuis = COALESCE(membre_depuis, NEW.voyageur_membre_depuis),
    updated_at = NOW()
  WHERE id = v_voyageur_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_link_voyageur
  BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION link_voyageur_to_reservation();

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- Vue des meilleurs clients
CREATE OR REPLACE VIEW v_top_voyageurs AS
SELECT 
  v.*,
  COUNT(r.id) as reservations_12_mois,
  SUM(r.total_voyageur) as depense_12_mois,
  AVG(r.nombre_nuits) as duree_moyenne_sejour,
  MAX(r.date_arrivee) as prochaine_arrivee
FROM voyageurs v
LEFT JOIN reservations r ON v.id = r.voyageur_id
  AND r.date_reservation >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY v.id
ORDER BY depense_12_mois DESC NULLS LAST;

-- Vue des voyageurs à risque
CREATE OR REPLACE VIEW v_voyageurs_risque AS
SELECT 
  v.*,
  (v.nombre_annulations::FLOAT / NULLIF(v.nombre_reservations, 0) * 100) as taux_annulation
FROM voyageurs v
WHERE 
  v.blackliste = true OR
  v.evaluation_moyenne < 3.0 OR
  (v.nombre_annulations::FLOAT / NULLIF(v.nombre_reservations, 0)) > 0.3;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_voyageurs_email ON public.voyageurs(email) WHERE email IS NOT NULL;
CREATE INDEX idx_voyageurs_telephone ON public.voyageurs(telephone) WHERE telephone IS NOT NULL;
CREATE INDEX idx_voyageurs_nom ON public.voyageurs(nom);
CREATE INDEX idx_voyageurs_auth_user ON public.voyageurs(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_voyageurs_airbnb_id ON public.voyageurs(airbnb_user_id) WHERE airbnb_user_id IS NOT NULL;
CREATE INDEX idx_voyageurs_booking_id ON public.voyageurs(booking_user_id) WHERE booking_user_id IS NOT NULL;
CREATE INDEX idx_voyageurs_blackliste ON public.voyageurs(blackliste) WHERE blackliste = true;
CREATE INDEX idx_voyageurs_tags ON public.voyageurs USING GIN(tags) WHERE tags IS NOT NULL;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE public.voyageurs ENABLE ROW LEVEL SECURITY;

-- Policy : Lecture pour utilisateurs authentifiés
CREATE POLICY "voyageurs_read_authenticated" ON public.voyageurs
  FOR SELECT TO authenticated
  USING (true);

-- Policy : Modification par organisation
CREATE POLICY "voyageurs_write_organisation" ON public.voyageurs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_organisation_assignments uoa
      WHERE uoa.user_id = auth.uid()
    )
  );

CREATE POLICY "voyageurs_update_organisation" ON public.voyageurs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN user_organisation_assignments uoa ON r.organisation_id = uoa.organisation_id
      WHERE r.voyageur_id = voyageurs.id
      AND uoa.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour obtenir les statistiques d'un voyageur
CREATE OR REPLACE FUNCTION get_voyageur_stats(p_voyageur_id UUID)
RETURNS TABLE (
  total_reservations BIGINT,
  total_nuits BIGINT,
  total_depense NUMERIC,
  premiere_reservation DATE,
  derniere_reservation DATE,
  proprietes_visitees BIGINT,
  taux_annulation NUMERIC,
  duree_moyenne_sejour NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(r.id) as total_reservations,
    SUM(r.nombre_nuits) as total_nuits,
    SUM(r.total_voyageur) as total_depense,
    MIN(r.date_reservation)::DATE as premiere_reservation,
    MAX(r.date_reservation)::DATE as derniere_reservation,
    COUNT(DISTINCT COALESCE(r.propriete_id, r.unite_id)) as proprietes_visitees,
    ROUND(
      COUNT(CASE WHEN r.statut = 'annulee' THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(r.id), 0) * 100, 
      2
    ) as taux_annulation,
    ROUND(AVG(r.nombre_nuits), 1) as duree_moyenne_sejour
  FROM reservations r
  WHERE r.voyageur_id = p_voyageur_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION DES DONNÉES EXISTANTES
-- ============================================================================
-- Créer les voyageurs depuis les réservations existantes
DO $$
DECLARE
  r RECORD;
  v_id UUID;
BEGIN
  FOR r IN 
    SELECT DISTINCT ON (voyageur_nom, voyageur_telephone, voyageur_email)
      voyageur_nom,
      voyageur_prenom,
      voyageur_email,
      voyageur_telephone,
      voyageur_pays,
      voyageur_ville,
      voyageur_identite_verifiee,
      voyageur_evaluation,
      voyageur_nb_commentaires,
      voyageur_membre_depuis
    FROM reservations
    WHERE voyageur_id IS NULL
    AND voyageur_nom IS NOT NULL
  LOOP
    -- Créer ou trouver le voyageur
    v_id := find_or_create_voyageur(
      r.voyageur_nom,
      r.voyageur_email,
      r.voyageur_telephone
    );
    
    -- Mettre à jour avec les infos complètes
    UPDATE voyageurs
    SET
      prenom = COALESCE(prenom, r.voyageur_prenom),
      pays = COALESCE(pays, r.voyageur_pays),
      ville = COALESCE(ville, r.voyageur_ville),
      identite_verifiee = COALESCE(identite_verifiee, r.voyageur_identite_verifiee),
      evaluation_moyenne = COALESCE(evaluation_moyenne, r.voyageur_evaluation),
      nombre_evaluations = COALESCE(nombre_evaluations, r.voyageur_nb_commentaires),
      membre_depuis = COALESCE(membre_depuis, r.voyageur_membre_depuis)
    WHERE id = v_id;
    
    -- Lier les réservations existantes
    UPDATE reservations
    SET voyageur_id = v_id
    WHERE voyageur_nom = r.voyageur_nom
    AND (voyageur_telephone = r.voyageur_telephone OR voyageur_email = r.voyageur_email)
    AND voyageur_id IS NULL;
  END LOOP;
END $$;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON TABLE public.voyageurs IS 'Table des voyageurs/clients avec historique et métriques';
COMMENT ON COLUMN public.voyageurs.auth_user_id IS 'Future lien avec authentification pour portail client';
COMMENT ON COLUMN public.voyageurs.tags IS 'Tags pour segmentation marketing (VIP, Fidèle, etc.)';
COMMENT ON COLUMN public.voyageurs.preferences IS 'Stockage flexible JSON pour préférences diverses';

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================