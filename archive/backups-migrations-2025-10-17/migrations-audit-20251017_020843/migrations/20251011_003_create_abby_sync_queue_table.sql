-- =====================================================================
-- Migration 003: Table abby_sync_queue
-- Date: 2025-10-11
-- Description: Queue asynchrone + retry logic pour sync Abby API
-- =====================================================================

CREATE TABLE abby_sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ===================================================================
  -- TYPE OPÉRATION
  -- ===================================================================

  operation TEXT NOT NULL CHECK (operation IN (
    'create_invoice',     -- Création facture Abby
    'update_invoice',     -- Mise à jour facture Abby
    'sync_customer',      -- Synchronisation client Vérone → Abby
    'sync_product',       -- Synchronisation produit (Phase 2)
    'cancel_invoice'      -- Annulation facture
  )),

  -- ===================================================================
  -- PAYLOAD OPÉRATION
  -- ===================================================================

  -- Type entité concernée
  entity_type TEXT NOT NULL,

  -- ID entité Vérone
  entity_id UUID NOT NULL,

  -- Payload JSON à envoyer à Abby API
  abby_payload JSONB NOT NULL,

  -- ===================================================================
  -- RETRY LOGIC
  -- ===================================================================

  -- Statut opération
  status TEXT NOT NULL CHECK (status IN (
    'pending',      -- En attente traitement
    'processing',   -- En cours traitement
    'success',      -- Succès
    'failed'        -- Échec définitif (après max_retries)
  )) DEFAULT 'pending',

  -- Compteur tentatives
  retry_count INT NOT NULL DEFAULT 0,

  -- Nombre max tentatives avant échec définitif
  max_retries INT NOT NULL DEFAULT 3,

  -- Message dernière erreur
  last_error TEXT,

  -- ===================================================================
  -- TIMESTAMPS
  -- ===================================================================

  -- Date création opération
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Date traitement (succès ou échec définitif)
  processed_at TIMESTAMPTZ,

  -- Prochaine tentative (calculé avec exponential backoff)
  next_retry_at TIMESTAMPTZ,

  -- ===================================================================
  -- AUDIT
  -- ===================================================================

  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================================
-- 2. INDEX
-- =====================================================================

-- Index composite status + next_retry (query principale cron job)
CREATE INDEX idx_sync_queue_status_retry ON abby_sync_queue(status, next_retry_at);

-- Index entité (lookup par entity)
CREATE INDEX idx_sync_queue_entity ON abby_sync_queue(entity_type, entity_id);

-- Index opération (analytics)
CREATE INDEX idx_sync_queue_operation ON abby_sync_queue(operation);

-- Index partial pending operations (optimisation cron job)
-- Note: Suppression condition NOW() (non IMMUTABLE) - filtre dans query SQL
CREATE INDEX idx_sync_queue_pending ON abby_sync_queue(next_retry_at)
  WHERE status = 'pending';

-- =====================================================================
-- 3. FONCTION CALCUL NEXT_RETRY_AT (EXPONENTIAL BACKOFF)
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_next_retry()
RETURNS TRIGGER AS $$
BEGIN
  -- Si échec et retry_count < max_retries → Planifier retry
  IF NEW.status = 'failed' AND NEW.retry_count < NEW.max_retries THEN
    -- Exponential backoff: 2^retry_count minutes
    -- Retry 1: 1 min, Retry 2: 2 min, Retry 3: 4 min
    NEW.next_retry_at := NOW() + (POWER(2, NEW.retry_count) * INTERVAL '1 minute');
    NEW.status := 'pending'; -- Re-passage en pending pour retry

    RAISE NOTICE 'Abby Sync Queue: Retry planifié (tentative % / %) dans % minutes - Operation: %, Entity: %',
      NEW.retry_count + 1,
      NEW.max_retries,
      POWER(2, NEW.retry_count),
      NEW.operation,
      NEW.entity_id;

  -- Si retry_count >= max_retries → Échec définitif (Dead Letter Queue)
  ELSIF NEW.retry_count >= NEW.max_retries THEN
    NEW.next_retry_at := NULL;
    NEW.status := 'failed';
    NEW.processed_at := NOW();

    -- Log erreur critique (à monitorer Sentry)
    RAISE WARNING 'Abby Sync Queue: ÉCHEC DÉFINITIF après % tentatives - Operation: %, Entity: %, Error: %',
      NEW.retry_count,
      NEW.operation,
      NEW.entity_id,
      NEW.last_error;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger calcul next_retry_at
CREATE TRIGGER calculate_next_retry_trigger
  BEFORE UPDATE ON abby_sync_queue
  FOR EACH ROW
  WHEN (OLD.status != NEW.status AND NEW.status = 'failed')
  EXECUTE FUNCTION calculate_next_retry();

-- =====================================================================
-- 4. FONCTION MARQUER OPÉRATION COMME TRAITÉE
-- =====================================================================

CREATE OR REPLACE FUNCTION mark_sync_operation_success()
RETURNS TRIGGER AS $$
BEGIN
  -- Si passage en success → Marquer processed_at
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    NEW.processed_at := NOW();
    NEW.next_retry_at := NULL; -- Plus de retry nécessaire

    RAISE NOTICE 'Abby Sync Queue: Succès - Operation: %, Entity: %',
      NEW.operation,
      NEW.entity_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger marquer succès
CREATE TRIGGER mark_sync_operation_success_trigger
  BEFORE UPDATE ON abby_sync_queue
  FOR EACH ROW
  WHEN (NEW.status = 'success')
  EXECUTE FUNCTION mark_sync_operation_success();

-- =====================================================================
-- 5. FONCTION NETTOYAGE OPÉRATIONS ANCIENNES (CRON QUOTIDIEN)
-- =====================================================================

CREATE OR REPLACE FUNCTION cleanup_old_sync_operations()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Supprimer opérations success > 30 jours
  DELETE FROM abby_sync_queue
  WHERE status = 'success'
    AND processed_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE 'Abby Sync Queue: % opérations anciennes supprimées', v_deleted_count;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 6. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE abby_sync_queue IS 'Queue asynchrone pour synchronisation Abby API avec retry logic';
COMMENT ON COLUMN abby_sync_queue.operation IS 'Type opération: create_invoice, update_invoice, sync_customer, cancel_invoice';
COMMENT ON COLUMN abby_sync_queue.abby_payload IS 'Payload JSON à envoyer à Abby API';
COMMENT ON COLUMN abby_sync_queue.next_retry_at IS 'Prochaine tentative (calculé avec exponential backoff 2^retry_count minutes)';
COMMENT ON COLUMN abby_sync_queue.max_retries IS 'Nombre max tentatives avant échec définitif (défaut: 3)';
