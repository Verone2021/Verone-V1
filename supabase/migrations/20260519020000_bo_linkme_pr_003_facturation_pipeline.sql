-- =============================================================================
-- [BO-LINKME-PR-003] Pipeline facturation / trésorerie LinkMe
-- =============================================================================
-- Objectif : faire entrer chaque facture LinkMe déposée par un affilié comme
-- `expense` (outbound / supplier) dans `financial_documents`, visible dans
-- /finance/transactions et /finance/tresorerie. Sortir `invoice_received` du
-- champ status (incohérent : on peut être à la fois "payé" et "facture pas
-- reçue"). Sécuriser le bucket linkme-invoices.
--
-- Choix techniques :
-- - Type `expense` (pas `supplier_invoice`) car les commissions LinkMe n'ont
--   pas de purchase_order rattaché — supplier_invoice impose un PO.
-- - Direction `outbound` (sortie d'argent) + partner_type `supplier`.
-- - invoice_source `uploaded` (depuis le PDF affilié), pas de valeur 'linkme'
--   acceptée par le CHECK existant.
-- - Résolution affilié → organisation parente via
--   `organisations.enseigne_id` + `is_enseigne_parent = true`.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Nouvelles colonnes sur linkme_payment_requests
-- -----------------------------------------------------------------------------

ALTER TABLE linkme_payment_requests
  ADD COLUMN IF NOT EXISTS invoice_received boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS financial_document_id uuid REFERENCES financial_documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_linkme_payment_requests_financial_document_id
  ON linkme_payment_requests(financial_document_id);

COMMENT ON COLUMN linkme_payment_requests.invoice_received IS
  'Flag indépendant du status. TRUE quand l''affilié a déposé sa facture, peu importe si la demande est payée ou non.';
COMMENT ON COLUMN linkme_payment_requests.financial_document_id IS
  'FK vers le financial_documents (expense) créé automatiquement au dépôt de facture.';

-- -----------------------------------------------------------------------------
-- 2. Backfill : status='invoice_received' → invoice_received=true
-- -----------------------------------------------------------------------------

UPDATE linkme_payment_requests
SET invoice_received = true,
    status = 'pending'
WHERE status = 'invoice_received';

UPDATE linkme_payment_requests
SET invoice_received = true
WHERE status IN ('paid','partially_paid') AND invoice_file_url IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. CHECK status simplifié (retire 'invoice_received')
-- -----------------------------------------------------------------------------

ALTER TABLE linkme_payment_requests
  DROP CONSTRAINT linkme_payment_requests_status_check;

ALTER TABLE linkme_payment_requests
  ADD CONSTRAINT linkme_payment_requests_status_check
  CHECK (status IN ('pending','partially_paid','paid','cancelled'));

-- -----------------------------------------------------------------------------
-- 4. Fonction de résolution affilié → organisation parente
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_affiliate_partner_organisation_id(p_affiliate_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    la.organisation_id,
    (
      SELECT o.id
      FROM organisations o
      WHERE o.enseigne_id = la.enseigne_id
        AND o.is_enseigne_parent = true
        AND o.archived_at IS NULL
      LIMIT 1
    )
  )
  FROM linkme_affiliates la
  WHERE la.id = p_affiliate_id;
$$;

COMMENT ON FUNCTION get_affiliate_partner_organisation_id(uuid) IS
  'Résout l''organisation parente d''un affilié LinkMe : soit son organisation_id direct, soit la maison mère liée à son enseigne (organisations.enseigne_id + is_enseigne_parent = true). Retourne NULL si aucun rattachement.';

GRANT EXECUTE ON FUNCTION get_affiliate_partner_organisation_id(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Trigger function : créer un expense automatiquement quand invoice_received passe à true
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION tg_linkme_create_expense_on_invoice_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_org_id uuid;
  v_doc_id uuid;
  v_billing_address jsonb;
  v_doc_number text;
  v_created_by uuid;
  v_tva_amount numeric;
BEGIN
  -- Garde : passage strict false → true ET pas déjà lié à un document
  IF NOT (COALESCE(OLD.invoice_received, false) = false AND NEW.invoice_received = true) THEN
    RETURN NEW;
  END IF;

  IF NEW.financial_document_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Résoudre l'organisation parente
  v_partner_org_id := get_affiliate_partner_organisation_id(NEW.affiliate_id);

  IF v_partner_org_id IS NULL THEN
    RAISE EXCEPTION 'Impossible de créer la dépense LinkMe : l''affilié % n''a pas d''organisation parente (ni organisation_id direct, ni maison mère is_enseigne_parent liée à son enseigne). Contacte le support pour rattacher l''enseigne à une organisation.', NEW.affiliate_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  -- Construire billing_address à partir de l'organisation (snapshot)
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'line1', COALESCE(o.billing_address_line1, o.address_line1),
    'line2', COALESCE(o.billing_address_line2, o.address_line2),
    'postal_code', COALESCE(o.billing_postal_code, o.postal_code),
    'city', COALESCE(o.billing_city, o.city),
    'country', COALESCE(o.billing_country, o.country, 'FR'),
    'legal_name', o.legal_name,
    'siret', o.siret,
    'vat_number', o.vat_number
  ))
  INTO v_billing_address
  FROM organisations o
  WHERE o.id = v_partner_org_id;

  -- jsonb_strip_nulls peut renvoyer un objet vide — garantir au moins un champ
  IF v_billing_address IS NULL OR v_billing_address = '{}'::jsonb THEN
    v_billing_address := jsonb_build_object('country', 'FR');
  END IF;

  -- Numéro de document : LM-<request_number> (request_number est UNIQUE)
  v_doc_number := 'LM-' || NEW.request_number;

  -- created_by : auth.uid() si dispo (cas affilié connecté), sinon paid_by,
  -- sinon 1er admin back-office actif (fallback service_role)
  v_created_by := COALESCE(
    (SELECT auth.uid()),
    NEW.paid_by,
    (
      SELECT uar.user_id
      FROM user_app_roles uar
      WHERE uar.app = 'back-office'
        AND uar.role = 'admin'
        AND uar.is_active = true
      ORDER BY uar.created_at
      LIMIT 1
    )
  );

  IF v_created_by IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur identifié pour créer la dépense LinkMe (auth.uid, paid_by et fallback admin tous NULL).';
  END IF;

  v_tva_amount := NEW.total_amount_ttc - NEW.total_amount_ht;

  -- INSERT financial_documents (expense + outbound + supplier)
  INSERT INTO financial_documents (
    document_type, document_direction, partner_id, partner_type,
    document_number, document_date, due_date,
    total_ht, total_ttc, tva_amount,
    status, invoice_source, pcg_code,
    uploaded_file_url, uploaded_file_name,
    billing_address, description, notes,
    created_by, revision_number, linkme_affiliate_id
  )
  VALUES (
    'expense', 'outbound', v_partner_org_id, 'supplier',
    v_doc_number,
    COALESCE(NEW.invoice_received_at::date, CURRENT_DATE),
    COALESCE(NEW.invoice_received_at::date, CURRENT_DATE) + INTERVAL '30 days',
    NEW.total_amount_ht, NEW.total_amount_ttc, v_tva_amount,
    'draft', 'uploaded', '622100',
    NEW.invoice_file_url, NEW.invoice_file_name,
    v_billing_address,
    'Commissions LinkMe — demande ' || NEW.request_number,
    'Document créé automatiquement par le dépôt de facture LinkMe.',
    v_created_by, 1, NEW.affiliate_id
  )
  RETURNING id INTO v_doc_id;

  -- Ligne d'item agrégée (la facture déposée par l'affilié contient déjà les détails)
  INSERT INTO financial_document_items (
    document_id, description, quantity, unit_price_ht,
    total_ht, tva_rate, tva_amount, total_ttc, sort_order
  )
  VALUES (
    v_doc_id,
    'Commissions LinkMe — ' || NEW.request_number,
    1, NEW.total_amount_ht,
    NEW.total_amount_ht, COALESCE(NEW.tax_rate, 0.20),
    v_tva_amount, NEW.total_amount_ttc, 0
  );

  -- Lier la demande au document
  NEW.financial_document_id := v_doc_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_linkme_create_expense_on_invoice_received ON linkme_payment_requests;

CREATE TRIGGER tg_linkme_create_expense_on_invoice_received
  BEFORE UPDATE OF invoice_received ON linkme_payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION tg_linkme_create_expense_on_invoice_received();

-- -----------------------------------------------------------------------------
-- 6. Storage policies sur linkme-invoices (alignées avec path {request_id}/...)
-- -----------------------------------------------------------------------------
-- Path attendu : {request_id}/{timestamp}.{ext}
-- Anciennes policies basées sur auth.uid() comme premier folder : retirées
-- (incohérentes avec le code linkme actuel qui utilise 'invoices/...').

DROP POLICY IF EXISTS affiliates_upload_invoice ON storage.objects;
DROP POLICY IF EXISTS affiliates_read_own_invoice ON storage.objects;
DROP POLICY IF EXISTS affiliates_delete_own_invoice ON storage.objects;
DROP POLICY IF EXISTS staff_read_invoices ON storage.objects;
DROP POLICY IF EXISTS affiliates_manage_own_invoice ON storage.objects;
DROP POLICY IF EXISTS staff_manage_all_invoices ON storage.objects;

CREATE POLICY linkme_invoices_affiliate_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'linkme-invoices'
    AND EXISTS (
      SELECT 1
      FROM linkme_payment_requests pr
      JOIN linkme_affiliates la ON la.id = pr.affiliate_id
      JOIN user_app_roles uar ON uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
      WHERE pr.id::text = (storage.foldername(name))[1]
        AND (
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  );

CREATE POLICY linkme_invoices_affiliate_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'linkme-invoices'
    AND EXISTS (
      SELECT 1
      FROM linkme_payment_requests pr
      JOIN linkme_affiliates la ON la.id = pr.affiliate_id
      JOIN user_app_roles uar ON uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
      WHERE pr.id::text = (storage.foldername(name))[1]
        AND pr.status = 'pending'  -- pas d'upload après paiement
        AND (
          (la.organisation_id IS NOT NULL AND la.organisation_id = uar.organisation_id)
          OR (la.enseigne_id IS NOT NULL AND la.enseigne_id = uar.enseigne_id)
        )
    )
  );

CREATE POLICY linkme_invoices_staff_all ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'linkme-invoices' AND is_backoffice_user())
  WITH CHECK (bucket_id = 'linkme-invoices' AND is_backoffice_user());

COMMIT;
