-- =====================================================================
-- [BO-CONSULT-P9-001] Consultation projet : besoins, marges, frais par fournisseur
-- =====================================================================
-- Programme 2026-09-12 ligne A7 (P9 révisé) ; rapport sourcing/consultations
-- 2026-09-11 § 8.3 ; complément 2026-09-11 § 1 (décision Roméo : port, douane
-- et autres frais saisis PAR FOURNISSEUR, pas par projet).
--
-- Additif uniquement (expansion, rien n'est retiré) :
--   1. consultation_needs : les besoins du client (« 20 plateaux bois »). Un
--      besoin n'a ni produit, ni fournisseur, ni coût, n'est jamais commandé :
--      entité distincte d'une option (règle 1 de database-modeling-patterns).
--   2. consultation_products + need_id, margin_percentage ; statut élargi à
--      'candidate' (comparaison interne avant proposition). Les valeurs
--      existantes restent acceptées ; la contraction viendra plus tard.
--   3. client_consultations + default_margin_percentage (marge du projet).
--   4. consultation_supplier_costs : frais saisis une fois par fournisseur dans
--      une consultation, répartis par le calcul pur (consultation-economics)
--      au prorata de la valeur de ligne sur les seules lignes de ce fournisseur.
-- Abandonné (décision Roméo 2026-09-11) : client_consultations.shipping_cost_ht
-- et customs_cost_ht. consultation_products.shipping_cost reste le frais propre
-- à une ligne, ajouté à la part fournisseur.
--
-- Sécurité : RLS back-office (is_backoffice_user()) sur les 2 nouvelles tables ;
-- aucun droit pour anon ni PUBLIC (règle R-GRANT) ; authenticated limité à
-- SELECT/INSERT/UPDATE/DELETE. Aucune nouvelle fonction : updated_at via
-- update_updated_at_column() existante. Aucun déclencheur stock touché.
--
-- Volumes au 2026-09-13 : client_consultations 6, consultation_products 6
-- (pending 4, approved 2) — ajout de colonnes et revalidation instantanés.
--
-- Application : via execute_sql après accord écrit de Roméo (« OK P9 »),
-- jamais `supabase db push` ; inscription au carnet schema_migrations ;
-- régénération des types dans la même PR.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- 1. Besoins du client ---------------------------------------------------
CREATE TABLE public.consultation_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL
    REFERENCES public.client_consultations(id) ON DELETE CASCADE,
  label text NOT NULL
    CONSTRAINT consultation_needs_label_check CHECK (length(trim(label)) > 0),
  quantity integer NOT NULL
    CONSTRAINT consultation_needs_quantity_check CHECK (quantity > 0),
  target_unit_price_ht numeric NULL
    CONSTRAINT consultation_needs_target_unit_price_ht_check CHECK (target_unit_price_ht >= 0),
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX consultation_needs_consultation_id_idx
  ON public.consultation_needs (consultation_id);

CREATE TRIGGER trigger_consultation_needs_updated_at
  BEFORE UPDATE ON public.consultation_needs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Options de consultation ---------------------------------------------
ALTER TABLE public.consultation_products
  ADD COLUMN need_id uuid NULL
    REFERENCES public.consultation_needs(id) ON DELETE SET NULL,
  ADD COLUMN margin_percentage numeric NULL
    CONSTRAINT consultation_products_margin_percentage_check
      CHECK (margin_percentage >= 0 AND margin_percentage <= 1000),
  DROP CONSTRAINT consultation_products_status_check,
  ADD CONSTRAINT consultation_products_status_check
    CHECK (status = ANY (ARRAY[
      'pending'::text, 'approved'::text, 'rejected'::text,
      'revision_needed'::text, 'ordered'::text, 'candidate'::text
    ]));

CREATE INDEX consultation_products_need_id_idx
  ON public.consultation_products (need_id);

-- 3. Marge du projet ------------------------------------------------------
ALTER TABLE public.client_consultations
  ADD COLUMN default_margin_percentage numeric NULL
    CONSTRAINT client_consultations_default_margin_percentage_check
      CHECK (default_margin_percentage >= 0 AND default_margin_percentage <= 1000);

-- 4. Frais par fournisseur ------------------------------------------------
CREATE TABLE public.consultation_supplier_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL
    REFERENCES public.client_consultations(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL
    REFERENCES public.organisations(id) ON DELETE RESTRICT,
  shipping_cost_ht numeric NOT NULL DEFAULT 0
    CONSTRAINT consultation_supplier_costs_shipping_cost_ht_check CHECK (shipping_cost_ht >= 0),
  customs_cost_ht numeric NOT NULL DEFAULT 0
    CONSTRAINT consultation_supplier_costs_customs_cost_ht_check CHECK (customs_cost_ht >= 0),
  other_cost_ht numeric NOT NULL DEFAULT 0
    CONSTRAINT consultation_supplier_costs_other_cost_ht_check CHECK (other_cost_ht >= 0),
  other_cost_label text,
  currency text NOT NULL DEFAULT 'EUR'
    CONSTRAINT consultation_supplier_costs_currency_check CHECK (currency ~ '^[A-Z]{3}$'),
  notes text,
  created_by uuid DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consultation_supplier_costs_consultation_supplier_key
    UNIQUE (consultation_id, supplier_id)
);

CREATE INDEX consultation_supplier_costs_supplier_id_idx
  ON public.consultation_supplier_costs (supplier_id);

CREATE TRIGGER trigger_consultation_supplier_costs_updated_at
  BEFORE UPDATE ON public.consultation_supplier_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Sécurité -------------------------------------------------------------
ALTER TABLE public.consultation_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_supplier_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_manage_consultation_needs
  ON public.consultation_needs
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

CREATE POLICY staff_manage_consultation_supplier_costs
  ON public.consultation_supplier_costs
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

REVOKE ALL ON public.consultation_needs, public.consultation_supplier_costs
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.consultation_needs, public.consultation_supplier_costs
  TO authenticated;

-- 6. Documentation --------------------------------------------------------
COMMENT ON TABLE public.consultation_needs IS
  'Besoins exprimés par le client dans une consultation projet (BO-CONSULT-P9-001). Pas de produit ni de coût : les options (consultation_products) s''y rattachent via need_id.';
COMMENT ON COLUMN public.consultation_products.need_id IS
  'Besoin auquel répond cette option (BO-CONSULT-P9-001). NULL = option hors besoin. Plusieurs options choisies par besoin autorisées.';
COMMENT ON COLUMN public.consultation_products.margin_percentage IS
  'Marge de la ligne en % sur le prix de revient (BO-CONSULT-P9-001). Prioritaire sur client_consultations.default_margin_percentage.';
COMMENT ON COLUMN public.client_consultations.default_margin_percentage IS
  'Marge par défaut du projet en % sur le prix de revient (BO-CONSULT-P9-001).';
COMMENT ON TABLE public.consultation_supplier_costs IS
  'Port, douane et autres frais saisis une fois par fournisseur dans une consultation (décision Roméo 2026-09-11, BO-CONSULT-P9-001). Répartis par le calcul au prorata de la valeur de ligne sur les seules lignes de ce fournisseur ; jamais stockés par ligne.';

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (à n'exécuter que sur décision de Roméo) :
-- les lignes au statut 'candidate' doivent d'abord repasser à 'pending'.
-- ---------------------------------------------------------------------
-- BEGIN;
-- SET LOCAL lock_timeout = '5s';
-- DROP TABLE public.consultation_supplier_costs;
-- ALTER TABLE public.client_consultations
--   DROP COLUMN default_margin_percentage;
-- UPDATE public.consultation_products SET status = 'pending' WHERE status = 'candidate';
-- ALTER TABLE public.consultation_products
--   DROP CONSTRAINT consultation_products_status_check,
--   ADD CONSTRAINT consultation_products_status_check
--     CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text,
--                                'revision_needed'::text, 'ordered'::text])),
--   DROP COLUMN margin_percentage,
--   DROP COLUMN need_id;
-- DROP TABLE public.consultation_needs;
-- COMMIT;
