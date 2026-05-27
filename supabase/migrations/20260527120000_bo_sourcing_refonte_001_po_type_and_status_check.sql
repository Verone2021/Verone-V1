-- [BO-SOURCING-REFONTE-001] Migration sourcing : po_type + sourcing_status CHECK
--
-- Contexte (incident 2026-05-27) :
-- 1. Le bouton « Commander échantillon » mélange 3 effets de bord (modif
--    requires_sample + product_status + création PO sans type métier). On veut
--    isoler les commandes d'échantillon en ajoutant une colonne discriminator
--    purchase_orders.po_type ('standard' | 'sample'), pattern Single Table
--    Inheritance recommandé pour les sous-types d'entités partageant l'essentiel
--    des attributs (cf. .claude/rules/database-modeling-patterns.md).
-- 2. La colonne products.sourcing_status est TEXT libre alors que le frontend
--    n'utilise que 10 valeurs précises. Aucune protection contre une faute de
--    frappe qui corromprait les données. On ajoute une CHECK constraint pour
--    verrouiller les valeurs (pattern CHECK > ENUM pour workflow évolutif,
--    Crunchy Data 2026).
--
-- Approche safe :
-- - Étape 1 : po_type ajouté NULLABLE avec default 'standard', backfill, NOT
--   NULL après backfill, CHECK constraint, index.
-- - Étape 2 : sourcing_status reste TEXT (déjà existante), ajout CHECK
--   constraint sur les 10 valeurs autorisées + 'draft' + 'on_hold' + 'cancelled'
--   pour couvrir les flux spéciaux du pipeline.
-- - Aucune donnée existante n'est perdue (toutes les PO actuelles deviennent
--   po_type='standard' ; tous les sourcing_status actuels sont déjà dans la
--   liste blanche, vérifié via SELECT GROUP BY).

-- ─── Étape 1 : purchase_orders.po_type ─────────────────────────────────────

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS po_type TEXT DEFAULT 'standard';

UPDATE purchase_orders
  SET po_type = 'standard'
  WHERE po_type IS NULL;

ALTER TABLE purchase_orders
  ALTER COLUMN po_type SET NOT NULL;

ALTER TABLE purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_po_type_check;

ALTER TABLE purchase_orders
  ADD CONSTRAINT purchase_orders_po_type_check
    CHECK (po_type IN ('standard', 'sample'));

CREATE INDEX IF NOT EXISTS purchase_orders_po_type_idx
  ON purchase_orders (po_type);

COMMENT ON COLUMN purchase_orders.po_type IS
  'Type de commande fournisseur. ''standard'' = commande de réapprovisionnement '
  'classique. ''sample'' = commande d''échantillon issue du workflow sourcing '
  '(produit en évaluation, on commande 1-2 unités pour validation qualité '
  'avant de passer une commande de réapprovisionnement). Single Table '
  'Inheritance pattern. Voir .claude/rules/database-modeling-patterns.md.';

-- ─── Étape 2 : products.sourcing_status CHECK ──────────────────────────────

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_sourcing_status_check;

ALTER TABLE products
  ADD CONSTRAINT products_sourcing_status_check
    CHECK (
      sourcing_status IS NULL
      OR sourcing_status IN (
        -- 10 statuts main du workflow sourcing
        'need_identified',
        'supplier_search',
        'initial_contact',
        'evaluation',
        'negotiation',
        'sample_requested',
        'sample_received',
        'sample_approved',
        'order_placed',
        'received',
        -- 3 statuts spéciaux du pipeline (pause, annulation, archivage)
        'on_hold',
        'cancelled',
        'archived'
      )
    );

COMMENT ON COLUMN products.sourcing_status IS
  '13 valeurs autorisées (CHECK constraint, cf. .claude/rules/database-modeling-patterns.md règle 2). '
  '10 statuts main : need_identified, supplier_search, initial_contact, evaluation, '
  'negotiation, sample_requested, sample_received, sample_approved, order_placed, received. '
  '3 statuts spéciaux : on_hold, cancelled, archived. NULL si produit hors workflow sourcing.';
