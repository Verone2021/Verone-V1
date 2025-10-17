-- =====================================================================
-- Migration 010: Indexes Performance Facturation
-- Date: 2025-10-11
-- Description: Indexes composites, partiels, GIN pour performances
-- =====================================================================

-- =====================================================================
-- 1. INDEXES COMPOSITES: INVOICES
-- =====================================================================

-- Index pour requêtes par client + date (dashboard client)
CREATE INDEX idx_invoices_customer_date ON invoices(sales_order_id, invoice_date DESC);

-- Index pour requêtes par statut + due_date (factures en retard)
CREATE INDEX idx_invoices_status_due_date ON invoices(status, due_date)
  WHERE status IN ('sent', 'overdue');

-- Index pour requêtes par abby_invoice_id (lookup webhooks)
-- Note: UNIQUE constraint crée déjà un index, mais on l'optimise pour LIKE queries
CREATE INDEX idx_invoices_abby_invoice_id_pattern ON invoices(abby_invoice_id text_pattern_ops);

-- Index pour requêtes par date facture (reporting mensuel)
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date DESC)
  WHERE status != 'cancelled';

-- =====================================================================
-- 2. INDEXES PARTIELS: INVOICES (QUERIES FRÉQUENTES)
-- =====================================================================

-- Index factures payées uniquement (analytics CA)
CREATE INDEX idx_invoices_paid_only ON invoices(invoice_date DESC, total_ht)
  WHERE status = 'paid';

-- Index factures impayées + retard (relances clients)
CREATE INDEX idx_invoices_unpaid ON invoices(due_date ASC)
  WHERE status IN ('sent', 'overdue', 'partially_paid');

-- Index factures synchronisées Abby (exclude pending)
-- Note: Colonne synced_at sera ajoutée en Phase 2 (skip pour l'instant)
-- CREATE INDEX idx_invoices_synced ON invoices(synced_at DESC) WHERE synced_at IS NOT NULL;

-- =====================================================================
-- 3. INDEXES COMPOSITES: PAYMENTS
-- =====================================================================

-- Index pour requêtes par facture + date (historique paiements)
CREATE INDEX idx_payments_invoice_date ON payments(invoice_id, payment_date DESC);

-- Index pour requêtes par date paiement (cash flow reporting)
CREATE INDEX idx_payments_payment_date ON payments(payment_date DESC);

-- Index pour paiements synchronisés depuis Abby
CREATE INDEX idx_payments_synced_from_abby ON payments(synced_from_abby_at DESC)
  WHERE synced_from_abby_at IS NOT NULL;

-- =====================================================================
-- 4. INDEXES PARTIELS: PAYMENTS (QUERIES FRÉQUENTES)
-- =====================================================================

-- Index paiements récents uniquement (dashboard 30 derniers jours)
-- Note: Filtre NOW() non IMMUTABLE - filtre dans query SQL uniquement
CREATE INDEX idx_payments_recent ON payments(payment_date DESC);

-- =====================================================================
-- 5. INDEXES COMPOSITES: ABBY_SYNC_QUEUE
-- =====================================================================

-- Index pour query principale cron job (déjà créé dans migration 003)
-- CREATE INDEX idx_sync_queue_status_retry ON abby_sync_queue(status, next_retry_at);

-- Index pour requêtes par entity_type + status (analytics)
CREATE INDEX idx_sync_queue_entity_status ON abby_sync_queue(entity_type, status, created_at DESC);

-- Index pour requêtes par operation + status (monitoring)
CREATE INDEX idx_sync_queue_operation_status ON abby_sync_queue(operation, status, created_at DESC);

-- =====================================================================
-- 6. INDEXES PARTIELS: ABBY_SYNC_QUEUE (QUERIES FRÉQUENTES)
-- =====================================================================

-- Index échecs uniquement (monitoring erreurs)
CREATE INDEX idx_sync_queue_failed_operations ON abby_sync_queue(operation, created_at DESC)
  WHERE status = 'failed';

-- Index opérations en cours (monitoring real-time)
CREATE INDEX idx_sync_queue_processing ON abby_sync_queue(created_at DESC)
  WHERE status = 'processing';

-- =====================================================================
-- 7. INDEX GIN: ABBY_PAYLOAD (JSONB SEARCH)
-- =====================================================================

-- Index GIN pour recherche dans payload JSONB (debug, analytics)
CREATE INDEX idx_sync_queue_payload_gin ON abby_sync_queue USING GIN (abby_payload);

COMMENT ON INDEX idx_sync_queue_payload_gin IS
  'Index GIN pour recherche rapide dans payload JSONB (ex: customerId, invoiceNumber)';

-- =====================================================================
-- 8. INDEXES COMPOSITES: ABBY_WEBHOOK_EVENTS
-- =====================================================================

-- Index pour requêtes par event_type + processed_at (analytics)
CREATE INDEX idx_webhook_events_type_date ON abby_webhook_events(event_type, processed_at DESC);

-- Index pour nettoyage automatique (déjà créé dans migration 004)
-- CREATE INDEX idx_webhook_events_expires_at ON abby_webhook_events(expires_at);

-- =====================================================================
-- 9. INDEXES PARTIELS: ABBY_WEBHOOK_EVENTS (QUERIES FRÉQUENTES)
-- =====================================================================

-- Index événements non expirés uniquement (queries actives)
-- Note: Filtre NOW() non IMMUTABLE - filtre dans query SQL uniquement
CREATE INDEX idx_webhook_events_not_expired ON abby_webhook_events(event_type, processed_at DESC);

-- =====================================================================
-- 10. INDEX GIN: EVENT_DATA (JSONB SEARCH)
-- =====================================================================

-- Index GIN pour recherche dans event_data JSONB (debug webhooks)
CREATE INDEX idx_webhook_events_data_gin ON abby_webhook_events USING GIN (event_data);

COMMENT ON INDEX idx_webhook_events_data_gin IS
  'Index GIN pour recherche rapide dans event_data JSONB (ex: invoice_id, customer_id)';

-- =====================================================================
-- 11. INDEXES COMPOSITES: INVOICE_STATUS_HISTORY
-- =====================================================================

-- Index pour requêtes historique par facture (déjà créé dans migration 008)
-- CREATE INDEX idx_status_history_invoice ON invoice_status_history(invoice_id, changed_at DESC);

-- Index pour analytics changements statut (déjà créé dans migration 008)
-- CREATE INDEX idx_status_history_status ON invoice_status_history(new_status, changed_at DESC);

-- Index pour requêtes par utilisateur (audit trail)
CREATE INDEX idx_status_history_user ON invoice_status_history(changed_by, changed_at DESC)
  WHERE changed_by IS NOT NULL;

-- =====================================================================
-- 12. INDEXES PARTIELS: INVOICE_STATUS_HISTORY (QUERIES FRÉQUENTES)
-- =====================================================================

-- Index changements récents uniquement (dashboard 30 derniers jours)
-- Note: Filtre NOW() non IMMUTABLE - filtre dans query SQL uniquement
CREATE INDEX idx_status_history_recent ON invoice_status_history(changed_at DESC);

-- Index changements automatiques uniquement (monitoring triggers)
CREATE INDEX idx_status_history_automatic ON invoice_status_history(changed_at DESC)
  WHERE changed_by IS NULL;

-- =====================================================================
-- 13. ANALYSE STATISTIQUES (VACUUM ANALYZE)
-- =====================================================================

-- Mettre à jour statistiques pour optimiseur query planner
ANALYZE invoices;
ANALYZE payments;
ANALYZE abby_sync_queue;
ANALYZE abby_webhook_events;
ANALYZE invoice_status_history;

-- =====================================================================
-- 14. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON INDEX idx_invoices_customer_date IS
  'Index composite pour dashboard client (sales_order_id + invoice_date DESC)';

COMMENT ON INDEX idx_invoices_status_due_date IS
  'Index composite pour relances factures impayées (status + due_date)';

COMMENT ON INDEX idx_invoices_paid_only IS
  'Index partiel factures payées uniquement (analytics CA)';

COMMENT ON INDEX idx_invoices_unpaid IS
  'Index partiel factures impayées (relances clients)';

COMMENT ON INDEX idx_payments_recent IS
  'Index partiel paiements récents 30 jours (dashboard cash flow)';

COMMENT ON INDEX idx_sync_queue_failed_operations IS
  'Index partiel échecs sync uniquement (monitoring erreurs)';

COMMENT ON INDEX idx_webhook_events_not_expired IS
  'Index partiel événements non expirés (queries actives idempotency)';

COMMENT ON INDEX idx_status_history_recent IS
  'Index partiel changements récents 30 jours (dashboard audit)';
