-- Migration: Create organisations table
-- Description: Organizations table with one organization per country constraint
-- Date: 2025-01-09

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organisations table
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Required business fields
  nom VARCHAR(255) NOT NULL CHECK (length(trim(nom)) >= 2),
  pays VARCHAR(2) NOT NULL CHECK (pays ~ '^[A-Z]{2}$'),
  
  -- Optional fields
  description TEXT,
  adresse_siege TEXT,
  telephone VARCHAR(20),
  email VARCHAR(255) CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  site_web VARCHAR(255),
  
  -- Metadata fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Performance indexes
CREATE INDEX idx_organisations_pays ON organisations (pays);
CREATE INDEX idx_organisations_created_at ON organisations (created_at);
CREATE INDEX idx_organisations_nom ON organisations (nom);

-- CRITICAL: Unique constraint - one organization per country
CREATE UNIQUE INDEX unique_organisation_par_pays ON organisations (pays);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organisations_updated_at 
    BEFORE UPDATE ON organisations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Policies seront ajoutées dans migration 004 après création des utilisateurs
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

-- Policy temporaire permettant à tous les utilisateurs authentifiés de voir les organisations
-- Cette policy sera remplacée dans la migration 004
CREATE POLICY "Temp allow all authenticated users" ON organisations
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Insert seed data for organizations
-- France organization for testing
INSERT INTO organisations (
  nom, 
  pays, 
  description, 
  adresse_siege, 
  telephone, 
  email, 
  site_web
) VALUES (
  'Want It Now France',
  'FR',
  'Organisation principale pour la France - plateforme de gestion immobilière',
  '123 Avenue des Champs-Élysées, 75008 Paris, France',
  '+33 1 42 12 34 56',
  'contact@wantitnow.fr',
  'https://wantitnow.fr'
) ON CONFLICT (pays) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE organisations IS 'Organizations table - one per country constraint enforced';
COMMENT ON COLUMN organisations.nom IS 'Organization name, minimum 2 characters';
COMMENT ON COLUMN organisations.pays IS 'ISO 3166-1 alpha-2 country code (2 uppercase letters)';
COMMENT ON COLUMN organisations.description IS 'Optional organization description';
COMMENT ON COLUMN organisations.adresse_siege IS 'Optional headquarters address';
COMMENT ON COLUMN organisations.telephone IS 'Optional phone number';
COMMENT ON COLUMN organisations.email IS 'Optional email with validation';
COMMENT ON COLUMN organisations.site_web IS 'Optional website URL';