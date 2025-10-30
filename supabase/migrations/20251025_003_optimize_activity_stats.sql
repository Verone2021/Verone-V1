-- ============================================================================
-- Migration: Optimisation Performance Activity Stats (SLO <2s)
-- Date: 2025-10-25
-- Ticket: Fix warnings SLO activity-stats >2000ms (8 occurrences)
-- ============================================================================

-- Index composite pour query activity-stats optimisée
-- Permet ORDER BY created_at DESC + filtrage gte(created_at)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc_user_id
ON audit_logs(created_at DESC, user_id);

-- Index pour filtrage par user_id (queries user-specific)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
ON audit_logs(user_id);

-- Commentaires pour documentation
COMMENT ON INDEX idx_audit_logs_created_at_desc_user_id IS
  'Optimisation query activity-stats: ORDER BY created_at DESC + filtrage user_id';
COMMENT ON INDEX idx_audit_logs_user_id IS
  'Filtrage rapide par user_id pour statistiques utilisateur';

-- ============================================================================
-- Vérification performance (dev only - à exécuter manuellement)
-- ============================================================================
-- EXPLAIN ANALYZE
-- SELECT user_id, action, severity, created_at, new_data
-- FROM audit_logs
-- WHERE created_at >= NOW() - INTERVAL '7 days'
-- ORDER BY created_at DESC
-- LIMIT 5000;
