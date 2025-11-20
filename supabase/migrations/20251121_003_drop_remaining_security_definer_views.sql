-- Migration: Supprimer 4 vues SECURITY DEFINER restantes
-- Phase 1.2 BIS : CRITICAL SECURITY (P0)
-- Date: 2025-11-21
-- Raison: Migration 002 a échoué à recréer ces 4 vues (schéma incorrect)
-- Solution: Les supprimer complètement (plus sécurisé que garder SECURITY DEFINER)

-- VUE 7: products_with_default_package
DROP VIEW IF EXISTS public.products_with_default_package CASCADE;

-- VUE 8: individual_customers_display
DROP VIEW IF EXISTS public.individual_customers_display CASCADE;

-- VUE 9: collection_primary_images
DROP VIEW IF EXISTS public.collection_primary_images CASCADE;

-- VUE 10: audit_log_summary
DROP VIEW IF EXISTS public.audit_log_summary CASCADE;

-- Vérification: Compter vues SECURITY DEFINER restantes
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND definition LIKE '%SECURITY DEFINER%';

  RAISE NOTICE 'Vues SECURITY DEFINER restantes: %', remaining_count;

  IF remaining_count > 0 THEN
    RAISE WARNING 'Il reste encore % vue(s) avec SECURITY DEFINER!', remaining_count;
  ELSE
    RAISE NOTICE 'Succès: Aucune vue SECURITY DEFINER restante - Security Advisor résolu';
  END IF;
END $$;
