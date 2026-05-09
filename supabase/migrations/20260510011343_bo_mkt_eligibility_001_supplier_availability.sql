-- Sprint BO-MKT-ELIGIBILITY-001 — Sprint 2/3
-- Suivi disponibilité fournisseur + relance 90 jours

ALTER TABLE products
  ADD COLUMN supplier_availability_status text NOT NULL DEFAULT 'to_check'
    CHECK (supplier_availability_status IN ('available', 'unavailable', 'to_check')),
  ADD COLUMN supplier_last_checked_at timestamptz,
  ADD COLUMN supplier_last_checked_by uuid REFERENCES auth.users(id),
  ADD COLUMN supplier_availability_notes text;

COMMENT ON COLUMN products.supplier_availability_status IS
  'État connu chez le fournisseur : available, unavailable, to_check. Mise à jour manuelle, déclenche relance auto à 90 j.';
COMMENT ON COLUMN products.supplier_last_checked_at IS
  'Date dernière vérif manuelle. Si NULL ou > 90j, l''UI propose une re-vérification.';
