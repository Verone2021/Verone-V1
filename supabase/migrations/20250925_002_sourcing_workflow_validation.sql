-- Migration: Workflow Sourcing → Échantillons → Catalogue
-- Date: 25 septembre 2025
-- Objectif: Implémenter le workflow correct de validation sourcing

BEGIN;

-- ============================================================================
-- 1. TYPES ENUM POUR WORKFLOW SOURCING
-- ============================================================================

-- Statut workflow sourcing
CREATE TYPE IF NOT EXISTS sourcing_status_type AS ENUM (
  'draft',              -- Brouillon sourcing créé
  'sourcing_validated', -- Sourcing validé, décision échantillons prise
  'ready_for_catalog',  -- Prêt pour passage catalogue
  'archived'            -- Archivé/abandonné
);

-- Statut demande échantillons
CREATE TYPE IF NOT EXISTS sample_request_status_type AS ENUM (
  'pending_approval',   -- Demande en attente approbation manager
  'approved',          -- Demande approuvée, peut commander
  'rejected'           -- Demande refusée
);

-- Statut workflow échantillons complet
CREATE TYPE IF NOT EXISTS sample_status_type AS ENUM (
  'not_required',      -- Pas d'échantillon requis
  'request_pending',   -- Demande de commande en cours
  'request_approved',  -- Demande approuvée
  'ordered',          -- Échantillon commandé
  'delivered',        -- Échantillon livré
  'approved',         -- Échantillon validé → passage catalogue
  'rejected'          -- Échantillon refusé → retour sourcing
);

-- ============================================================================
-- 2. AJOUT COLONNES WORKFLOW DANS PRODUCT_DRAFTS
-- ============================================================================

-- Colonnes statut workflow
ALTER TABLE product_drafts
ADD COLUMN IF NOT EXISTS sourcing_status sourcing_status_type DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS sample_status sample_status_type DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sample_request_status sample_request_status_type DEFAULT NULL;

-- Colonnes dates tracking workflow
ALTER TABLE product_drafts
ADD COLUMN IF NOT EXISTS sourcing_validated_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sourcing_validated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS sample_requested_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sample_request_approved_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sample_ordered_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sample_delivered_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sample_validated_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sample_validated_by UUID REFERENCES auth.users(id);

-- Colonnes informations échantillons
ALTER TABLE product_drafts
ADD COLUMN IF NOT EXISTS sample_description TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sample_estimated_cost DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sample_delivery_time_days INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sample_validation_notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sample_rejection_reason TEXT DEFAULT NULL;

-- ============================================================================
-- 3. FONCTIONS WORKFLOW SOURCING
-- ============================================================================

-- Fonction 1: Validation du sourcing (étape 1)
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

  IF draft_record.cost_price IS NULL OR draft_record.cost_price <= 0 THEN
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

-- Fonction 2: Demande de commande échantillons
CREATE OR REPLACE FUNCTION request_sample_order(
  draft_id UUID,
  sample_description_text TEXT,
  estimated_cost DECIMAL(10,2),
  delivery_days INTEGER,
  requested_by_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  draft_record RECORD;
BEGIN
  -- Vérifier que le produit est prêt pour demande échantillon
  SELECT * INTO draft_record
  FROM product_drafts
  WHERE id = draft_id
    AND sourcing_status = 'sourcing_validated'
    AND requires_sample = true
    AND sample_status = 'request_pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Produit non éligible pour demande échantillon'
    );
  END IF;

  -- Mettre à jour avec infos demande échantillon
  UPDATE product_drafts SET
    sample_description = sample_description_text,
    sample_estimated_cost = estimated_cost,
    sample_delivery_time_days = delivery_days,
    sample_request_status = 'pending_approval',
    sample_requested_at = NOW(),
    updated_at = NOW()
  WHERE id = draft_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Demande échantillon soumise pour approbation',
    'next_step', 'awaiting_manager_approval'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 3: Approbation/refus demande échantillons
CREATE OR REPLACE FUNCTION approve_sample_request(
  draft_id UUID,
  approved BOOLEAN,
  notes TEXT DEFAULT NULL,
  approved_by_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
  IF approved THEN
    UPDATE product_drafts SET
      sample_request_status = 'approved',
      sample_status = 'request_approved',
      sample_request_approved_at = NOW(),
      sample_validation_notes = COALESCE(notes, sample_validation_notes),
      updated_at = NOW()
    WHERE id = draft_id
      AND sample_request_status = 'pending_approval';

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Demande échantillon approuvée',
      'next_step', 'can_order_sample'
    );
  ELSE
    UPDATE product_drafts SET
      sample_request_status = 'rejected',
      sample_status = 'rejected',
      sample_rejection_reason = notes,
      updated_at = NOW()
    WHERE id = draft_id
      AND sample_request_status = 'pending_approval';

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Demande échantillon refusée',
      'next_step', 'back_to_sourcing'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 4: Marquer échantillon comme commandé
CREATE OR REPLACE FUNCTION mark_sample_ordered(
  draft_id UUID,
  order_reference TEXT DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
  UPDATE product_drafts SET
    sample_status = 'ordered',
    sample_ordered_at = NOW(),
    sample_validation_notes = COALESCE(
      sample_validation_notes || ' | Référence commande: ' || order_reference,
      'Référence commande: ' || order_reference
    ),
    updated_at = NOW()
  WHERE id = draft_id
    AND sample_status = 'request_approved';

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Échantillon marqué comme commandé',
      'next_step', 'awaiting_delivery'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Impossible de marquer comme commandé'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 5: Marquer échantillon comme livré
CREATE OR REPLACE FUNCTION mark_sample_delivered(
  draft_id UUID
) RETURNS JSONB AS $$
BEGIN
  UPDATE product_drafts SET
    sample_status = 'delivered',
    sample_delivered_at = NOW(),
    updated_at = NOW()
  WHERE id = draft_id
    AND sample_status = 'ordered';

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Échantillon marqué comme livré',
      'next_step', 'ready_for_validation'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Impossible de marquer comme livré'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 6: Validation finale échantillon
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
    INSERT INTO products (
      sku,
      name,
      price_ht,
      cost_price,
      description,
      technical_description,
      supplier_id,
      supplier_reference,
      creation_mode,
      requires_sample,
      product_type,
      assigned_client_id,
      status,
      supplier_page_url
    ) VALUES (
      'VER-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
      draft_record.name,
      COALESCE(draft_record.estimated_selling_price, draft_record.cost_price * 1.5),
      draft_record.cost_price,
      draft_record.description,
      draft_record.technical_description,
      draft_record.supplier_id,
      draft_record.supplier_reference,
      'sourcing',
      false, -- Plus besoin d'échantillon
      draft_record.product_type,
      draft_record.assigned_client_id,
      'in_stock',
      draft_record.supplier_page_url
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

-- Fonction 7: Passage direct catalogue (sans échantillons)
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
  INSERT INTO products (
    sku, name, price_ht, cost_price, description, technical_description,
    supplier_id, supplier_reference, creation_mode, requires_sample,
    product_type, assigned_client_id, status, supplier_page_url
  ) VALUES (
    'VER-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    draft_record.name,
    COALESCE(draft_record.estimated_selling_price, draft_record.cost_price * 1.5),
    draft_record.cost_price,
    draft_record.description,
    draft_record.technical_description,
    draft_record.supplier_id,
    draft_record.supplier_reference,
    'sourcing',
    false,
    draft_record.product_type,
    draft_record.assigned_client_id,
    'in_stock',
    draft_record.supplier_page_url
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

-- ============================================================================
-- 4. VUES DASHBOARD WORKFLOW
-- ============================================================================

-- Vue métriques workflow sourcing
CREATE OR REPLACE VIEW sourcing_workflow_metrics AS
SELECT
  -- Totaux par statut
  COUNT(*) FILTER (WHERE creation_mode = 'sourcing') as total_sourcing,
  COUNT(*) FILTER (WHERE sourcing_status = 'draft') as drafts_pending,
  COUNT(*) FILTER (WHERE sourcing_status = 'sourcing_validated') as sourcing_validated,
  COUNT(*) FILTER (WHERE sourcing_status = 'ready_for_catalog') as ready_for_catalog,

  -- Échantillons
  COUNT(*) FILTER (WHERE requires_sample = true) as requiring_samples,
  COUNT(*) FILTER (WHERE sample_status = 'request_pending') as sample_requests_pending,
  COUNT(*) FILTER (WHERE sample_request_status = 'pending_approval') as sample_approvals_pending,
  COUNT(*) FILTER (WHERE sample_status = 'ordered') as samples_ordered,
  COUNT(*) FILTER (WHERE sample_status = 'delivered') as samples_delivered,
  COUNT(*) FILTER (WHERE sample_status = 'approved') as samples_approved,
  COUNT(*) FILTER (WHERE sample_status = 'rejected') as samples_rejected,

  -- Métriques temps
  AVG(EXTRACT(EPOCH FROM (sourcing_validated_at - created_at))/86400) FILTER (WHERE sourcing_validated_at IS NOT NULL) as avg_sourcing_validation_days,
  AVG(EXTRACT(EPOCH FROM (sample_validated_at - sample_requested_at))/86400) FILTER (WHERE sample_validated_at IS NOT NULL) as avg_sample_process_days,

  -- Taux de succès
  ROUND(
    COUNT(*) FILTER (WHERE sample_status = 'approved') * 100.0 /
    NULLIF(COUNT(*) FILTER (WHERE requires_sample = true), 0),
    2
  ) as sample_approval_rate

FROM product_drafts
WHERE creation_mode = 'sourcing'
AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================================================
-- 5. POLICIES RLS
-- ============================================================================

-- Policy lecture workflow sourcing
DROP POLICY IF EXISTS "Users can read sourcing workflow" ON product_drafts;
CREATE POLICY "Users can read sourcing workflow" ON product_drafts
  FOR SELECT TO authenticated
  USING (true);

-- Policy mise à jour workflow (managers uniquement pour validations)
DROP POLICY IF EXISTS "Managers can update sourcing workflow" ON product_drafts;
CREATE POLICY "Managers can update sourcing workflow" ON product_drafts
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'catalog_manager', 'warehouse_manager')
    )
  );

COMMIT;

-- ============================================================================
-- COMMENTAIRES UTILISATION
-- ============================================================================

/*
WORKFLOW SOURCING COMPLET:

1. Création sourcing → product_drafts (sourcing_status = 'draft')
2. Validation sourcing → validate_sourcing_draft() → détermine requires_sample
3a. Si requires_sample = false → finalize_sourcing_to_catalog() → produit créé
3b. Si requires_sample = true → workflow échantillons:
    - request_sample_order() → demande échantillons
    - approve_sample_request() → approbation manager
    - mark_sample_ordered() → commande effectuée
    - mark_sample_delivered() → échantillon reçu
    - validate_sample() → validation finale + auto-création produit

UTILISATION FRONTEND:
- Hook useDrafts étendu avec nouvelles fonctions workflow
- Interfaces spécialisées pour chaque étape
- Dashboard métriques avec sourcing_workflow_metrics
*/