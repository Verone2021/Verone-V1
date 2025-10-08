/**
 * Migration: Suppression de la colonne room_category de collections
 * Date: 2025-10-08
 *
 * CONTEXTE:
 * - room_category: VARCHAR (catégorie unique, ancien système)
 * - suitable_rooms: ARRAY (multi-sélection, aligné avec products et variant_groups)
 *
 * DÉCISION BUSINESS:
 * Garder UNIQUEMENT suitable_rooms pour cohérence entre Collections, Products et Variant Groups
 *
 * IMPACT:
 * - Suppression de la colonne room_category
 * - Les données suitable_rooms restent intactes
 */

-- Supprimer la colonne room_category de la table collections
ALTER TABLE collections
DROP COLUMN IF EXISTS room_category;

-- Vérification que suitable_rooms existe bien
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'collections'
    AND column_name = 'suitable_rooms'
  ) THEN
    RAISE EXCEPTION 'La colonne suitable_rooms est manquante dans collections';
  END IF;
END $$;

-- Log de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée: room_category supprimé, suitable_rooms conservé';
END $$;
