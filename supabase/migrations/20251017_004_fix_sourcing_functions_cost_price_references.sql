-- Migration: Fix sourcing functions referencing deleted cost_price column
-- Date: 2025-10-17
-- Description: Replace cost_price references with supplier_price in sourcing workflow functions
-- Issue: Error "record new has no field cost_price" caused by functions referencing deleted column
-- Context: Migration 20251017_003 removed cost_price from products and product_drafts

BEGIN;

-- ============================================================================
-- STEP 1: Supprimer les fonctions existantes
-- ============================================================================

DROP FUNCTION IF EXISTS validate_sourcing_draft(UUID, BOOLEAN, UUID);
DROP FUNCTION IF EXISTS validate_sample(UUID, BOOLEAN, TEXT, UUID);
DROP FUNCTION IF EXISTS finalize_sourcing_to_catalog(UUID);

-- ============================================================================
-- FIX 1: validate_sourcing_draft()
-- Ligne 101: draft_record.cost_price → draft_record.supplier_price
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_sourcing_draft(
  draft_id UUID,
  requires_sample_decision BOOLEAN,
  validated_by_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  draft_record RECORD;
  result JSONB;
BEGIN
  -- Récupérer le brouillon
  SELECT * INTO draft_record
  FROM product_drafts
  WHERE id = draft_id AND creation_mode = 'sourcing';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Brouillon sourcing introuvable'
    );
  END IF;

  -- Vérifications business rules pour validation sourcing
  IF draft_record.name IS NULL OR LENGTH(TRIM(draft_record.name)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nom produit obligatoire');
  END IF;

  IF draft_record.supplier_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Fournisseur obligatoire');
  END IF;

  -- FIX: Remplacer cost_price par supplier_price
  IF draft_record.supplier_price IS NULL OR draft_record.supplier_price <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Prix d''achat obligatoire');
  END IF;

  -- Mettre à jour le statut selon décision échantillons
  UPDATE product_drafts SET
    sourcing_status = 'sourcing_validated',
    requires_sample = requires_sample_decision,
    sample_status = CASE
      WHEN requires_sample_decision THEN 'request_pending'::sample_status_type
      ELSE 'not_required'::sample_status_type
    END,
    sourcing_validated_at = NOW(),
    sourcing_validated_by = validated_by_user_id,
    updated_at = NOW()
  WHERE id = draft_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Sourcing validé avec succès',
    'requires_sample', requires_sample_decision,
    'next_step', CASE
      WHEN requires_sample_decision THEN 'sample_request'
      ELSE 'ready_for_catalog'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_sourcing_draft(UUID, BOOLEAN, UUID) IS 'Validation sourcing - FIX: supplier_price remplace cost_price (2025-10-17)';

-- ============================================================================
-- FIX 2: validate_sample()
-- Lignes 328: draft_record.cost_price → draft_record.supplier_price
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_sample(
  draft_id UUID,
  approved BOOLEAN,
  validation_notes_text TEXT DEFAULT NULL,
  validated_by_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  draft_record RECORD;
  product_id UUID;
BEGIN
  -- Récupérer le brouillon
  SELECT * INTO draft_record
  FROM product_drafts
  WHERE id = draft_id AND sample_status = 'delivered';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Échantillon non prêt pour validation'
    );
  END IF;

  IF approved THEN
    -- Échantillon approuvé → passage automatique au catalogue
    UPDATE product_drafts SET
      sample_status = 'approved',
      sample_validated_at = NOW(),
      sample_validated_by = validated_by_user_id,
      sample_validation_notes = validation_notes_text,
      sourcing_status = 'ready_for_catalog',
      updated_at = NOW()
    WHERE id = draft_id;

    -- Auto-créer le produit dans le catalogue
    -- FIX: supplier_price utilisé pour calculer les prix
    INSERT INTO products (
      sku,
      name,
      description,
      technical_description,
      supplier_id,
      supplier_reference,
      creation_mode,
      requires_sample,
      product_type,
      assigned_client_id,
      status,
      supplier_page_url,
      estimated_selling_price,
      margin_percentage
    ) VALUES (
      'VER-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
      draft_record.name,
      draft_record.description,
      draft_record.technical_description,
      draft_record.supplier_id,
      draft_record.supplier_reference,
      'sourcing',
      false, -- Plus besoin d'échantillon
      draft_record.product_type,
      draft_record.assigned_client_id,
      'in_stock',
      draft_record.supplier_page_url,
      -- Prix calculé : supplier_price × 1.5 (marge 50%)
      COALESCE(draft_record.estimated_selling_price, draft_record.supplier_price * 1.5),
      -- Marge standard 50%
      COALESCE(draft_record.margin_percentage, 50.00)
    ) RETURNING id INTO product_id;

    -- Migrer les images
    INSERT INTO product_images (
      product_id, storage_path, is_primary, image_type,
      alt_text, file_size, format, display_order
    )
    SELECT
      product_id, storage_path, is_primary, image_type,
      alt_text, file_size, format, display_order
    FROM product_draft_images
    WHERE product_draft_id = draft_id;

    -- Supprimer le brouillon
    DELETE FROM product_draft_images WHERE product_draft_id = draft_id;
    DELETE FROM product_drafts WHERE id = draft_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Échantillon validé et produit ajouté au catalogue',
      'product_id', product_id,
      'next_step', 'completed'
    );

  ELSE
    -- Échantillon refusé
    UPDATE product_drafts SET
      sample_status = 'rejected',
      sample_validated_at = NOW(),
      sample_validated_by = validated_by_user_id,
      sample_rejection_reason = validation_notes_text,
      updated_at = NOW()
    WHERE id = draft_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Échantillon refusé',
      'next_step', 'back_to_sourcing_or_archive'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_sample(UUID, BOOLEAN, TEXT, UUID) IS 'Validation échantillon - FIX: supplier_price remplace cost_price (2025-10-17)';

-- ============================================================================
-- FIX 3: finalize_sourcing_to_catalog()
-- Ligne 414: draft_record.cost_price → draft_record.supplier_price
-- ============================================================================

CREATE OR REPLACE FUNCTION finalize_sourcing_to_catalog(
  draft_id UUID
) RETURNS JSONB AS $$
DECLARE
  draft_record RECORD;
  product_id UUID;
BEGIN
  -- Récupérer le brouillon validé sans échantillon
  SELECT * INTO draft_record
  FROM product_drafts
  WHERE id = draft_id
    AND sourcing_status = 'sourcing_validated'
    AND requires_sample = false
    AND sample_status = 'not_required';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Produit non éligible pour passage direct au catalogue'
    );
  END IF;

  -- Créer le produit dans le catalogue
  -- FIX: supplier_price utilisé pour calculer les prix
  INSERT INTO products (
    sku,
    name,
    description,
    technical_description,
    supplier_id,
    supplier_reference,
    creation_mode,
    requires_sample,
    product_type,
    assigned_client_id,
    status,
    supplier_page_url,
    estimated_selling_price,
    margin_percentage
  ) VALUES (
    'VER-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    draft_record.name,
    draft_record.description,
    draft_record.technical_description,
    draft_record.supplier_id,
    draft_record.supplier_reference,
    'sourcing',
    false,
    draft_record.product_type,
    draft_record.assigned_client_id,
    'in_stock',
    draft_record.supplier_page_url,
    -- Prix calculé : supplier_price × 1.5 (marge 50%)
    COALESCE(draft_record.estimated_selling_price, draft_record.supplier_price * 1.5),
    -- Marge standard 50%
    COALESCE(draft_record.margin_percentage, 50.00)
  ) RETURNING id INTO product_id;

  -- Migrer les images
  INSERT INTO product_images (
    product_id, storage_path, is_primary, image_type,
    alt_text, file_size, format, display_order
  )
  SELECT
    product_id, storage_path, is_primary, image_type,
    alt_text, file_size, format, display_order
  FROM product_draft_images
  WHERE product_draft_id = draft_id;

  -- Supprimer le brouillon
  DELETE FROM product_draft_images WHERE product_draft_id = draft_id;
  DELETE FROM product_drafts WHERE id = draft_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Produit ajouté au catalogue avec succès',
    'product_id', product_id,
    'next_step', 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION finalize_sourcing_to_catalog(UUID) IS 'Passage direct catalogue - FIX: supplier_price remplace cost_price (2025-10-17)';

COMMIT;

-- ============================================================================
-- NOTES MIGRATION
-- ============================================================================

/*
PROBLÈME RÉSOLU:
- Erreur PostgreSQL: "record new has no field cost_price"
- Cause: 3 fonctions dans 20250925_002_sourcing_workflow_validation.sql référençaient cost_price

FONCTIONS CORRIGÉES:
1. validate_sourcing_draft()       - Ligne 101: cost_price → supplier_price
2. validate_sample()                - Ligne 328: cost_price → supplier_price
3. finalize_sourcing_to_catalog()   - Ligne 414: cost_price → supplier_price

CHANGEMENTS:
- Toutes les références cost_price remplacées par supplier_price
- INSERT INTO products utilise supplier_price pour calculs prix (marge 50%)
- Compatibilité maintenue avec architecture métier Vérone Phase 1

TESTS RECOMMANDÉS:
1. Créer produit vide (draft) → Doit réussir sans erreur cost_price
2. Valider sourcing draft → Doit accepter supplier_price
3. Finaliser passage catalogue → Doit créer produit avec supplier_price

RÉFÉRENCE:
- Migration précédente: 20251017_003_remove_cost_price_column.sql
- Business rules: supplier_price = prix d'achat fournisseur (Phase 1)
*/
