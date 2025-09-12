-- Migration: Ajouter les colonnes manquantes à la table proprietes
-- Date: 2025-01-08
-- Description: Ajout de titre_annonce, capacite_max et nb_lits pour corriger le formulaire

-- Ajouter les colonnes manquantes
ALTER TABLE public.proprietes 
ADD COLUMN IF NOT EXISTS titre_annonce VARCHAR(500),
ADD COLUMN IF NOT EXISTS capacite_max INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS nb_lits INTEGER DEFAULT 0;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN public.proprietes.titre_annonce IS 'Titre de l''annonce pour affichage public';
COMMENT ON COLUMN public.proprietes.capacite_max IS 'Capacité maximale d''accueil en nombre de personnes';
COMMENT ON COLUMN public.proprietes.nb_lits IS 'Nombre total de lits disponibles';

-- Mettre à jour les valeurs par défaut pour les propriétés existantes
UPDATE public.proprietes 
SET 
  capacite_max = COALESCE(capacite_max, 1),
  nb_lits = COALESCE(nb_lits, 0)
WHERE capacite_max IS NULL OR nb_lits IS NULL;