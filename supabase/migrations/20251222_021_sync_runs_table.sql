-- =====================================================================
-- Migration: Sync Runs Table
-- Date: 2025-12-22
-- Description: Table pour tracker l'historique des synchronisations Qonto
--              avec mécanismes anti-boucle et pagination
-- =====================================================================

-- =====================================================================
-- TYPE ENUM
-- =====================================================================

CREATE TYPE sync_run_status AS ENUM (
    'pending',      -- En attente
    'running',      -- En cours d'exécution
    'completed',    -- Terminé avec succès
    'partial',      -- Terminé partiellement (erreurs non-bloquantes)
    'failed',       -- Échec total
    'cancelled'     -- Annulé (timeout, utilisateur, etc.)
);

CREATE TYPE sync_type AS ENUM (
    'transactions',     -- Sync transactions bancaires
    'client_invoices',  -- Sync factures clients (Qonto → local)
    'attachments',      -- Sync pièces jointes
    'labels',           -- Sync labels/catégories
    'full'              -- Sync complète
);

-- =====================================================================
-- TABLE: sync_runs
-- =====================================================================

CREATE TABLE IF NOT EXISTS sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Type de synchronisation
    sync_type sync_type NOT NULL,

    -- Statut
    status sync_run_status NOT NULL DEFAULT 'pending',

    -- Curseur de pagination
    cursor TEXT,                  -- Dernier cursor Qonto pour pagination
    page_size INTEGER DEFAULT 100,
    current_page INTEGER DEFAULT 0,
    total_pages INTEGER,

    -- Plage temporelle sync
    sync_from TIMESTAMPTZ,        -- Date de début de la fenêtre de sync
    sync_to TIMESTAMPTZ,          -- Date de fin de la fenêtre
    last_synced_transaction_id TEXT,  -- ID dernière transaction sync

    -- Compteurs
    items_fetched INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_skipped INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,

    -- Erreurs
    errors JSONB DEFAULT '[]',    -- Liste des erreurs rencontrées
    last_error TEXT,

    -- Anti-boucle: empêcher les syncs concurrentes
    lock_token UUID,              -- Token unique pour verrouillage
    locked_at TIMESTAMPTZ,
    lock_expires_at TIMESTAMPTZ,  -- Expiration automatique du lock

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Déclencheur
    triggered_by TEXT DEFAULT 'manual',  -- 'manual', 'cron', 'webhook', 'api'
    triggered_by_user_id UUID,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_sync_runs_status ON sync_runs(status);
CREATE INDEX idx_sync_runs_type ON sync_runs(sync_type);
CREATE INDEX idx_sync_runs_created ON sync_runs(created_at DESC);
CREATE INDEX idx_sync_runs_lock ON sync_runs(lock_token) WHERE lock_token IS NOT NULL;

-- =====================================================================
-- FONCTION: Acquérir un lock de sync (anti-boucle)
-- =====================================================================

CREATE OR REPLACE FUNCTION acquire_sync_lock(
    p_sync_type sync_type,
    p_lock_duration_seconds INTEGER DEFAULT 300  -- 5 minutes par défaut
)
RETURNS TABLE(
    success BOOLEAN,
    sync_run_id UUID,
    lock_token UUID,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_run_id UUID;
    v_new_run_id UUID;
    v_lock_token UUID;
BEGIN
    -- Vérifier s'il y a une sync en cours pour ce type
    SELECT id INTO v_existing_run_id
    FROM sync_runs
    WHERE sync_type = p_sync_type
      AND status IN ('pending', 'running')
      AND (lock_expires_at IS NULL OR lock_expires_at > NOW())
    LIMIT 1;

    IF v_existing_run_id IS NOT NULL THEN
        -- Une sync est déjà en cours
        RETURN QUERY SELECT
            FALSE AS success,
            v_existing_run_id AS sync_run_id,
            NULL::UUID AS lock_token,
            'Une synchronisation est déjà en cours pour ce type'::TEXT AS message;
        RETURN;
    END IF;

    -- Générer un token de verrouillage unique
    v_lock_token := gen_random_uuid();

    -- Créer une nouvelle entrée de sync avec le lock
    INSERT INTO sync_runs (
        sync_type,
        status,
        lock_token,
        locked_at,
        lock_expires_at,
        started_at
    ) VALUES (
        p_sync_type,
        'running',
        v_lock_token,
        NOW(),
        NOW() + (p_lock_duration_seconds || ' seconds')::INTERVAL,
        NOW()
    )
    RETURNING id INTO v_new_run_id;

    RETURN QUERY SELECT
        TRUE AS success,
        v_new_run_id AS sync_run_id,
        v_lock_token AS lock_token,
        'Lock acquis avec succès'::TEXT AS message;
END;
$$;

COMMENT ON FUNCTION acquire_sync_lock IS 'Acquiert un verrou exclusif pour la synchronisation, empêchant les syncs concurrentes';

-- =====================================================================
-- FONCTION: Relâcher un lock de sync
-- =====================================================================

CREATE OR REPLACE FUNCTION release_sync_lock(
    p_sync_run_id UUID,
    p_lock_token UUID,
    p_status sync_run_status DEFAULT 'completed',
    p_items_fetched INTEGER DEFAULT 0,
    p_items_created INTEGER DEFAULT 0,
    p_items_updated INTEGER DEFAULT 0,
    p_items_skipped INTEGER DEFAULT 0,
    p_items_failed INTEGER DEFAULT 0,
    p_errors JSONB DEFAULT '[]',
    p_cursor TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_started_at TIMESTAMPTZ;
BEGIN
    -- Vérifier que le lock token correspond
    SELECT started_at INTO v_started_at
    FROM sync_runs
    WHERE id = p_sync_run_id AND lock_token = p_lock_token;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Mettre à jour l'entrée de sync
    UPDATE sync_runs
    SET
        status = p_status,
        completed_at = NOW(),
        duration_ms = EXTRACT(EPOCH FROM (NOW() - v_started_at)) * 1000,
        items_fetched = p_items_fetched,
        items_created = p_items_created,
        items_updated = p_items_updated,
        items_skipped = p_items_skipped,
        items_failed = p_items_failed,
        errors = p_errors,
        cursor = p_cursor,
        lock_token = NULL,
        lock_expires_at = NULL,
        updated_at = NOW()
    WHERE id = p_sync_run_id;

    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION release_sync_lock IS 'Relâche le verrou de synchronisation et enregistre les résultats';

-- =====================================================================
-- FONCTION: Nettoyer les locks expirés
-- =====================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_sync_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Marquer comme failed les syncs avec lock expiré
    UPDATE sync_runs
    SET
        status = 'failed',
        completed_at = NOW(),
        last_error = 'Lock expiré - synchronisation interrompue',
        lock_token = NULL,
        lock_expires_at = NULL,
        updated_at = NOW()
    WHERE status IN ('pending', 'running')
      AND lock_expires_at < NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_sync_locks IS 'Nettoie les verrous de synchronisation expirés';

-- =====================================================================
-- FONCTION: Obtenir l'état de la dernière sync
-- =====================================================================

CREATE OR REPLACE FUNCTION get_last_sync_status(p_sync_type sync_type)
RETURNS TABLE(
    sync_run_id UUID,
    status sync_run_status,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    items_fetched INTEGER,
    items_created INTEGER,
    items_updated INTEGER,
    duration_ms INTEGER,
    last_cursor TEXT,
    has_active_lock BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sr.id AS sync_run_id,
        sr.status,
        sr.started_at,
        sr.completed_at,
        sr.items_fetched,
        sr.items_created,
        sr.items_updated,
        sr.duration_ms,
        sr.cursor AS last_cursor,
        (sr.lock_token IS NOT NULL AND sr.lock_expires_at > NOW()) AS has_active_lock
    FROM sync_runs sr
    WHERE sr.sync_type = p_sync_type
    ORDER BY sr.created_at DESC
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_last_sync_status IS 'Retourne l''état de la dernière synchronisation pour un type donné';

-- =====================================================================
-- GRANTS
-- =====================================================================

GRANT SELECT ON sync_runs TO authenticated;
GRANT EXECUTE ON FUNCTION acquire_sync_lock(sync_type, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION release_sync_lock(UUID, UUID, sync_run_status, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sync_locks() TO authenticated;
GRANT EXECUTE ON FUNCTION get_last_sync_status(sync_type) TO authenticated;
