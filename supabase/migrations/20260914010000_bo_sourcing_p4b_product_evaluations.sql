-- =====================================================================
-- [BO-SOURCING-P4B-001] Grille d'évaluation produit simplifiée
-- =====================================================================
-- Décisions de Roméo (audit sourcing 2026-09-12 § 7 + grilles simplifiées du
-- 2026-09-13) : une seule évaluation, remplie à la réception de l'échantillon
-- (D2) ; 3 critères notés de 1 à 5 + un contrôle sécurité ; moyenne simple ; le
-- score PROPOSE, Roméo décide (D4). Score et suggestion sont calculés à l'écran
-- (packages/@verone/products/src/utils/product-evaluation.ts), jamais stockés.
--
--   1. product_evaluations : une ligne par évaluation, liée au produit (RESTRICT :
--      un produit évalué ne disparaît pas avec son historique), au fournisseur
--      (RESTRICT) et à la ligne de commande échantillon (SET NULL, UNIQUE : une
--      évaluation par échantillon).
--   2. sourcing_photos.evaluation_id : photos d'échantillon et de défauts
--      rattachées à l'évaluation (SET NULL).
--   3. RLS back-office (is_backoffice_user), aucun droit anon.
--
-- Aucun déclencheur stock touché. Aucune donnée existante réécrite
-- (sourcing_photos : 0 ligne au 2026-09-14).
--
-- Application : via execute_sql après accord écrit de Roméo, jamais
-- `supabase db push` ; inscription au carnet ; types régénérés dans la même PR.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- 1. Évaluations ---------------------------------------------------------------
CREATE TABLE public.product_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  supplier_id uuid NULL REFERENCES public.organisations(id) ON DELETE RESTRICT,
  purchase_order_item_id uuid NULL REFERENCES public.purchase_order_items(id) ON DELETE SET NULL,
  score_conformity smallint NULL
    CONSTRAINT product_evaluations_score_conformity_check CHECK (score_conformity BETWEEN 1 AND 5),
  score_build_finish smallint NULL
    CONSTRAINT product_evaluations_score_build_finish_check CHECK (score_build_finish BETWEEN 1 AND 5),
  score_packaging smallint NULL
    CONSTRAINT product_evaluations_score_packaging_check CHECK (score_packaging BETWEEN 1 AND 5),
  safety_check text NOT NULL DEFAULT 'to_check'
    CONSTRAINT product_evaluations_safety_check_check CHECK (safety_check IN ('ok', 'ko', 'to_check')),
  notes text NULL,
  evaluated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_evaluations_purchase_order_item_key UNIQUE (purchase_order_item_id)
);

CREATE INDEX product_evaluations_product_id_idx
  ON public.product_evaluations (product_id);

CREATE TRIGGER trigger_product_evaluations_updated_at
  BEFORE UPDATE ON public.product_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.product_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_manage_product_evaluations ON public.product_evaluations
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

REVOKE ALL ON public.product_evaluations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_evaluations TO authenticated;
GRANT ALL ON public.product_evaluations TO service_role;

-- 2. Photos rattachées à l'évaluation ----------------------------------------------
ALTER TABLE public.sourcing_photos
  ADD COLUMN evaluation_id uuid NULL REFERENCES public.product_evaluations(id) ON DELETE SET NULL;

CREATE INDEX sourcing_photos_evaluation_id_idx
  ON public.sourcing_photos (evaluation_id);

-- 3. Documentation -------------------------------------------------------------------
COMMENT ON TABLE public.product_evaluations IS
  'Évaluation d''un produit à la réception de son échantillon (BO-SOURCING-P4B-001) : 3 critères notés 1 à 5 + contrôle sécurité. Moyenne et suggestion calculées à l''écran, jamais stockées ; la décision reste celle de Roméo.';
COMMENT ON COLUMN public.product_evaluations.purchase_order_item_id IS
  'Ligne de commande échantillon évaluée ; une seule évaluation par échantillon (UNIQUE).';
COMMENT ON COLUMN public.product_evaluations.safety_check IS
  'ok = conforme · ko = non conforme (refus proposé) · to_check = à vérifier.';
COMMENT ON COLUMN public.sourcing_photos.evaluation_id IS
  'Évaluation à laquelle la photo (échantillon reçu, défaut) est rattachée (BO-SOURCING-P4B-001).';

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (sur décision de Roméo ; les évaluations saisies sont perdues) :
-- ---------------------------------------------------------------------
-- BEGIN;
-- SET LOCAL lock_timeout = '5s';
-- DROP INDEX public.sourcing_photos_evaluation_id_idx;
-- ALTER TABLE public.sourcing_photos DROP COLUMN evaluation_id;
-- DROP TABLE public.product_evaluations;
-- COMMIT;
