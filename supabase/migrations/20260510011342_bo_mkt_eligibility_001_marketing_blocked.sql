-- Sprint BO-MKT-ELIGIBILITY-001 — Sprint 1/3
-- Marketing eligibility : flag d'override manuel + fonction d'éligibilité

ALTER TABLE products
  ADD COLUMN marketing_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN marketing_blocked_reason text;

COMMENT ON COLUMN products.marketing_blocked IS
  'Override manuel : si true, le produit est exclu du marketing (Studio IA, bibliothèque, agents Cowork) même s''il est actif et publié.';
COMMENT ON COLUMN products.marketing_blocked_reason IS
  'Raison libre du blocage marketing (ex: "stock écoulé", "litige fournisseur").';

-- Fonction stable d'éligibilité — calcule à la volée, pas de colonne dérivée
-- Règle :
--   - non archivé
--   - product_status IN ('active','preorder')
--   - marketing_blocked = false
--   - publié au moins sur le site OU actif sur Meta Commerce
CREATE OR REPLACE FUNCTION is_product_marketing_eligible(p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = p_product_id
      AND p.archived_at IS NULL
      AND p.product_status IN ('active', 'preorder')
      AND p.marketing_blocked = false
      AND (
        p.is_published_online = true
        OR EXISTS (
          SELECT 1 FROM meta_commerce_syncs m
          WHERE m.product_id = p.id AND m.meta_status = 'active'
        )
      )
  );
$$;

COMMENT ON FUNCTION is_product_marketing_eligible(uuid) IS
  'Renvoie true si un produit est éligible pour le marketing (catalogue + Meta + statut + override).';
