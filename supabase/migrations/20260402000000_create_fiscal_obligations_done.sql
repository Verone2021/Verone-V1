-- Table pour stocker les obligations fiscales marquees comme faites
CREATE TABLE IF NOT EXISTS public.fiscal_obligations_done (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  completed_by uuid REFERENCES auth.users(id),
  notes text,
  UNIQUE(obligation_id)
);

ALTER TABLE fiscal_obligations_done ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_fiscal_done" ON fiscal_obligations_done
  FOR ALL TO authenticated
  USING (is_backoffice_user());

COMMENT ON TABLE fiscal_obligations_done IS 'Obligations fiscales marquees comme completees dans l echeancier fiscal.';
