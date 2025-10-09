-- =====================================================================
-- Migration 006: RPC Functions Facturation
-- Date: 2025-10-11
-- Description: Fonctions Supabase pour création factures
-- =====================================================================

-- =====================================================================
-- FONCTION 1: GÉNÉRER FACTURE DEPUIS COMMANDE
-- =====================================================================

CREATE OR REPLACE FUNCTION generate_invoice_from_order(
  p_sales_order_id UUID
) RETURNS invoices AS $$
DECLARE
  v_invoice invoices;
  v_order sales_orders;
  v_abby_payload JSONB;
  v_total_ht DECIMAL(12,2);
  v_tva_rate DECIMAL(5,4) := 0.20; -- 20% TVA par défaut
  v_tva_amount DECIMAL(12,2);
  v_total_ttc DECIMAL(12,2);
BEGIN
  -- 1. Récupérer commande
  SELECT * INTO v_order
  FROM sales_orders
  WHERE id = p_sales_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commande % introuvable', p_sales_order_id;
  END IF;

  -- 2. Vérifier statut commande
  IF v_order.status NOT IN ('shipped', 'delivered') THEN
    RAISE EXCEPTION 'Statut commande invalide (doit être shipped ou delivered): %', v_order.status;
  END IF;

  -- 3. Vérifier si facture existe déjà
  IF EXISTS (SELECT 1 FROM invoices WHERE sales_order_id = p_sales_order_id) THEN
    RAISE EXCEPTION 'Facture déjà créée pour commande %', v_order.order_number;
  END IF;

  -- 4. Calculer totaux
  SELECT COALESCE(SUM(total_ht), 0) INTO v_total_ht
  FROM sales_order_items
  WHERE sales_order_id = p_sales_order_id;

  IF v_total_ht = 0 THEN
    RAISE EXCEPTION 'Commande % sans items ou montant nul', v_order.order_number;
  END IF;

  v_tva_amount := ROUND(v_total_ht * v_tva_rate, 2);
  v_total_ttc := v_total_ht + v_tva_amount;

  -- 5. Créer facture locale (statut: draft)
  INSERT INTO invoices (
    sales_order_id,
    abby_invoice_id,
    abby_invoice_number,
    invoice_date,
    due_date,
    total_ht,
    total_ttc,
    tva_amount,
    status,
    created_by
  ) VALUES (
    p_sales_order_id,
    'pending_sync_' || gen_random_uuid()::text, -- Temporaire jusqu'à sync Abby
    'PENDING',                                   -- Temporaire
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    v_total_ht,
    v_total_ttc,
    v_tva_amount,
    'draft',
    auth.uid()
  ) RETURNING * INTO v_invoice;

  -- 6. Préparer payload Abby (pour queue sync)
  v_abby_payload := (
    SELECT jsonb_build_object(
      'customerId', o.abby_customer_id,
      'invoiceDate', v_invoice.invoice_date::text,
      'dueDate', v_invoice.due_date::text,
      'reference', v_order.order_number,
      'items', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'description', p.name,
            'quantity', soi.quantity,
            'unitPriceHT', soi.unit_price_ht,
            'tvaRate', 20
          )
        )
        FROM sales_order_items soi
        JOIN products p ON soi.product_id = p.id
        WHERE soi.sales_order_id = p_sales_order_id
      )
    )
    FROM organisations o
    WHERE o.id = v_order.customer_id
  );

  -- 7. Ajouter à queue sync Abby
  INSERT INTO abby_sync_queue (
    operation,
    entity_type,
    entity_id,
    abby_payload,
    status,
    created_by
  ) VALUES (
    'create_invoice',
    'invoice',
    v_invoice.id,
    v_abby_payload,
    'pending',
    auth.uid()
  );

  RAISE NOTICE 'Facture créée (ID: %) pour commande % - En attente sync Abby',
    v_invoice.id, v_order.order_number;

  RETURN v_invoice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_invoice_from_order IS
  'Génère facture depuis commande (status shipped/delivered) et ajoute à queue sync Abby';

-- =====================================================================
-- FONCTION 2: HANDLER WEBHOOK INVOICE.PAID
-- =====================================================================

CREATE OR REPLACE FUNCTION handle_abby_webhook_invoice_paid(
  p_abby_invoice_id TEXT,
  p_payment_amount DECIMAL(12,2),
  p_payment_date DATE,
  p_payment_method TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_invoice_total DECIMAL(12,2);
  v_total_paid DECIMAL(12,2);
  v_new_status TEXT;
BEGIN
  -- 1. Récupérer facture depuis abby_invoice_id
  SELECT id, abby_invoice_number, total_ttc INTO v_invoice_id, v_invoice_number, v_invoice_total
  FROM invoices
  WHERE abby_invoice_id = p_abby_invoice_id;

  IF v_invoice_id IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Invoice not found',
      'abby_invoice_id', p_abby_invoice_id
    );
  END IF;

  -- 2. Créer payment record
  INSERT INTO payments (
    invoice_id,
    amount_paid,
    payment_date,
    payment_method,
    synced_from_abby_at
  ) VALUES (
    v_invoice_id,
    p_payment_amount,
    p_payment_date,
    p_payment_method,
    NOW()
  );

  -- 3. Calculer total payé (trigger update_invoice_status_on_payment se déclenche automatiquement)
  SELECT COALESCE(SUM(amount_paid), 0) INTO v_total_paid
  FROM payments
  WHERE invoice_id = v_invoice_id;

  -- 4. Récupérer nouveau statut (mis à jour par trigger)
  SELECT status INTO v_new_status
  FROM invoices
  WHERE id = v_invoice_id;

  RAISE NOTICE 'Webhook invoice.paid traité: Invoice % - Montant %.2f€ - Nouveau statut: %',
    v_invoice_number, p_payment_amount, v_new_status;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'new_status', v_new_status,
    'total_paid', v_total_paid,
    'invoice_total', v_invoice_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_abby_webhook_invoice_paid IS
  'Traite webhook Abby invoice.paid: crée payment, met à jour statut facture';
