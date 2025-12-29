-- ============================================================================
-- Migration: Affiliate Order Pending Validation
-- Date: 2025-12-19
-- Description: Ajoute les colonnes pour tracer les commandes créées par les affiliés
--              et leur statut de validation admin
-- ============================================================================

-- 1. Ajouter colonnes pour tracer commandes affiliés
ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS created_by_affiliate_id UUID REFERENCES linkme_affiliates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS pending_admin_validation BOOLEAN DEFAULT false;

-- 2. Commentaires pour documentation
COMMENT ON COLUMN sales_orders.created_by_affiliate_id IS 'ID de l affilié qui a créé la commande (null si créée par admin)';
COMMENT ON COLUMN sales_orders.pending_admin_validation IS 'True si la commande attend validation admin (commandes affiliés)';

-- 3. Index pour filtrage rapide des commandes en attente
CREATE INDEX IF NOT EXISTS idx_sales_orders_pending_validation
ON sales_orders(pending_admin_validation) WHERE pending_admin_validation = true;

-- 4. Index pour recherche par affilié créateur
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_by_affiliate
ON sales_orders(created_by_affiliate_id) WHERE created_by_affiliate_id IS NOT NULL;

-- 5. Vue pour commandes en attente de validation (facilite les requêtes admin)
CREATE OR REPLACE VIEW affiliate_pending_orders AS
SELECT
  so.*,
  la.display_name as affiliate_name,
  la.email as affiliate_email,
  la.affiliate_type,
  ls.name as selection_name
FROM sales_orders so
JOIN linkme_affiliates la ON so.created_by_affiliate_id = la.id
LEFT JOIN linkme_selections ls ON so.linkme_selection_id = ls.id
WHERE so.pending_admin_validation = true
  AND so.status = 'draft';

-- 6. Grant accès à la vue pour les rôles appropriés
GRANT SELECT ON affiliate_pending_orders TO authenticated;

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================
-- DROP VIEW IF EXISTS affiliate_pending_orders;
-- DROP INDEX IF EXISTS idx_sales_orders_pending_validation;
-- DROP INDEX IF EXISTS idx_sales_orders_created_by_affiliate;
-- ALTER TABLE sales_orders DROP COLUMN IF EXISTS pending_admin_validation;
-- ALTER TABLE sales_orders DROP COLUMN IF EXISTS created_by_affiliate_id;
