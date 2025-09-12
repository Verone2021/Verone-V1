-- ============================================
-- Migration: 080_create_proprietes_tables.sql
-- Description: Création des tables pour le système de gestion des propriétés
-- Date: 2024-01-20
-- ============================================

-- ==========================
-- 1. TYPES ENUM
-- ==========================

-- Type de propriété
CREATE TYPE public.propriete_type AS ENUM (
  'appartement',
  'maison',
  'terrain',
  'immeuble',
  'commerce',
  'bureau',
  'entrepot',
  'parking',
  'autre'
);

-- Statut de propriété
CREATE TYPE public.propriete_statut AS ENUM (
  'brouillon',
  'sourcing',
  'evaluation',
  'negociation',
  'achetee',
  'disponible',
  'louee',
  'vendue'
);

-- ==========================
-- 2. TABLE PROPRIETES
-- ==========================

CREATE TABLE public.proprietes (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(50) UNIQUE,
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  
  -- Informations générales
  nom VARCHAR(255) NOT NULL,
  type propriete_type NOT NULL,
  statut propriete_statut DEFAULT 'brouillon',
  description TEXT,
  
  -- Localisation
  adresse_ligne1 VARCHAR(255),
  adresse_ligne2 VARCHAR(255),
  code_postal VARCHAR(10),
  ville VARCHAR(100),
  region VARCHAR(100),
  pays VARCHAR(2) DEFAULT 'FR',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Caractéristiques physiques
  surface_habitable DECIMAL(10, 2),
  surface_terrain DECIMAL(10, 2),
  nombre_pieces INTEGER,
  nombre_chambres INTEGER,
  nombre_salles_bain INTEGER,
  nombre_etages INTEGER,
  etage INTEGER,
  annee_construction INTEGER,
  
  -- Informations financières
  prix_acquisition DECIMAL(12, 2),
  frais_acquisition DECIMAL(12, 2),
  valeur_actuelle DECIMAL(12, 2),
  loyer_mensuel DECIMAL(10, 2),
  charges_mensuelles DECIMAL(10, 2),
  taxe_fonciere DECIMAL(10, 2),
  
  -- Options et équipements
  a_ascenseur BOOLEAN DEFAULT false,
  a_parking BOOLEAN DEFAULT false,
  nombre_places_parking INTEGER DEFAULT 0,
  a_cave BOOLEAN DEFAULT false,
  a_balcon BOOLEAN DEFAULT false,
  surface_balcon DECIMAL(10, 2),
  a_terrasse BOOLEAN DEFAULT false,
  surface_terrasse DECIMAL(10, 2),
  a_jardin BOOLEAN DEFAULT false,
  surface_jardin DECIMAL(10, 2),
  a_piscine BOOLEAN DEFAULT false,
  
  -- Diagnostics
  dpe_classe VARCHAR(1),
  dpe_valeur INTEGER,
  ges_classe VARCHAR(1),
  ges_valeur INTEGER,
  
  -- Multi-unités
  a_unites BOOLEAN DEFAULT false,
  nombre_unites INTEGER,
  
  -- Notes et documents
  notes_internes TEXT,
  
  -- Métadonnées
  is_brouillon BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.utilisateurs(id),
  updated_by UUID REFERENCES public.utilisateurs(id)
);

-- ==========================
-- 3. TABLE UNITES (pour propriétés multi-unités)
-- ==========================

CREATE TABLE public.unites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id UUID NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  
  -- Identification
  numero VARCHAR(50),
  nom VARCHAR(255),
  type VARCHAR(50), -- studio, T1, T2, etc.
  etage INTEGER,
  
  -- Caractéristiques
  surface_habitable DECIMAL(10, 2),
  nombre_pieces INTEGER,
  nombre_chambres INTEGER,
  nombre_salles_bain INTEGER,
  
  -- Équipements
  a_balcon BOOLEAN DEFAULT false,
  a_terrasse BOOLEAN DEFAULT false,
  a_cave BOOLEAN DEFAULT false,
  a_parking BOOLEAN DEFAULT false,
  
  -- Location
  est_louee BOOLEAN DEFAULT false,
  loyer_mensuel DECIMAL(10, 2),
  charges_mensuelles DECIMAL(10, 2),
  disponible BOOLEAN DEFAULT true,
  date_disponibilite DATE,
  
  -- Notes
  description TEXT,
  notes TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================
-- 4. TABLE PROPRIETE_PROPRIETAIRES (Quotités)
-- ==========================

CREATE TABLE public.propriete_proprietaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id UUID NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  proprietaire_id UUID NOT NULL REFERENCES public.proprietaires(id) ON DELETE RESTRICT,
  
  -- Quotité
  pourcentage DECIMAL(5, 2) NOT NULL CHECK (pourcentage > 0 AND pourcentage <= 100),
  
  -- Dates
  date_acquisition DATE,
  date_cession DATE,
  
  -- Prix
  prix_acquisition DECIMAL(12, 2),
  
  -- Notes
  notes TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unique pour éviter les doublons
  UNIQUE(propriete_id, proprietaire_id)
);

-- ==========================
-- 5. TABLE PROPRIETE_PHOTOS
-- ==========================

CREATE TABLE public.propriete_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id UUID NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  
  -- Stockage
  storage_path TEXT NOT NULL,
  url TEXT,
  
  -- Métadonnées
  titre VARCHAR(255),
  description TEXT,
  ordre INTEGER DEFAULT 0,
  est_couverture BOOLEAN DEFAULT false,
  
  -- Technique
  taille_bytes BIGINT,
  mime_type VARCHAR(100),
  largeur INTEGER,
  hauteur INTEGER,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.utilisateurs(id)
);

-- ==========================
-- 6. TABLE UNITE_PHOTOS
-- ==========================

CREATE TABLE public.unite_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unite_id UUID NOT NULL REFERENCES public.unites(id) ON DELETE CASCADE,
  
  -- Stockage
  storage_path TEXT NOT NULL,
  url TEXT,
  
  -- Métadonnées
  titre VARCHAR(255),
  description TEXT,
  ordre INTEGER DEFAULT 0,
  est_couverture BOOLEAN DEFAULT false,
  
  -- Technique
  taille_bytes BIGINT,
  mime_type VARCHAR(100),
  largeur INTEGER,
  hauteur INTEGER,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.utilisateurs(id)
);

-- ==========================
-- 7. INDEX POUR PERFORMANCE
-- ==========================

-- Index sur les clés étrangères
CREATE INDEX idx_proprietes_organisation_id ON public.proprietes(organisation_id);
CREATE INDEX idx_proprietes_statut ON public.proprietes(statut);
CREATE INDEX idx_proprietes_type ON public.proprietes(type);
CREATE INDEX idx_proprietes_ville ON public.proprietes(ville);
CREATE INDEX idx_proprietes_code_postal ON public.proprietes(code_postal);

CREATE INDEX idx_unites_propriete_id ON public.unites(propriete_id);
CREATE INDEX idx_unites_est_louee ON public.unites(est_louee);
CREATE INDEX idx_unites_disponible ON public.unites(disponible);

CREATE INDEX idx_propriete_proprietaires_propriete_id ON public.propriete_proprietaires(propriete_id);
CREATE INDEX idx_propriete_proprietaires_proprietaire_id ON public.propriete_proprietaires(proprietaire_id);

CREATE INDEX idx_propriete_photos_propriete_id ON public.propriete_photos(propriete_id);
CREATE INDEX idx_propriete_photos_ordre ON public.propriete_photos(ordre);

CREATE INDEX idx_unite_photos_unite_id ON public.unite_photos(unite_id);
CREATE INDEX idx_unite_photos_ordre ON public.unite_photos(ordre);

-- ==========================
-- 8. TRIGGERS
-- ==========================

-- Trigger pour générer la référence automatiquement
CREATE OR REPLACE FUNCTION generate_propriete_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL THEN
    NEW.reference := 'PROP-' || to_char(CURRENT_DATE, 'YYYY') || '-' || 
                     LPAD(COALESCE((
                       SELECT COUNT(*) + 1 
                       FROM proprietes 
                       WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
                     ), 1)::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_propriete_reference
  BEFORE INSERT ON public.proprietes
  FOR EACH ROW
  EXECUTE FUNCTION generate_propriete_reference();

-- Trigger pour updated_at
CREATE TRIGGER update_proprietes_updated_at 
  BEFORE UPDATE ON public.proprietes
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unites_updated_at 
  BEFORE UPDATE ON public.unites
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_propriete_proprietaires_updated_at 
  BEFORE UPDATE ON public.propriete_proprietaires
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================
-- 9. COMMENTAIRES
-- ==========================

COMMENT ON TABLE public.proprietes IS 'Table principale des propriétés immobilières';
COMMENT ON TABLE public.unites IS 'Unités pour les propriétés multi-unités (immeubles)';
COMMENT ON TABLE public.propriete_proprietaires IS 'Table de liaison propriétés-propriétaires avec quotités';
COMMENT ON TABLE public.propriete_photos IS 'Photos des propriétés';
COMMENT ON TABLE public.unite_photos IS 'Photos des unités';

COMMENT ON COLUMN public.proprietes.reference IS 'Référence unique auto-générée';
COMMENT ON COLUMN public.proprietes.a_unites IS 'Indique si la propriété a des unités (immeuble)';
COMMENT ON COLUMN public.propriete_proprietaires.pourcentage IS 'Pourcentage de détention (quotité)';