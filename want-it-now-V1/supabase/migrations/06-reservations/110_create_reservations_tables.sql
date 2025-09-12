-- ============================================================================
-- MIGRATION 110: CREATE RESERVATIONS TABLES
-- ============================================================================
-- Tables principales pour le système de réservation channel manager
-- Support multi-plateformes (Airbnb, Booking, Direct, etc.)
-- ============================================================================

-- ============================================================================
-- TABLE: reservations (principale)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Liens avec contrats et propriétés
  contrat_id UUID REFERENCES public.contrats(id) NOT NULL,
  propriete_id UUID REFERENCES public.proprietes(id),
  unite_id UUID REFERENCES public.unites(id),
  organisation_id UUID REFERENCES public.organisations(id) NOT NULL,
  
  -- Informations voyageur
  voyageur_nom TEXT NOT NULL,
  voyageur_prenom TEXT,
  voyageur_email TEXT,
  voyageur_telephone TEXT,
  voyageur_pays TEXT,
  voyageur_ville TEXT,
  voyageur_adresse TEXT,
  voyageur_identite_verifiee BOOLEAN DEFAULT false,
  voyageur_evaluation DECIMAL(2,1),
  voyageur_nb_commentaires INTEGER,
  voyageur_membre_depuis DATE,
  
  -- Dates et statut
  date_arrivee DATE NOT NULL,
  date_depart DATE NOT NULL,
  nombre_nuits INTEGER GENERATED ALWAYS AS (date_depart - date_arrivee) STORED,
  date_reservation TIMESTAMPTZ DEFAULT NOW(),
  statut TEXT NOT NULL DEFAULT 'confirmee',
  code_confirmation TEXT UNIQUE,
  source_reservation TEXT NOT NULL DEFAULT 'direct',
  source_reference TEXT, -- ID externe Airbnb/Booking
  
  -- Détails de la réservation
  nombre_adultes INTEGER DEFAULT 1,
  nombre_enfants INTEGER DEFAULT 0,
  nombre_bebes INTEGER DEFAULT 0,
  nombre_animaux INTEGER DEFAULT 0,
  conditions_annulation TEXT,
  
  -- Financier (côté voyageur)
  prix_nuit DECIMAL(10,2),
  sous_total_nuits DECIMAL(10,2),
  frais_menage DECIMAL(10,2) DEFAULT 0,
  frais_service_voyageur DECIMAL(10,2) DEFAULT 0,
  taxes_sejour DECIMAL(10,2) DEFAULT 0,
  total_voyageur DECIMAL(10,2),
  devise TEXT DEFAULT 'EUR',
  
  -- Financier (côté hôte)
  frais_service_hote DECIMAL(10,2) DEFAULT 0,
  frais_service_hote_taux DECIMAL(5,2),
  tva_frais_service DECIMAL(10,2) DEFAULT 0,
  total_hote_brut DECIMAL(10,2),
  total_hote_net DECIMAL(10,2),
  commission_plateforme_total DECIMAL(10,2),
  
  -- Notes et métadonnées
  notes_internes TEXT,
  notes_calendrier TEXT,
  special_requests TEXT,
  documents JSONB,
  metadata JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Contraintes
  CONSTRAINT check_property_or_unit_exclusive_reservations CHECK (
    (propriete_id IS NOT NULL AND unite_id IS NULL) OR
    (propriete_id IS NULL AND unite_id IS NOT NULL)
  ),
  CONSTRAINT check_dates_coherent CHECK (date_depart > date_arrivee),
  CONSTRAINT check_guests_positive CHECK (
    nombre_adultes >= 0 AND 
    nombre_enfants >= 0 AND 
    nombre_bebes >= 0 AND 
    nombre_animaux >= 0
  )
);

-- ============================================================================
-- ENUMS pour statuts et sources
-- ============================================================================
CREATE TYPE reservation_statut AS ENUM (
  'confirmee',
  'en_attente',
  'annulee',
  'completee',
  'en_cours'
);

CREATE TYPE source_reservation AS ENUM (
  'airbnb',
  'booking',
  'expedia',
  'direct',
  'autre'
);

-- Mise à jour des colonnes avec les enums
ALTER TABLE public.reservations 
  ALTER COLUMN statut TYPE reservation_statut USING statut::reservation_statut,
  ALTER COLUMN source_reservation TYPE source_reservation USING source_reservation::source_reservation;

-- ============================================================================
-- TABLE: calendrier_disponibilites
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendrier_disponibilites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id UUID REFERENCES public.proprietes(id),
  unite_id UUID REFERENCES public.unites(id),
  date DATE NOT NULL,
  statut TEXT NOT NULL DEFAULT 'disponible',
  prix_custom DECIMAL(10,2),
  prix_minimum DECIMAL(10,2),
  sejour_minimum INTEGER DEFAULT 1,
  reservation_id UUID REFERENCES public.reservations(id),
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT check_property_or_unit_calendar CHECK (
    (propriete_id IS NOT NULL AND unite_id IS NULL) OR
    (propriete_id IS NULL AND unite_id IS NOT NULL)
  ),
  CONSTRAINT unique_date_property_unit UNIQUE (propriete_id, unite_id, date)
);

-- Enum pour statut calendrier
CREATE TYPE calendrier_statut AS ENUM (
  'disponible',
  'indisponible',
  'reserve',
  'bloque',
  'maintenance'
);

ALTER TABLE public.calendrier_disponibilites 
  ALTER COLUMN statut TYPE calendrier_statut USING statut::calendrier_statut;

-- ============================================================================
-- TABLE: commissions_plateformes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.commissions_plateformes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plateforme source_reservation NOT NULL,
  type_commission TEXT NOT NULL,
  taux_voyageur DECIMAL(5,2),
  taux_hote DECIMAL(5,2),
  taux_tva DECIMAL(5,2) DEFAULT 20.00,
  frais_fixes DECIMAL(10,2),
  actif BOOLEAN DEFAULT true,
  date_debut DATE DEFAULT CURRENT_DATE,
  date_fin DATE,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enum pour type commission
CREATE TYPE type_commission AS ENUM (
  'voyageur',
  'hote',
  'mixte'
);

ALTER TABLE public.commissions_plateformes 
  ALTER COLUMN type_commission TYPE type_commission USING type_commission::type_commission;

-- ============================================================================
-- TABLE: paiements_reservations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.paiements_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) NOT NULL,
  type_paiement TEXT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  date_paiement DATE,
  date_reception DATE,
  methode_paiement TEXT,
  reference_transaction TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enums pour paiements
CREATE TYPE type_paiement AS ENUM (
  'acompte',
  'solde',
  'remboursement',
  'commission',
  'taxe'
);

CREATE TYPE statut_paiement AS ENUM (
  'en_attente',
  'recu',
  'echoue',
  'annule',
  'rembourse'
);

ALTER TABLE public.paiements_reservations 
  ALTER COLUMN type_paiement TYPE type_paiement USING type_paiement::type_paiement,
  ALTER COLUMN statut TYPE statut_paiement USING statut::statut_paiement;

-- ============================================================================
-- TABLE: import_history (pour traçabilité imports CSV)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_import TEXT NOT NULL,
  fichier_nom TEXT,
  date_import TIMESTAMPTZ DEFAULT NOW(),
  nombre_lignes INTEGER,
  nombre_succes INTEGER,
  nombre_erreurs INTEGER,
  erreurs_detail JSONB,
  mapping_colonnes JSONB,
  user_id UUID REFERENCES auth.users(id),
  organisation_id UUID REFERENCES public.organisations(id)
);

-- Enum pour type import
CREATE TYPE type_import AS ENUM (
  'csv_airbnb',
  'csv_booking',
  'csv_expedia',
  'api',
  'manuel'
);

ALTER TABLE public.import_history 
  ALTER COLUMN type_import TYPE type_import USING type_import::type_import;

-- ============================================================================
-- INDEXES pour performance
-- ============================================================================
CREATE INDEX idx_reservations_contrat ON public.reservations(contrat_id);
CREATE INDEX idx_reservations_propriete ON public.reservations(propriete_id) WHERE propriete_id IS NOT NULL;
CREATE INDEX idx_reservations_unite ON public.reservations(unite_id) WHERE unite_id IS NOT NULL;
CREATE INDEX idx_reservations_organisation ON public.reservations(organisation_id);
CREATE INDEX idx_reservations_dates ON public.reservations(date_arrivee, date_depart);
CREATE INDEX idx_reservations_statut ON public.reservations(statut);
CREATE INDEX idx_reservations_source ON public.reservations(source_reservation);
CREATE INDEX idx_reservations_confirmation ON public.reservations(code_confirmation);

CREATE INDEX idx_calendrier_propriete_date ON public.calendrier_disponibilites(propriete_id, date) WHERE propriete_id IS NOT NULL;
CREATE INDEX idx_calendrier_unite_date ON public.calendrier_disponibilites(unite_id, date) WHERE unite_id IS NOT NULL;
CREATE INDEX idx_calendrier_statut ON public.calendrier_disponibilites(statut);

CREATE INDEX idx_paiements_reservation ON public.paiements_reservations(reservation_id);
CREATE INDEX idx_paiements_statut ON public.paiements_reservations(statut);

-- ============================================================================
-- MISE À JOUR TABLE CONTRATS : Ajout organisation propriétaire
-- ============================================================================
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS organisation_proprietaire_id UUID REFERENCES public.organisations(id);
COMMENT ON COLUMN public.contrats.organisation_proprietaire_id IS 'Organisation qui gère le contrat (selon pays du bien)';

-- ============================================================================
-- TRIGGERS pour validation business
-- ============================================================================

-- Trigger validation contrat actif
CREATE OR REPLACE FUNCTION validate_contrat_actif_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier qu'un contrat actif existe
  IF NOT EXISTS (
    SELECT 1 FROM contrats c
    WHERE c.id = NEW.contrat_id
    AND c.statut = 'actif'
    AND CURRENT_DATE BETWEEN c.date_debut AND COALESCE(c.date_fin, '9999-12-31'::DATE)
  ) THEN
    RAISE EXCEPTION 'Aucun contrat actif pour cette propriété/unité';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_contrat_actif
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION validate_contrat_actif_reservation();

-- Trigger validation disponibilité
CREATE OR REPLACE FUNCTION check_disponibilite_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier qu'aucune réservation confirmée n'existe sur ces dates
  IF EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.id != COALESCE(NEW.id, gen_random_uuid())
    AND r.statut = 'confirmee'
    AND (
      (NEW.propriete_id IS NOT NULL AND r.propriete_id = NEW.propriete_id) OR
      (NEW.unite_id IS NOT NULL AND r.unite_id = NEW.unite_id)
    )
    AND daterange(NEW.date_arrivee, NEW.date_depart, '[)') && 
        daterange(r.date_arrivee, r.date_depart, '[)')
  ) THEN
    RAISE EXCEPTION 'Conflit de réservation : dates déjà réservées';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_disponibilite
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION check_disponibilite_reservation();

-- Trigger pour assigner organisation selon pays
CREATE OR REPLACE FUNCTION assign_organisation_reservation()
RETURNS TRIGGER AS $$
DECLARE
  v_pays TEXT;
  v_organisation_id UUID;
BEGIN
  -- Si organisation déjà assignée, ne rien faire
  IF NEW.organisation_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer le pays du bien
  IF NEW.propriete_id IS NOT NULL THEN
    SELECT p.pays INTO v_pays
    FROM proprietes p
    WHERE p.id = NEW.propriete_id;
  ELSIF NEW.unite_id IS NOT NULL THEN
    SELECT p.pays INTO v_pays
    FROM unites u
    JOIN proprietes p ON u.propriete_id = p.id
    WHERE u.id = NEW.unite_id;
  END IF;
  
  -- Assigner organisation selon pays
  SELECT id INTO v_organisation_id
  FROM organisations
  WHERE pays = v_pays
  AND is_active = true
  LIMIT 1;
  
  IF v_organisation_id IS NULL THEN
    -- Fallback sur organisation principale
    SELECT id INTO v_organisation_id
    FROM organisations
    WHERE is_active = true
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  NEW.organisation_id = v_organisation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assign_organisation
  BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION assign_organisation_reservation();

-- ============================================================================
-- DONNÉES INITIALES : Commissions plateformes standard
-- ============================================================================
INSERT INTO public.commissions_plateformes (plateforme, type_commission, taux_voyageur, taux_hote, taux_tva, notes) VALUES
('airbnb', 'mixte', 14.2, 3.0, 20.0, 'Taux standard Airbnb France'),
('booking', 'hote', 0, 15.0, 20.0, 'Commission Booking.com standard'),
('expedia', 'hote', 0, 15.0, 20.0, 'Commission Expedia standard'),
('direct', 'mixte', 0, 0, 20.0, 'Réservation directe sans commission')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendrier_disponibilites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions_plateformes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- Policy reservations : accès par organisation
CREATE POLICY "reservations_organisation_access" ON public.reservations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organisation_assignments uoa
      WHERE uoa.organisation_id = reservations.organisation_id
      AND uoa.user_id = auth.uid()
    )
  );

-- Policy calendrier : accès via propriété/unité
CREATE POLICY "calendrier_access" ON public.calendrier_disponibilites
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proprietes p
      JOIN user_organisation_assignments uoa ON p.organisation_id = uoa.organisation_id
      WHERE (
        calendrier_disponibilites.propriete_id = p.id OR
        calendrier_disponibilites.unite_id IN (SELECT id FROM unites WHERE propriete_id = p.id)
      )
      AND uoa.user_id = auth.uid()
    )
  );

-- Policy commissions : lecture pour tous, écriture admin
CREATE POLICY "commissions_read_all" ON public.commissions_plateformes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "commissions_write_admin" ON public.commissions_plateformes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'admin')
    )
  );

-- Policy paiements : accès via réservation
CREATE POLICY "paiements_reservation_access" ON public.paiements_reservations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN user_organisation_assignments uoa ON r.organisation_id = uoa.organisation_id
      WHERE r.id = paiements_reservations.reservation_id
      AND uoa.user_id = auth.uid()
    )
  );

-- Policy import history : accès par organisation
CREATE POLICY "import_history_access" ON public.import_history
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_organisation_assignments uoa
      WHERE uoa.organisation_id = import_history.organisation_id
      AND uoa.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON TABLE public.reservations IS 'Table principale des réservations multi-plateformes';
COMMENT ON TABLE public.calendrier_disponibilites IS 'Gestion des disponibilités et prix par date';
COMMENT ON TABLE public.commissions_plateformes IS 'Configuration des taux de commission par plateforme';
COMMENT ON TABLE public.paiements_reservations IS 'Suivi des paiements liés aux réservations';
COMMENT ON TABLE public.import_history IS 'Historique et traçabilité des imports CSV';

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================