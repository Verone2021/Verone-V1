-- Migration: Système de commandes d'échantillons groupées par fournisseur
-- Date: 25 septembre 2025
-- Objectif: Permettre de regrouper plusieurs échantillons dans une seule commande

BEGIN;

-- ============================================================================
-- 1. NOUVELLE TABLE SAMPLE_ORDERS (Commandes d'échantillons)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sample_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informations commande
  order_number VARCHAR(50) UNIQUE NOT NULL, -- ECH-2025-001
  supplier_id UUID NOT NULL REFERENCES organisations(id),

  -- Statuts commande
  status TEXT NOT NULL DEFAULT 'draft', -- draft, requested, approved, ordered, delivered, validated

  -- Informations logistiques
  estimated_total_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  estimated_delivery_days INTEGER,
  supplier_contact_info JSONB, -- email, phone, contact person
  order_reference_supplier VARCHAR(100), -- référence chez le fournisseur
  tracking_number VARCHAR(100),

  -- Workflow dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  requested_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  ordered_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,

  -- Utilisateurs workflow
  created_by UUID REFERENCES auth.users(id),
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  ordered_by UUID REFERENCES auth.users(id),
  validated_by UUID REFERENCES auth.users(id),

  -- Notes et commentaires
  request_notes TEXT,
  approval_notes TEXT,
  delivery_notes TEXT,
  validation_notes TEXT,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Types enum pour statut commande échantillons
CREATE TYPE IF NOT EXISTS sample_order_status_type AS ENUM (
  'draft',           -- Brouillon, en cours de constitution
  'requested',       -- Demande soumise pour approbation
  'approved',        -- Approuvée par manager
  'rejected',        -- Refusée par manager
  'ordered',         -- Commandée chez fournisseur
  'in_transit',      -- En cours de livraison
  'delivered',       -- Livrée, en attente validation
  'validated',       -- Validée, échantillons OK
  'partially_validated', -- Certains échantillons OK, d'autres pas
  'rejected_samples' -- Échantillons refusés
);

ALTER TABLE sample_orders ALTER COLUMN status TYPE sample_order_status_type USING status::sample_order_status_type;

-- ============================================================================
-- 2. TABLE SAMPLE_ORDER_ITEMS (Articles dans commande échantillons)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sample_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  sample_order_id UUID NOT NULL REFERENCES sample_orders(id) ON DELETE CASCADE,
  product_draft_id UUID NOT NULL REFERENCES product_drafts(id) ON DELETE CASCADE,

  -- Détails échantillon
  sample_description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),

  -- Spécifications échantillon
  sample_specifications JSONB, -- couleur, taille, matériau, etc.
  special_instructions TEXT,

  -- Statut individuel échantillon
  item_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  validation_notes TEXT,
  rejection_reason TEXT,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),

  -- Contraintes
  UNIQUE(sample_order_id, product_draft_id)
);

CREATE TYPE IF NOT EXISTS sample_item_status_type AS ENUM (
  'pending',    -- En attente validation
  'approved',   -- Échantillon validé
  'rejected'    -- Échantillon refusé
);

ALTER TABLE sample_order_items ALTER COLUMN item_status TYPE sample_item_status_type USING item_status::sample_item_status_type;

-- ============================================================================
-- 3. MODIFIER PRODUCT_DRAFTS POUR LIEN AVEC COMMANDES
-- ============================================================================

-- Ajouter référence vers commande échantillons
ALTER TABLE product_drafts
ADD COLUMN IF NOT EXISTS sample_order_id UUID REFERENCES sample_orders(id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_product_drafts_sample_order ON product_drafts(sample_order_id);
CREATE INDEX IF NOT EXISTS idx_sample_orders_supplier ON sample_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sample_orders_status ON sample_orders(status);

-- ============================================================================
-- 4. FONCTIONS GESTION COMMANDES ÉCHANTILLONS GROUPÉES
-- ============================================================================

-- Fonction 1: Créer ou récupérer commande brouillon pour un fournisseur
CREATE OR REPLACE FUNCTION get_or_create_draft_sample_order(
  supplier_id_param UUID,
  created_by_user_id UUID
) RETURNS UUID AS $$
DECLARE
  existing_order_id UUID;
  new_order_id UUID;
  order_number_generated VARCHAR(50);
BEGIN
  -- Chercher une commande brouillon existante pour ce fournisseur
  SELECT id INTO existing_order_id
  FROM sample_orders
  WHERE supplier_id = supplier_id_param
    AND status = 'draft'
    AND created_by = created_by_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si commande brouillon existe, la retourner
  IF existing_order_id IS NOT NULL THEN
    RETURN existing_order_id;
  END IF;

  -- Sinon, créer nouvelle commande brouillon
  order_number_generated := 'ECH-' || TO_CHAR(NOW(), 'YYYY-MM-DD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 10000)::TEXT, 4, '0');

  INSERT INTO sample_orders (
    order_number,
    supplier_id,
    status,
    created_by
  ) VALUES (
    order_number_generated,
    supplier_id_param,
    'draft',
    created_by_user_id
  ) RETURNING id INTO new_order_id;

  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 2: Ajouter échantillon à commande groupée
CREATE OR REPLACE FUNCTION add_sample_to_order(
  product_draft_id_param UUID,
  sample_description_param TEXT,
  estimated_cost_param DECIMAL(10,2) DEFAULT NULL,
  sample_specifications_param JSONB DEFAULT NULL,
  special_instructions_param TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  draft_record RECORD;
  sample_order_id_result UUID;
  existing_item_id UUID;
BEGIN
  -- Récupérer le brouillon produit
  SELECT * INTO draft_record
  FROM product_drafts
  WHERE id = product_draft_id_param
    AND sourcing_status = 'sourcing_validated'
    AND requires_sample = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Produit non éligible pour échantillon'
    );
  END IF;

  -- Vérifier que le produit n'est pas déjà dans une commande
  SELECT sample_order_id INTO existing_item_id
  FROM sample_order_items soi
  JOIN sample_orders so ON so.id = soi.sample_order_id
  WHERE soi.product_draft_id = product_draft_id_param
    AND so.status IN ('draft', 'requested', 'approved', 'ordered', 'in_transit', 'delivered');

  IF existing_item_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Produit déjà dans une commande d''échantillons active'
    );
  END IF;

  -- Obtenir ou créer commande brouillon pour ce fournisseur
  sample_order_id_result := get_or_create_draft_sample_order(
    draft_record.supplier_id,
    auth.uid()
  );

  -- Ajouter l'échantillon à la commande
  INSERT INTO sample_order_items (
    sample_order_id,
    product_draft_id,
    sample_description,
    estimated_cost,
    sample_specifications,
    special_instructions
  ) VALUES (
    sample_order_id_result,
    product_draft_id_param,
    sample_description_param,
    estimated_cost_param,
    sample_specifications_param,
    special_instructions_param
  );

  -- Mettre à jour le produit draft
  UPDATE product_drafts SET
    sample_order_id = sample_order_id_result,
    sample_status = 'request_pending',
    updated_at = NOW()
  WHERE id = product_draft_id_param;

  -- Recalculer coût total estimé de la commande
  UPDATE sample_orders SET
    estimated_total_cost = (
      SELECT SUM(estimated_cost)
      FROM sample_order_items
      WHERE sample_order_id = sample_order_id_result
        AND estimated_cost IS NOT NULL
    ),
    updated_at = NOW()
  WHERE id = sample_order_id_result;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Échantillon ajouté à la commande',
    'sample_order_id', sample_order_id_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 3: Soumettre commande échantillons pour approbation
CREATE OR REPLACE FUNCTION submit_sample_order_for_approval(
  sample_order_id_param UUID,
  request_notes_param TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  order_record RECORD;
  items_count INTEGER;
BEGIN
  -- Vérifier que la commande existe et est en brouillon
  SELECT * INTO order_record
  FROM sample_orders
  WHERE id = sample_order_id_param
    AND status = 'draft'
    AND created_by = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Commande non trouvée ou non modifiable'
    );
  END IF;

  -- Vérifier qu'il y a au moins un échantillon
  SELECT COUNT(*) INTO items_count
  FROM sample_order_items
  WHERE sample_order_id = sample_order_id_param;

  IF items_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Aucun échantillon dans la commande'
    );
  END IF;

  -- Mettre à jour statut commande
  UPDATE sample_orders SET
    status = 'requested',
    requested_at = NOW(),
    requested_by = auth.uid(),
    request_notes = request_notes_param,
    updated_at = NOW()
  WHERE id = sample_order_id_param;

  -- Mettre à jour statut des produits
  UPDATE product_drafts SET
    sample_request_status = 'pending_approval',
    updated_at = NOW()
  WHERE sample_order_id = sample_order_id_param;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Commande soumise pour approbation',
    'items_count', items_count,
    'next_step', 'awaiting_manager_approval'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 4: Approuver/refuser commande échantillons
CREATE OR REPLACE FUNCTION approve_sample_order(
  sample_order_id_param UUID,
  approved BOOLEAN,
  approval_notes_param TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  items_count INTEGER;
BEGIN
  -- Vérifier permissions manager
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'catalog_manager', 'warehouse_manager')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Permissions insuffisantes pour approuver'
    );
  END IF;

  IF approved THEN
    -- Approuver la commande
    UPDATE sample_orders SET
      status = 'approved',
      approved_at = NOW(),
      approved_by = auth.uid(),
      approval_notes = approval_notes_param,
      updated_at = NOW()
    WHERE id = sample_order_id_param
      AND status = 'requested';

    -- Mettre à jour statut des produits
    UPDATE product_drafts SET
      sample_request_status = 'approved',
      sample_status = 'request_approved',
      updated_at = NOW()
    WHERE sample_order_id = sample_order_id_param;

    SELECT COUNT(*) INTO items_count
    FROM sample_order_items
    WHERE sample_order_id = sample_order_id_param;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Commande approuvée',
      'items_count', items_count,
      'next_step', 'can_order_from_supplier'
    );
  ELSE
    -- Refuser la commande
    UPDATE sample_orders SET
      status = 'rejected',
      approved_at = NOW(),
      approved_by = auth.uid(),
      approval_notes = approval_notes_param,
      updated_at = NOW()
    WHERE id = sample_order_id_param
      AND status = 'requested';

    -- Mettre à jour statut des produits (retour au sourcing)
    UPDATE product_drafts SET
      sample_request_status = 'rejected',
      sample_status = 'rejected',
      sample_rejection_reason = approval_notes_param,
      updated_at = NOW()
    WHERE sample_order_id = sample_order_id_param;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Commande refusée',
      'next_step', 'back_to_sourcing'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 5: Marquer commande comme passée chez fournisseur
CREATE OR REPLACE FUNCTION mark_sample_order_placed(
  sample_order_id_param UUID,
  supplier_reference VARCHAR(100) DEFAULT NULL,
  actual_cost_param DECIMAL(10,2) DEFAULT NULL,
  estimated_delivery_days_param INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
  UPDATE sample_orders SET
    status = 'ordered',
    ordered_at = NOW(),
    ordered_by = auth.uid(),
    order_reference_supplier = supplier_reference,
    actual_cost = actual_cost_param,
    estimated_delivery_days = estimated_delivery_days_param,
    updated_at = NOW()
  WHERE id = sample_order_id_param
    AND status = 'approved';

  -- Mettre à jour statut des produits
  UPDATE product_drafts SET
    sample_status = 'ordered',
    sample_ordered_at = NOW(),
    updated_at = NOW()
  WHERE sample_order_id = sample_order_id_param;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Commande passée chez le fournisseur',
      'supplier_reference', supplier_reference,
      'next_step', 'awaiting_delivery'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Impossible de marquer comme commandée'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 6: Marquer commande comme livrée
CREATE OR REPLACE FUNCTION mark_sample_order_delivered(
  sample_order_id_param UUID,
  tracking_number_param VARCHAR(100) DEFAULT NULL,
  delivery_notes_param TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  items_count INTEGER;
BEGIN
  UPDATE sample_orders SET
    status = 'delivered',
    delivered_at = NOW(),
    tracking_number = tracking_number_param,
    delivery_notes = delivery_notes_param,
    updated_at = NOW()
  WHERE id = sample_order_id_param
    AND status IN ('ordered', 'in_transit');

  -- Mettre à jour statut des produits
  UPDATE product_drafts SET
    sample_status = 'delivered',
    sample_delivered_at = NOW(),
    updated_at = NOW()
  WHERE sample_order_id = sample_order_id_param;

  SELECT COUNT(*) INTO items_count
  FROM sample_order_items
  WHERE sample_order_id = sample_order_id_param;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Commande marquée comme livrée',
      'items_count', items_count,
      'next_step', 'ready_for_individual_validation'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Impossible de marquer comme livrée'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction 7: Valider échantillon individuel dans commande
CREATE OR REPLACE FUNCTION validate_individual_sample(
  product_draft_id_param UUID,
  approved BOOLEAN,
  validation_notes_param TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  draft_record RECORD;
  order_record RECORD;
  product_id UUID;
  all_items_validated BOOLEAN;
BEGIN
  -- Récupérer le brouillon et sa commande
  SELECT
    pd.*, so.id as order_id, so.status as order_status
  INTO draft_record
  FROM product_drafts pd
  JOIN sample_orders so ON so.id = pd.sample_order_id
  WHERE pd.id = product_draft_id_param
    AND pd.sample_status = 'delivered';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Échantillon non prêt pour validation'
    );
  END IF;

  IF approved THEN
    -- Approuver échantillon → créer produit catalogue
    UPDATE sample_order_items SET
      item_status = 'approved',
      validated_at = NOW(),
      validated_by = auth.uid(),
      validation_notes = validation_notes_param
    WHERE sample_order_id = draft_record.order_id
      AND product_draft_id = product_draft_id_param;

    -- Auto-créer le produit dans le catalogue
    INSERT INTO products (
      sku, name, price_ht, cost_price, description,
      supplier_id, creation_mode, product_type,
      assigned_client_id, status, supplier_page_url
    ) VALUES (
      'VER-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
      draft_record.name,
      COALESCE(draft_record.estimated_selling_price, draft_record.cost_price * 1.5),
      draft_record.cost_price,
      draft_record.description,
      draft_record.supplier_id,
      'sourcing',
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
    WHERE product_draft_id = product_draft_id_param;

    -- Supprimer le brouillon
    DELETE FROM product_draft_images WHERE product_draft_id = product_draft_id_param;
    DELETE FROM product_drafts WHERE id = product_draft_id_param;

  ELSE
    -- Refuser échantillon
    UPDATE sample_order_items SET
      item_status = 'rejected',
      validated_at = NOW(),
      validated_by = auth.uid(),
      rejection_reason = validation_notes_param
    WHERE sample_order_id = draft_record.order_id
      AND product_draft_id = product_draft_id_param;

    -- Marquer brouillon comme échantillon refusé
    UPDATE product_drafts SET
      sample_status = 'rejected',
      sample_rejection_reason = validation_notes_param,
      updated_at = NOW()
    WHERE id = product_draft_id_param;
  END IF;

  -- Vérifier si tous les échantillons de la commande sont validés
  SELECT
    NOT EXISTS (
      SELECT 1 FROM sample_order_items
      WHERE sample_order_id = draft_record.order_id
        AND item_status = 'pending'
    ) INTO all_items_validated;

  -- Si tous validés, marquer commande comme terminée
  IF all_items_validated THEN
    UPDATE sample_orders SET
      status = 'validated',
      validated_at = NOW(),
      validated_by = auth.uid(),
      updated_at = NOW()
    WHERE id = draft_record.order_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN approved THEN 'Échantillon validé et produit créé' ELSE 'Échantillon refusé' END,
    'product_id', product_id,
    'all_items_validated', all_items_validated,
    'next_step', CASE WHEN approved THEN 'product_created' ELSE 'sample_rejected' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. VUES DASHBOARD COMMANDES ÉCHANTILLONS
-- ============================================================================

-- Vue commandes échantillons avec détails
CREATE OR REPLACE VIEW sample_orders_with_details AS
SELECT
  so.*,
  o.name as supplier_name,
  COUNT(soi.id) as items_count,
  COUNT(soi.id) FILTER (WHERE soi.item_status = 'approved') as items_approved,
  COUNT(soi.id) FILTER (WHERE soi.item_status = 'rejected') as items_rejected,
  COUNT(soi.id) FILTER (WHERE soi.item_status = 'pending') as items_pending,
  COALESCE(SUM(soi.estimated_cost), 0) as total_estimated_cost,
  COALESCE(SUM(soi.actual_cost), 0) as total_actual_cost
FROM sample_orders so
LEFT JOIN organisations o ON o.id = so.supplier_id
LEFT JOIN sample_order_items soi ON soi.sample_order_id = so.id
GROUP BY so.id, o.name;

-- Vue métriques échantillons groupés
CREATE OR REPLACE VIEW sample_orders_metrics AS
SELECT
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_orders,
  COUNT(*) FILTER (WHERE status = 'requested') as requested_orders,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_orders,
  COUNT(*) FILTER (WHERE status = 'ordered') as ordered_orders,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
  COUNT(*) FILTER (WHERE status = 'validated') as validated_orders,

  SUM(estimated_total_cost) as total_estimated_budget,
  SUM(actual_cost) as total_actual_budget,

  AVG(EXTRACT(EPOCH FROM (delivered_at - ordered_at))/86400) FILTER (WHERE delivered_at IS NOT NULL) as avg_delivery_days,
  AVG(EXTRACT(EPOCH FROM (validated_at - delivered_at))/86400) FILTER (WHERE validated_at IS NOT NULL) as avg_validation_days

FROM sample_orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMIT;

-- ============================================================================
-- COMMENTAIRES UTILISATION
-- ============================================================================

/*
NOUVEAU WORKFLOW ÉCHANTILLONS GROUPÉS:

1. Utilisateur ajoute plusieurs produits nécessitant échantillons du même fournisseur
   → add_sample_to_order() pour chaque produit
   → Commande brouillon automatiquement créée/réutilisée

2. Utilisateur soumet commande groupée
   → submit_sample_order_for_approval()

3. Manager approuve/refuse commande complète
   → approve_sample_order()

4. Commande passée chez fournisseur unique
   → mark_sample_order_placed()

5. Livraison groupée
   → mark_sample_order_delivered()

6. Validation individuelle de chaque échantillon
   → validate_individual_sample() pour chaque produit
   → Auto-création produit catalogue si approuvé

AVANTAGES:
- Optimisation coûts livraison
- Gestion simplifiée fournisseurs
- Traçabilité commandes groupées
- Workflow flexible (validation individuelle)
*/