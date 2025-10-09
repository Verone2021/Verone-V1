-- =====================================================================
-- Migration 008: Triggers Automation Facturation
-- Date: 2025-10-11
-- Description: Triggers automatiques (overdue check, audit history)
-- =====================================================================

-- =====================================================================
-- 1. VÉRIFICATION TRIGGERS EXISTANTS
-- =====================================================================

-- Trigger update_invoice_status_on_payment (créé dans migration 002)
-- Trigger validate_payment_amount (créé dans migration 002)
-- → Déjà fonctionnels, pas besoin de recréer

-- =====================================================================
-- 2. TABLE AUDIT: INVOICE_STATUS_HISTORY
-- =====================================================================

CREATE TABLE invoice_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ===================================================================
  -- RÉFÉRENCE FACTURE
  -- ===================================================================

  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- ===================================================================
  -- CHANGEMENT STATUT
  -- ===================================================================

  -- Ancien statut
  old_status TEXT NOT NULL,

  -- Nouveau statut
  new_status TEXT NOT NULL,

  -- Raison changement (optionnel)
  change_reason TEXT,

  -- ===================================================================
  -- AUDIT TRAIL
  -- ===================================================================

  -- Date changement
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Utilisateur ayant effectué le changement (NULL si automatique)
  changed_by UUID REFERENCES auth.users(id)
);

-- Index pour requêtes historique facture
CREATE INDEX idx_status_history_invoice ON invoice_status_history(invoice_id, changed_at DESC);

-- Index pour analytics changements statut
CREATE INDEX idx_status_history_status ON invoice_status_history(new_status, changed_at DESC);

COMMENT ON TABLE invoice_status_history IS 'Historique changements statut factures (audit trail complet)';
COMMENT ON COLUMN invoice_status_history.change_reason IS 'Raison changement: automatic_payment, manual_update, webhook_sync, overdue_check';

-- =====================================================================
-- 3. TRIGGER: LOG CHANGEMENT STATUT FACTURE
-- =====================================================================

CREATE OR REPLACE FUNCTION log_invoice_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si statut change → Logger dans invoice_status_history
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO invoice_status_history (
      invoice_id,
      old_status,
      new_status,
      change_reason,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      'automatic_trigger', -- Raison par défaut (peut être surchargé par application)
      auth.uid()           -- Utilisateur courant (NULL si trigger automatique)
    );

    RAISE NOTICE 'Invoice status changed: % → % (Invoice ID: %)',
      OLD.status, NEW.status, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur UPDATE status uniquement
CREATE TRIGGER log_invoice_status_change_trigger
  AFTER UPDATE OF status ON invoices
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_invoice_status_change();

-- =====================================================================
-- 4. TRIGGER: CHECK FACTURES EN RETARD (OVERDUE)
-- =====================================================================

CREATE OR REPLACE FUNCTION check_invoice_overdue()
RETURNS TRIGGER AS $$
BEGIN
  -- Si due_date dépassée ET statut = sent → Passer en overdue
  IF NEW.due_date < CURRENT_DATE
     AND NEW.status = 'sent'
     AND (OLD.status IS NULL OR OLD.status = 'sent') THEN

    NEW.status := 'overdue';

    RAISE NOTICE 'Invoice marked overdue: % (Due: %, Invoice ID: %)',
      NEW.abby_invoice_number,
      NEW.due_date,
      NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur INSERT et UPDATE
CREATE TRIGGER check_invoice_overdue_trigger
  BEFORE INSERT OR UPDATE OF due_date, status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_invoice_overdue();

-- =====================================================================
-- 5. FONCTION NETTOYAGE HISTORIQUE ANCIEN (CRON MENSUEL)
-- =====================================================================

CREATE OR REPLACE FUNCTION cleanup_old_status_history()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Supprimer historique > 1 an (garder audit 12 mois minimum)
  DELETE FROM invoice_status_history
  WHERE changed_at < NOW() - INTERVAL '1 year';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE 'Invoice Status History: % entrées anciennes supprimées', v_deleted_count;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_status_history IS
  'Nettoie historique statuts > 1 an (à exécuter mensuellement via cron)';

-- =====================================================================
-- 6. FONCTION ANALYTICS: RAPPORT STATUTS FACTURES
-- =====================================================================

CREATE OR REPLACE FUNCTION get_invoice_status_summary(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  status TEXT,
  count BIGINT,
  total_ht DECIMAL(15,2),
  total_ttc DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.status,
    COUNT(*)::BIGINT,
    COALESCE(SUM(i.total_ht), 0)::DECIMAL(15,2),
    COALESCE(SUM(i.total_ttc), 0)::DECIMAL(15,2)
  FROM invoices i
  WHERE i.invoice_date BETWEEN p_start_date AND p_end_date
  GROUP BY i.status
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_invoice_status_summary IS
  'Rapport agrégé statuts factures sur période donnée (défaut: 30 derniers jours)';
