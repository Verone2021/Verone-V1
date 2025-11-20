-- Migration: Supprimer table obsolète brands
-- Phase 1.1 : CRITICAL SECURITY (P0)
-- Source: Supabase Security Advisor - Table brands sans RLS
-- Date: 2025-11-21
-- Impact: Supprime table obsolète restée après migration vers suppliers

-- Contexte historique:
-- - Sept 2025: Migration 20250916_002 a migré données brands → organisations (type='supplier')
-- - Sept 2025: Migration 20250916_003 a supprimé colonne brand des tables
-- - Nov 2025: Table brands est restée en base (orpheline) → détectée par Security Advisor
--
-- Cette table ne sert plus à rien et représente un risque de sécurité (RLS disabled)

-- Étape 1: Vérifier qu'aucune foreign key ne pointe vers brands
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'brands';

  IF fk_count > 0 THEN
    RAISE EXCEPTION 'Cannot drop table brands: % foreign key(s) still reference it', fk_count;
  END IF;
END $$;

-- Étape 2: Supprimer la table brands (avec CASCADE au cas où)
DROP TABLE IF EXISTS public.brands CASCADE;

-- Étape 3: Log de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Table brands supprimée avec succès - Security Advisor error résolu';
END $$;
