-- =====================================================================
-- Migration: Cash vs Accrual Views + Payment Propagation
-- Date: 2025-12-22
-- Description:
--   - Vue cash_movements : mouvements trésorerie réels (cash basis)
--   - Vue accrual_journal : écritures comptables (accrual basis)
--   - Calcul COGS/marge automatique si prix achat connu
--   - Triggers propagation paiement vers commandes/factures
-- =====================================================================

-- =====================================================================
-- 1. VUE CASH_MOVEMENTS (Trésorerie - Base Encaissement)
-- =====================================================================

CREATE OR REPLACE VIEW cash_movements AS
SELECT
    bt.id AS movement_id,
    bt.transaction_id AS bank_transaction_id,
    bt.settled_at AS movement_date,
    bt.amount,
    bt.currency,
    bt.side, -- 'credit' (entrée) ou 'debit' (sortie)
    bt.operation_type,
    bt.label AS description,
    bt.counterparty_name,

    -- Classification cash
    CASE
        WHEN bt.side = 'credit' THEN 'inflow'
        ELSE 'outflow'
    END AS flow_direction,

    -- Catégorisation automatique
    CASE
        -- Entrées
        WHEN bt.side = 'credit' AND fd.document_type = 'customer_invoice' THEN 'ventes_encaissees'
        WHEN bt.side = 'credit' AND bt.operation_type = 'transfer' THEN 'virement_entrant'
        WHEN bt.side = 'credit' THEN 'autres_recettes'
        -- Sorties
        WHEN bt.side = 'debit' AND fd.document_type = 'supplier_invoice' THEN 'achats_decaisses'
        WHEN bt.side = 'debit' AND bt.operation_type = 'transfer' THEN 'virement_sortant'
        WHEN bt.side = 'debit' AND bt.operation_type IN ('card_operation', 'direct_debit') THEN 'depenses'
        ELSE 'autres_mouvements'
    END AS category,

    -- Lien document si matched
    bt.matched_document_id,
    fd.document_type,
    fd.document_number,

    -- Métadonnées
    bt.bank_account_id,
    bt.synced_at,
    bt.created_at

FROM bank_transactions bt
LEFT JOIN financial_documents fd ON bt.matched_document_id = fd.id
WHERE bt.settled_at IS NOT NULL  -- Seulement les mouvements réellement exécutés
ORDER BY bt.settled_at DESC;

COMMENT ON VIEW cash_movements IS 'Vue trésorerie réelle (cash basis) - mouvements encaissés/décaissés';

-- =====================================================================
-- 2. VUE ACCRUAL_JOURNAL (Comptabilité d'engagement)
-- =====================================================================

CREATE OR REPLACE VIEW accrual_journal AS
-- Factures clients (produits)
SELECT
    fd.id AS entry_id,
    fd.document_date AS entry_date,
    fd.document_type,
    fd.document_number,
    fd.partner_id,
    org.legal_name AS partner_name,

    -- Comptes comptables (plan comptable français)
    '411' AS debit_account,  -- Clients
    '70' AS credit_account,   -- Ventes
    fd.total_ht AS amount_ht,
    fd.tva_amount AS tva_amount,
    fd.total_ttc AS amount_ttc,

    'revenue' AS entry_type,
    fd.status,
    fd.amount_paid,
    fd.total_ttc - fd.amount_paid AS amount_due,

    -- Statut paiement
    CASE
        WHEN fd.status = 'paid' THEN 'encaisse'
        WHEN fd.status = 'partially_paid' THEN 'partiellement_encaisse'
        WHEN fd.due_date < CURRENT_DATE AND fd.status NOT IN ('paid', 'cancelled') THEN 'en_retard'
        ELSE 'a_encaisser'
    END AS payment_status,

    fd.created_at,
    fd.updated_at

FROM financial_documents fd
LEFT JOIN organisations org ON fd.partner_id = org.id
WHERE fd.document_type IN ('customer_invoice', 'customer_credit_note')
  AND fd.deleted_at IS NULL

UNION ALL

-- Factures fournisseurs (charges)
SELECT
    fd.id AS entry_id,
    fd.document_date AS entry_date,
    fd.document_type,
    fd.document_number,
    fd.partner_id,
    org.legal_name AS partner_name,

    -- Comptes comptables
    '60' AS debit_account,    -- Achats
    '401' AS credit_account,  -- Fournisseurs
    fd.total_ht AS amount_ht,
    fd.tva_amount AS tva_amount,
    fd.total_ttc AS amount_ttc,

    'expense' AS entry_type,
    fd.status,
    fd.amount_paid,
    fd.total_ttc - fd.amount_paid AS amount_due,

    CASE
        WHEN fd.status = 'paid' THEN 'decaisse'
        WHEN fd.status = 'partially_paid' THEN 'partiellement_decaisse'
        WHEN fd.due_date < CURRENT_DATE AND fd.status NOT IN ('paid', 'cancelled') THEN 'en_retard'
        ELSE 'a_decaisser'
    END AS payment_status,

    fd.created_at,
    fd.updated_at

FROM financial_documents fd
LEFT JOIN organisations org ON fd.partner_id = org.id
WHERE fd.document_type IN ('supplier_invoice', 'supplier_credit_note', 'expense')
  AND fd.deleted_at IS NULL

ORDER BY entry_date DESC;

COMMENT ON VIEW accrual_journal IS 'Journal comptable engagement (accrual basis) - produits et charges constatés';

-- =====================================================================
-- 3. FONCTION CALCUL COGS ET MARGE
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_order_cogs_and_margin(p_sales_order_id UUID)
RETURNS TABLE(
    total_revenue NUMERIC,
    total_cogs NUMERIC,
    gross_margin NUMERIC,
    margin_percent NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_revenue NUMERIC := 0;
    v_cogs NUMERIC := 0;
BEGIN
    -- Calculer le revenu total (prix de vente HT)
    SELECT COALESCE(SUM(soi.quantity * soi.unit_price_ht), 0)
    INTO v_revenue
    FROM sales_order_items soi
    WHERE soi.sales_order_id = p_sales_order_id;

    -- Calculer le COGS (prix d'achat si connu via product_variants ou purchase_orders)
    SELECT COALESCE(SUM(
        soi.quantity * COALESCE(
            -- Priorité 1: Prix d'achat de la variante
            pv.cost_price,
            -- Priorité 2: Dernier prix d'achat dans une commande fournisseur
            (
                SELECT poi.unit_price_ht
                FROM purchase_order_items poi
                JOIN purchase_orders po ON poi.purchase_order_id = po.id
                WHERE poi.product_variant_id = soi.product_variant_id
                  AND po.status NOT IN ('cancelled', 'rejected')
                ORDER BY po.created_at DESC
                LIMIT 1
            ),
            -- Fallback: 0 si pas de coût connu
            0
        )
    ), 0)
    INTO v_cogs
    FROM sales_order_items soi
    LEFT JOIN product_variants pv ON soi.product_variant_id = pv.id
    WHERE soi.sales_order_id = p_sales_order_id;

    RETURN QUERY SELECT
        v_revenue AS total_revenue,
        v_cogs AS total_cogs,
        (v_revenue - v_cogs) AS gross_margin,
        CASE
            WHEN v_revenue > 0 THEN ROUND(((v_revenue - v_cogs) / v_revenue) * 100, 2)
            ELSE 0
        END AS margin_percent;
END;
$$;

COMMENT ON FUNCTION calculate_order_cogs_and_margin IS 'Calcule COGS et marge brute pour une commande client';

-- =====================================================================
-- 4. TRIGGER: PROPAGATION PAIEMENT DOCUMENT → COMMANDE
-- =====================================================================

CREATE OR REPLACE FUNCTION propagate_payment_to_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_order_type TEXT;
    v_total_paid NUMERIC;
    v_order_total NUMERIC;
    v_new_payment_status TEXT;
BEGIN
    -- Vérifier si le document est lié à une commande
    IF NEW.sales_order_id IS NOT NULL THEN
        v_order_id := NEW.sales_order_id;
        v_order_type := 'sales';
    ELSIF NEW.purchase_order_id IS NOT NULL THEN
        v_order_id := NEW.purchase_order_id;
        v_order_type := 'purchase';
    ELSE
        -- Pas de commande liée, rien à faire
        RETURN NEW;
    END IF;

    -- Calculer le total payé pour cette commande (toutes factures confondues)
    SELECT COALESCE(SUM(amount_paid), 0)
    INTO v_total_paid
    FROM financial_documents
    WHERE (sales_order_id = v_order_id OR purchase_order_id = v_order_id)
      AND deleted_at IS NULL;

    -- Déterminer le nouveau statut de paiement
    IF v_order_type = 'sales' THEN
        SELECT total_ttc INTO v_order_total
        FROM sales_orders
        WHERE id = v_order_id;

        IF v_total_paid >= v_order_total THEN
            v_new_payment_status := 'paid';
        ELSIF v_total_paid > 0 THEN
            v_new_payment_status := 'partially_paid';
        ELSE
            v_new_payment_status := 'pending';
        END IF;

        -- Mettre à jour la commande client
        UPDATE sales_orders
        SET
            paid_amount = v_total_paid,
            payment_status = v_new_payment_status,
            paid_at = CASE
                WHEN v_new_payment_status = 'paid' AND paid_at IS NULL THEN NOW()
                WHEN v_new_payment_status != 'paid' THEN NULL
                ELSE paid_at
            END,
            updated_at = NOW()
        WHERE id = v_order_id;

    ELSIF v_order_type = 'purchase' THEN
        SELECT total_ttc INTO v_order_total
        FROM purchase_orders
        WHERE id = v_order_id;

        IF v_total_paid >= v_order_total THEN
            v_new_payment_status := 'paid';
        ELSIF v_total_paid > 0 THEN
            v_new_payment_status := 'partially_paid';
        ELSE
            v_new_payment_status := 'pending';
        END IF;

        -- Mettre à jour la commande fournisseur
        UPDATE purchase_orders
        SET
            paid_amount = v_total_paid,
            payment_status = v_new_payment_status,
            updated_at = NOW()
        WHERE id = v_order_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger sur update de amount_paid dans financial_documents
DROP TRIGGER IF EXISTS trigger_propagate_payment_to_order ON financial_documents;
CREATE TRIGGER trigger_propagate_payment_to_order
    AFTER INSERT OR UPDATE OF amount_paid, status
    ON financial_documents
    FOR EACH ROW
    EXECUTE FUNCTION propagate_payment_to_order();

COMMENT ON TRIGGER trigger_propagate_payment_to_order ON financial_documents IS
'Propage les paiements de factures vers les commandes liées';

-- =====================================================================
-- 5. TRIGGER: MISE À JOUR STATUT DOCUMENT SUR PAIEMENT
-- =====================================================================

CREATE OR REPLACE FUNCTION update_document_status_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_ttc NUMERIC;
    v_new_status TEXT;
BEGIN
    -- Récupérer le montant total du document
    SELECT total_ttc INTO v_total_ttc
    FROM financial_documents
    WHERE id = NEW.id;

    -- Déterminer le nouveau statut
    IF NEW.amount_paid >= v_total_ttc THEN
        v_new_status := 'paid';
    ELSIF NEW.amount_paid > 0 THEN
        v_new_status := 'partially_paid';
    ELSIF NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE THEN
        v_new_status := 'overdue';
    ELSE
        -- Conserver le statut actuel si draft/sent/received
        v_new_status := NEW.status;
    END IF;

    -- Mettre à jour si différent
    IF v_new_status != NEW.status AND NEW.status NOT IN ('cancelled', 'refunded') THEN
        NEW.status := v_new_status;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_document_status_on_payment ON financial_documents;
CREATE TRIGGER trigger_update_document_status_on_payment
    BEFORE UPDATE OF amount_paid
    ON financial_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_status_on_payment();

COMMENT ON TRIGGER trigger_update_document_status_on_payment ON financial_documents IS
'Met à jour automatiquement le statut du document selon le montant payé';

-- =====================================================================
-- 6. FONCTION RPC: ENREGISTRER UN PAIEMENT
-- =====================================================================

CREATE OR REPLACE FUNCTION record_payment(
    p_document_id UUID,
    p_amount NUMERIC,
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_payment_method TEXT DEFAULT 'bank_transfer',
    p_payment_reference TEXT DEFAULT NULL,
    p_bank_transaction_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_id UUID;
    v_current_paid NUMERIC;
    v_total_ttc NUMERIC;
BEGIN
    -- Vérifier que le document existe
    SELECT amount_paid, total_ttc
    INTO v_current_paid, v_total_ttc
    FROM financial_documents
    WHERE id = p_document_id AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document non trouvé: %', p_document_id;
    END IF;

    -- Vérifier que le paiement ne dépasse pas le solde dû
    IF (v_current_paid + p_amount) > v_total_ttc * 1.01 THEN  -- 1% tolérance pour arrondis
        RAISE EXCEPTION 'Le paiement (%) dépasse le solde dû (%)',
            p_amount, v_total_ttc - v_current_paid;
    END IF;

    -- Créer l'entrée de paiement
    INSERT INTO financial_payments (
        document_id,
        bank_transaction_id,
        amount_paid,
        payment_date,
        payment_method,
        payment_reference,
        notes
    ) VALUES (
        p_document_id,
        p_bank_transaction_id,
        p_amount,
        p_payment_date,
        p_payment_method,
        p_payment_reference,
        p_notes
    )
    RETURNING id INTO v_payment_id;

    -- Mettre à jour le montant payé sur le document
    UPDATE financial_documents
    SET
        amount_paid = amount_paid + p_amount,
        updated_at = NOW()
    WHERE id = p_document_id;

    -- Si transaction bancaire fournie, la marquer comme matched
    IF p_bank_transaction_id IS NOT NULL THEN
        UPDATE bank_transactions
        SET
            matched_document_id = p_document_id,
            matching_status = 'manual_matched',
            updated_at = NOW()
        WHERE id = p_bank_transaction_id;
    END IF;

    RETURN v_payment_id;
END;
$$;

COMMENT ON FUNCTION record_payment IS 'Enregistre un paiement sur un document financier avec propagation automatique';

-- =====================================================================
-- 7. VUE RÉCAPITULATIVE MARGE PAR COMMANDE
-- =====================================================================

CREATE OR REPLACE VIEW order_margin_summary AS
SELECT
    so.id AS sales_order_id,
    so.order_number,
    so.status AS order_status,
    so.payment_status,
    so.total_ht,
    so.total_ttc,
    so.paid_amount,

    -- Calcul COGS
    COALESCE((
        SELECT SUM(soi.quantity * COALESCE(pv.cost_price, 0))
        FROM sales_order_items soi
        LEFT JOIN product_variants pv ON soi.product_variant_id = pv.id
        WHERE soi.sales_order_id = so.id
    ), 0) AS total_cogs,

    -- Marge brute
    so.total_ht - COALESCE((
        SELECT SUM(soi.quantity * COALESCE(pv.cost_price, 0))
        FROM sales_order_items soi
        LEFT JOIN product_variants pv ON soi.product_variant_id = pv.id
        WHERE soi.sales_order_id = so.id
    ), 0) AS gross_margin,

    -- % marge
    CASE
        WHEN so.total_ht > 0 THEN ROUND((
            (so.total_ht - COALESCE((
                SELECT SUM(soi.quantity * COALESCE(pv.cost_price, 0))
                FROM sales_order_items soi
                LEFT JOIN product_variants pv ON soi.product_variant_id = pv.id
                WHERE soi.sales_order_id = so.id
            ), 0)) / so.total_ht
        ) * 100, 2)
        ELSE 0
    END AS margin_percent,

    -- Client
    org.legal_name AS customer_name,
    so.created_at,
    so.updated_at

FROM sales_orders so
LEFT JOIN organisations org ON so.organisation_id = org.id
WHERE so.status NOT IN ('cancelled', 'rejected')
ORDER BY so.created_at DESC;

COMMENT ON VIEW order_margin_summary IS 'Récapitulatif marge brute par commande client';

-- =====================================================================
-- 8. GRANTS
-- =====================================================================

-- Grants pour les vues
GRANT SELECT ON cash_movements TO authenticated;
GRANT SELECT ON accrual_journal TO authenticated;
GRANT SELECT ON order_margin_summary TO authenticated;

-- Grants pour les fonctions
GRANT EXECUTE ON FUNCTION calculate_order_cogs_and_margin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_payment(UUID, NUMERIC, DATE, TEXT, TEXT, UUID, TEXT) TO authenticated;
