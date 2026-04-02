-- Module Immobilisations & Amortissements
-- Tables: fixed_assets + fixed_asset_depreciations
-- PCG: classes 20-21 (immobilisations), 28 (amortissements), 68 (dotations)

CREATE TABLE IF NOT EXISTS public.fixed_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  pcg_account varchar(10) NOT NULL DEFAULT '218',
  pcg_amortissement varchar(10) NOT NULL DEFAULT '2818',
  asset_category text NOT NULL DEFAULT 'corporel', -- 'incorporel', 'corporel', 'financier'
  acquisition_date date NOT NULL,
  acquisition_amount numeric(12,2) NOT NULL,
  supplier_name text,
  invoice_reference text,
  depreciation_method text NOT NULL DEFAULT 'lineaire', -- 'lineaire', 'degressif'
  depreciation_duration_years int NOT NULL DEFAULT 5,
  residual_value numeric(12,2) NOT NULL DEFAULT 0,
  total_depreciated numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active', -- 'active', 'fully_depreciated', 'disposed'
  disposal_date date,
  disposal_amount numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(status);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(asset_category);

ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_fixed_assets" ON fixed_assets
  FOR ALL TO authenticated
  USING (is_backoffice_user());

CREATE TABLE IF NOT EXISTS public.fixed_asset_depreciations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_asset_id uuid NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
  fiscal_year int NOT NULL,
  depreciation_amount numeric(12,2) NOT NULL,
  cumulative_amount numeric(12,2) NOT NULL,
  net_book_value numeric(12,2) NOT NULL,
  is_computed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fixed_asset_id, fiscal_year)
);

ALTER TABLE fixed_asset_depreciations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_depreciations" ON fixed_asset_depreciations
  FOR ALL TO authenticated
  USING (is_backoffice_user());

DROP TRIGGER IF EXISTS set_updated_at_fixed_assets ON fixed_assets;
CREATE TRIGGER set_updated_at_fixed_assets
  BEFORE UPDATE ON fixed_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

COMMENT ON TABLE fixed_assets IS 'Immobilisations — actifs amortissables (PCG classes 20-21)';
COMMENT ON TABLE fixed_asset_depreciations IS 'Plan amortissement — une ligne par exercice par immobilisation';
