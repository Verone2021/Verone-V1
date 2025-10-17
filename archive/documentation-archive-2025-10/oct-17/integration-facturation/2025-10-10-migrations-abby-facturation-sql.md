# Migrations SQL - Intégration Abby Facturation

**Date**: 2025-10-10
**Auteur**: Orchestrateur Système Vérone
**Version**: 1.0
**Statut**: Production-Ready SQL Migrations

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Migration 001 : Table invoices](#migration-001--table-invoices)
3. [Migration 002 : Table payments](#migration-002--table-payments)
4. [Migration 003 : Table abby_sync_queue](#migration-003--table-abby_sync_queue)
5. [Migration 004 : Table abby_webhook_events](#migration-004--table-abby_webhook_events)
6. [Migration 005 : Colonnes abby_customer_id](#migration-005--colonnes-abby_customer_id)
7. [Migration 006 : RPC Functions Facturation](#migration-006--rpc-functions-facturation)
8. [Migration 007 : RPC Functions BFA](#migration-007--rpc-functions-bfa)
9. [Migration 008 : Triggers Automatisation](#migration-008--triggers-automatisation)
10. [Migration 009 : RLS Policies Sécurité](#migration-009--rls-policies-sécurité)
11. [Migration 010 : Index Performance](#migration-010--index-performance)
12. [Seed Data Exemple](#seed-data-exemple)
13. [Rollback Scripts](#rollback-scripts)

---

## 1. Vue d'Ensemble

### 1.1 Dépendances

**Tables Existantes Requises** :
- `sales_orders` (commandes clients)
- `sales_order_items` (lignes commande)
- `organisations` (clients/fournisseurs)
- `products` (produits)
- `auth.users` (utilisateurs)

**Extensions PostgreSQL** :
- `uuid-ossp` (génération UUIDs)
- `pgcrypto` (fonctions crypto pour HMAC)

### 1.2 Ordre d'Exécution

```sql
-- Ordre strict migrations
20251011_001_create_invoices_table.sql
20251011_002_create_payments_table.sql
20251011_003_create_abby_sync_queue_table.sql
20251011_004_create_abby_webhook_events_table.sql
20251011_005_alter_organisations_add_abby_customer_id.sql
20251011_006_create_rpc_invoice_functions.sql
20251011_007_create_rpc_bfa_functions.sql
20251011_008_create_triggers_automation.sql
20251011_009_create_rls_policies_invoicing.sql
20251011_010_create_indexes_performance.sql
```

### 1.3 Volumétrie Estimée

| Table | Lignes/An | Rétention | Total 5 ans |
|-------|-----------|-----------|-------------|
| `invoices` | 1,000 | 10 ans | 10,000 |
| `payments` | 1,200 | 10 ans | 12,000 |
| `abby_sync_queue` | 5,000 | 30 jours | ~500 |
| `abby_webhook_events` | 3,000 | 7 jours | ~60 |

---

## 2. Migration 001 : Table invoices

**Fichier** : `20251011_001_create_invoices_table.sql`

```sql
-- =====================================================================
-- Migration 001: Table invoices
-- Date: 2025-10-11
-- Description: Stockage local des factures créées via Abby
-- =====================================================================

-- Activation extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. CRÉATION TABLE INVOICES
-- =====================================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ===================================================================
  -- RELATIONS
  -- ===================================================================

  -- Relation commande Vérone (CASCADE interdit → données financières critiques)
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,

  -- ===================================================================
  -- IDENTIFIANTS ABBY
  -- ===================================================================

  -- Identifiant unique Abby (ex: abby_inv_789012)
  abby_invoice_id TEXT UNIQUE NOT NULL,

  -- Numéro facture affiché (ex: INV-2025-042)
  abby_invoice_number TEXT NOT NULL,

  -- ===================================================================
  -- DONNÉES FACTURE
  -- ===================================================================

  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE,

  -- Montants (précision 2 décimales)
  total_ht DECIMAL(12,2) NOT NULL CHECK (total_ht >= 0),
  total_ttc DECIMAL(12,2) NOT NULL CHECK (total_ttc >= 0),
  tva_amount DECIMAL(12,2) NOT NULL CHECK (tva_amount >= 0),

  -- ===================================================================
  -- STATUT FACTURE
  -- ===================================================================

  status TEXT NOT NULL CHECK (status IN (
    'draft',              -- Brouillon (créée mais pas envoyée)
    'sent',               -- Envoyée au client
    'paid',               -- Payée intégralement
    'partially_paid',     -- Payée partiellement
    'overdue',            -- En retard de paiement
    'cancelled',          -- Annulée
    'refunded'            -- Remboursée (avoir émis)
  )) DEFAULT 'draft',

  -- ===================================================================
  -- URLS ABBY
  -- ===================================================================

  -- URL PDF facture téléchargeable
  abby_pdf_url TEXT,

  -- URL consultation client (publique)
  abby_public_url TEXT,

  -- ===================================================================
  -- SYNC METADATA
  -- ===================================================================

  -- Timestamp dernière synchronisation vers Abby
  synced_to_abby_at TIMESTAMPTZ,

  -- Timestamp dernière synchronisation depuis Abby (webhooks)
  last_synced_from_abby_at TIMESTAMPTZ,

  -- Historique erreurs synchronisation (JSON)
  sync_errors JSONB,

  -- ===================================================================
  -- AUDIT
  -- ===================================================================

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- =====================================================================
-- 2. CONTRAINTES BUSINESS
-- =====================================================================

-- Cohérence totaux : total_ttc = total_ht + tva_amount
ALTER TABLE invoices ADD CONSTRAINT invoice_totals_coherent
  CHECK (ABS(total_ttc - (total_ht + tva_amount)) < 0.01); -- Tolérance 1 centime (arrondis)

-- Une seule facture par commande (unicité business)
ALTER TABLE invoices ADD CONSTRAINT invoice_one_per_order
  UNIQUE (sales_order_id);

-- Due date doit être >= invoice_date
ALTER TABLE invoices ADD CONSTRAINT invoice_due_date_valid
  CHECK (due_date IS NULL OR due_date >= invoice_date);

-- =====================================================================
-- 3. INDEX DE BASE
-- =====================================================================

-- Index relation commande (lookups fréquents)
CREATE INDEX idx_invoices_sales_order ON invoices(sales_order_id);

-- Index identifiant Abby (sync + webhooks)
CREATE INDEX idx_invoices_abby_id ON invoices(abby_invoice_id);

-- Index statut (filtres UI)
CREATE INDEX idx_invoices_status ON invoices(status);

-- Index date facture (tri chronologique)
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);

-- =====================================================================
-- 4. TRIGGERS
-- =====================================================================

-- Trigger mise à jour updated_at automatique
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- =====================================================================
-- 5. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE invoices IS
  'Factures clients générées depuis Abby API (synchronisation bidirectionnelle)';

COMMENT ON COLUMN invoices.abby_invoice_id IS
  'Identifiant unique facture dans Abby (ex: abby_inv_789012)';

COMMENT ON COLUMN invoices.abby_invoice_number IS
  'Numéro facture affiché client (ex: INV-2025-042)';

COMMENT ON COLUMN invoices.status IS
  'Statut workflow facture (draft, sent, paid, partially_paid, overdue, cancelled, refunded)';

COMMENT ON COLUMN invoices.sync_errors IS
  'Historique erreurs synchronisation Abby (format JSON)';

-- =====================================================================
-- 6. VALIDATION MIGRATION
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001 - Table invoices créée avec succès';
  RAISE NOTICE '📊 Contraintes business: totals_coherent, one_per_order, due_date_valid';
  RAISE NOTICE '🔍 Index créés: sales_order, abby_id, status, date';
  RAISE NOTICE '🔒 Triggers: updated_at automatique';
END $$;
```

---

## 3. Migration 002 : Table payments

**Fichier** : `20251011_002_create_payments_table.sql`

```sql
-- =====================================================================
-- Migration 002: Table payments
-- Date: 2025-10-11
-- Description: Historique paiements synchronisés depuis Abby
-- =====================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ===================================================================
  -- RELATIONS
  -- ===================================================================

  -- Relation facture (CASCADE autorisé → paiements dépendent facture)
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- ===================================================================
  -- IDENTIFIANTS ABBY
  -- ===================================================================

  -- Identifiant paiement Abby (si fourni par webhook)
  abby_payment_id TEXT UNIQUE,

  -- ===================================================================
  -- DONNÉES PAIEMENT
  -- ===================================================================

  -- Montant payé (peut être partiel)
  amount_paid DECIMAL(12,2) NOT NULL CHECK (amount_paid > 0),

  -- Date paiement effectif
  payment_date DATE NOT NULL,

  -- Méthode paiement
  payment_method TEXT CHECK (payment_method IN (
    'virement',
    'carte',
    'cheque',
    'especes',
    'prelevement',
    'other'
  )),

  -- ===================================================================
  -- MÉTADONNÉES
  -- ===================================================================

  -- Notes libres paiement
  notes TEXT,

  -- Référence transaction bancaire
  transaction_reference TEXT,

  -- ===================================================================
  -- SYNC
  -- ===================================================================

  -- Timestamp synchronisation depuis Abby
  synced_from_abby_at TIMESTAMPTZ,

  -- ===================================================================
  -- AUDIT
  -- ===================================================================

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================================
-- 2. INDEX
-- =====================================================================

-- Index relation facture (lookups fréquents)
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- Index date paiement (tri chronologique)
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- Index méthode paiement (analytics)
CREATE INDEX idx_payments_method ON payments(payment_method);

-- =====================================================================
-- 3. FONCTION VALIDATION MONTANT PAIEMENT
-- =====================================================================

CREATE OR REPLACE FUNCTION validate_payment_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_total DECIMAL(12,2);
  v_total_paid DECIMAL(12,2);
BEGIN
  -- Récupérer total facture
  SELECT total_ttc INTO v_invoice_total
  FROM invoices
  WHERE id = NEW.invoice_id;

  IF v_invoice_total IS NULL THEN
    RAISE EXCEPTION 'Facture % introuvable', NEW.invoice_id;
  END IF;

  -- Calculer total déjà payé + nouveau paiement
  SELECT COALESCE(SUM(amount_paid), 0) + NEW.amount_paid INTO v_total_paid
  FROM payments
  WHERE invoice_id = NEW.invoice_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Vérifier que total payé ≤ total facture (tolérance 1 centime)
  IF v_total_paid > v_invoice_total + 0.01 THEN
    RAISE EXCEPTION 'Total paiements (%.2f€) dépasse total facture (%.2f€)',
      v_total_paid, v_invoice_total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger validation montant
CREATE TRIGGER validate_payment_amount_trigger
  BEFORE INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION validate_payment_amount();

-- =====================================================================
-- 4. FONCTION MISE À JOUR STATUT FACTURE
-- =====================================================================

CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_total DECIMAL(12,2);
  v_total_paid DECIMAL(12,2);
  v_new_status TEXT;
BEGIN
  -- Récupérer total facture
  SELECT total_ttc INTO v_invoice_total
  FROM invoices
  WHERE id = NEW.invoice_id;

  -- Calculer total payé (incluant nouveau paiement)
  SELECT COALESCE(SUM(amount_paid), 0) INTO v_total_paid
  FROM payments
  WHERE invoice_id = NEW.invoice_id;

  -- Déterminer nouveau statut
  IF v_total_paid >= v_invoice_total - 0.01 THEN
    -- Payé intégralement (tolérance 1 centime)
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    -- Payé partiellement
    v_new_status := 'partially_paid';
  ELSE
    -- Pas de changement statut
    RETURN NEW;
  END IF;

  -- Mettre à jour statut facture
  UPDATE invoices
  SET status = v_new_status,
      last_synced_from_abby_at = NOW()
  WHERE id = NEW.invoice_id
    AND status != v_new_status; -- Éviter UPDATE inutile

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger mise à jour statut facture
CREATE TRIGGER update_invoice_status_on_payment_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_payment();

-- =====================================================================
-- 5. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE payments IS
  'Historique paiements factures (synchronisé depuis Abby webhooks)';

COMMENT ON COLUMN payments.abby_payment_id IS
  'Identifiant paiement dans Abby (si fourni par webhook)';

COMMENT ON COLUMN payments.amount_paid IS
  'Montant payé (peut être partiel si paiements multiples)';

COMMENT ON COLUMN payments.payment_method IS
  'Méthode: virement, carte, cheque, especes, prelevement, other';

-- =====================================================================
-- 6. VALIDATION MIGRATION
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002 - Table payments créée avec succès';
  RAISE NOTICE '📊 Trigger validation: amount_paid ≤ invoice.total_ttc';
  RAISE NOTICE '🔄 Trigger auto-update: invoice.status selon total payé';
  RAISE NOTICE '🔍 Index créés: invoice, date, method';
END $$;
```

---

## 4. Migration 003 : Table abby_sync_queue

**Fichier** : `20251011_003_create_abby_sync_queue_table.sql`

```sql
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
CREATE INDEX idx_sync_queue_pending ON abby_sync_queue(next_retry_at)
  WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= NOW());

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

COMMENT ON TABLE abby_sync_queue IS
  'Queue asynchrone pour synchronisation Abby API avec retry logic';

COMMENT ON COLUMN abby_sync_queue.operation IS
  'Type opération: create_invoice, update_invoice, sync_customer, cancel_invoice';

COMMENT ON COLUMN abby_sync_queue.abby_payload IS
  'Payload JSON à envoyer à Abby API';

COMMENT ON COLUMN abby_sync_queue.next_retry_at IS
  'Prochaine tentative (calculé avec exponential backoff 2^retry_count minutes)';

COMMENT ON COLUMN abby_sync_queue.max_retries IS
  'Nombre max tentatives avant échec définitif (défaut: 3)';

-- =====================================================================
-- 7. VALIDATION MIGRATION
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 003 - Table abby_sync_queue créée avec succès';
  RAISE NOTICE '🔄 Retry logic: Exponential backoff 2^n minutes (max 3 tentatives)';
  RAISE NOTICE '📊 Dead Letter Queue: Opérations failed après max_retries';
  RAISE NOTICE '🧹 Cleanup: cleanup_old_sync_operations() (à planifier cron quotidien)';
END $$;
```

---

## 5. Migration 004 : Table abby_webhook_events

**Fichier** : `20251011_004_create_abby_webhook_events_table.sql`

```sql
-- =====================================================================
-- Migration 004: Table abby_webhook_events
-- Date: 2025-10-11
-- Description: Tracking événements webhooks Abby (idempotency)
-- =====================================================================

CREATE TABLE abby_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ===================================================================
  -- IDENTIFIANT ÉVÉNEMENT ABBY
  -- ===================================================================

  -- ID unique événement Abby (pour idempotency check)
  event_id TEXT UNIQUE NOT NULL,

  -- Type événement (invoice.paid, invoice.sent, etc.)
  event_type TEXT NOT NULL,

  -- ===================================================================
  -- DONNÉES ÉVÉNEMENT
  -- ===================================================================

  -- Payload complet webhook (pour debug/audit)
  event_data JSONB NOT NULL,

  -- ===================================================================
  -- TIMESTAMPS
  -- ===================================================================

  -- Date traitement événement
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Date expiration (cleanup automatique après 7 jours)
  expires_at TIMESTAMPTZ NOT NULL
);

-- =====================================================================
-- 2. INDEX
-- =====================================================================

-- Index event_id (lookup idempotency)
CREATE INDEX idx_webhook_events_event_id ON abby_webhook_events(event_id);

-- Index expires_at (cleanup quotidien)
CREATE INDEX idx_webhook_events_expires_at ON abby_webhook_events(expires_at);

-- Index event_type (analytics)
CREATE INDEX idx_webhook_events_type ON abby_webhook_events(event_type);

-- =====================================================================
-- 3. FONCTION CALCUL EXPIRES_AT AUTOMATIQUE
-- =====================================================================

CREATE OR REPLACE FUNCTION set_webhook_event_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- TTL 7 jours par défaut
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '7 days';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger calcul expires_at
CREATE TRIGGER set_webhook_event_expiry_trigger
  BEFORE INSERT ON abby_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION set_webhook_event_expiry();

-- =====================================================================
-- 4. FONCTION NETTOYAGE ÉVÉNEMENTS EXPIRÉS (CRON QUOTIDIEN)
-- =====================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_webhook_events()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Supprimer événements expirés
  DELETE FROM abby_webhook_events
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE 'Abby Webhook Events: % événements expirés supprimés', v_deleted_count;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 5. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE abby_webhook_events IS
  'Tracking événements webhooks Abby pour idempotency (éviter double traitement)';

COMMENT ON COLUMN abby_webhook_events.event_id IS
  'ID unique événement Abby (utilisé pour check idempotency)';

COMMENT ON COLUMN abby_webhook_events.expires_at IS
  'Date expiration (cleanup automatique après 7 jours)';

-- =====================================================================
-- 6. VALIDATION MIGRATION
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 004 - Table abby_webhook_events créée avec succès';
  RAISE NOTICE '🔒 Idempotency: Vérification event_id avant traitement webhook';
  RAISE NOTICE '🧹 TTL: 7 jours (cleanup_expired_webhook_events cron quotidien)';
END $$;
```

---

## 6. Migration 005 : Colonnes abby_customer_id

**Fichier** : `20251011_005_alter_organisations_add_abby_customer_id.sql`

```sql
-- =====================================================================
-- Migration 005: Colonnes abby_customer_id
-- Date: 2025-10-11
-- Description: Ajout colonnes sync Abby dans tables clients
-- =====================================================================

-- =====================================================================
-- 1. TABLE ORGANISATIONS
-- =====================================================================

-- Ajout colonne abby_customer_id
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS abby_customer_id TEXT UNIQUE;

-- Index pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_organisations_abby_customer
  ON organisations(abby_customer_id)
  WHERE abby_customer_id IS NOT NULL;

-- Commentaire documentation
COMMENT ON COLUMN organisations.abby_customer_id IS
  'Identifiant client dans Abby (synchronisé lors première facturation)';

-- =====================================================================
-- 2. TABLE INDIVIDUAL_CUSTOMERS (SI EXISTE)
-- =====================================================================

-- Vérifier existence table individual_customers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'individual_customers'
  ) THEN
    -- Ajout colonne abby_contact_id
    ALTER TABLE individual_customers
      ADD COLUMN IF NOT EXISTS abby_contact_id TEXT UNIQUE;

    -- Index pour lookup rapide
    CREATE INDEX IF NOT EXISTS idx_individual_customers_abby_contact
      ON individual_customers(abby_contact_id)
      WHERE abby_contact_id IS NOT NULL;

    -- Commentaire documentation
    COMMENT ON COLUMN individual_customers.abby_contact_id IS
      'Identifiant contact dans Abby (synchronisé si facturation B2C)';

    RAISE NOTICE '✅ Colonne abby_contact_id ajoutée à individual_customers';
  ELSE
    RAISE NOTICE '⚠️ Table individual_customers inexistante (skip)';
  END IF;
END $$;

-- =====================================================================
-- 3. VALIDATION MIGRATION
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 005 - Colonnes abby_customer_id ajoutées avec succès';
  RAISE NOTICE '📊 Table organisations: abby_customer_id (UNIQUE)';
  RAISE NOTICE '📊 Table individual_customers: abby_contact_id (UNIQUE si table existe)';
  RAISE NOTICE '🔍 Index créés pour lookup rapide';
END $$;
```

---

## 7. Migration 006 : RPC Functions Facturation

**Fichier** : `20251011_006_create_rpc_invoice_functions.sql`

```sql
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
            'tvaRate', 20, -- TODO: Récupérer products.tva_rate si colonne existe
            'discountPercentage', COALESCE(soi.discount_percentage, 0)
          )
        )
        FROM sales_order_items soi
        JOIN products p ON soi.product_id = p.id
        WHERE soi.sales_order_id = p_sales_order_id
      ),
      'paymentTerms', COALESCE(o.payment_terms, 'Paiement à 30 jours')
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

-- Commentaire documentation
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
  v_invoice invoices;
  v_total_paid DECIMAL(12,2);
  v_new_status TEXT;
BEGIN
  -- 1. Récupérer facture depuis abby_invoice_id
  SELECT id, * INTO v_invoice_id, v_invoice
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
    v_invoice.abby_invoice_number, p_payment_amount, v_new_status;

  -- 5. Si facture totalement payée → Déclencher calcul BFA (Phase 2)
  IF v_new_status = 'paid' THEN
    -- TODO: Vérifier si dernière facture année fiscale
    -- TODO: Appeler calculate_annual_revenue_bfa()
    NULL;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice.abby_invoice_number,
    'new_status', v_new_status,
    'total_paid', v_total_paid,
    'invoice_total', v_invoice.total_ttc
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire documentation
COMMENT ON FUNCTION handle_abby_webhook_invoice_paid IS
  'Traite webhook Abby invoice.paid: crée payment, met à jour statut facture, déclenche BFA si applicable';

-- =====================================================================
-- VALIDATION MIGRATION
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 006 - RPC Functions Facturation créées avec succès';
  RAISE NOTICE '📊 Fonction 1: generate_invoice_from_order(sales_order_id)';
  RAISE NOTICE '📊 Fonction 2: handle_abby_webhook_invoice_paid(abby_invoice_id, amount, date, method)';
END $$;
```

---

## 8. Migration 007 : RPC Functions BFA

**Fichier** : `20251011_007_create_rpc_bfa_functions.sql`

```sql
-- =====================================================================
-- Migration 007: RPC Functions BFA (Bonus Fin d'Année)
-- Date: 2025-10-11
-- Description: Fonctions calcul CA annuel et BFA clients
-- =====================================================================

-- =====================================================================
-- FONCTION 1: CALCULER CA ANNUEL CLIENT
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_annual_revenue_bfa(
  p_organisation_id UUID,
  p_fiscal_year INTEGER
) RETURNS TABLE (
  organisation_id UUID,
  organisation_name TEXT,
  fiscal_year INTEGER,
  total_revenue_ht DECIMAL(12,2),
  bfa_rate DECIMAL(5,2),
  bfa_amount DECIMAL(12,2)
) AS $$
DECLARE
  v_revenue DECIMAL(12,2);
  v_bfa_rate DECIMAL(5,2);
  v_bfa_amount DECIMAL(12,2);
  v_org_name TEXT;
BEGIN
  -- 1. Récupérer nom organisation
  SELECT name INTO v_org_name
  FROM organisations
  WHERE id = p_organisation_id;

  IF v_org_name IS NULL THEN
    RAISE EXCEPTION 'Organisation % introuvable', p_organisation_id;
  END IF;

  -- 2. Calculer CA annuel facturé (factures payées uniquement)
  SELECT COALESCE(SUM(i.total_ht), 0) INTO v_revenue
  FROM invoices i
  JOIN sales_orders so ON i.sales_order_id = so.id
  WHERE so.customer_id = p_organisation_id
    AND i.status IN ('paid', 'partially_paid')
    AND EXTRACT(YEAR FROM i.invoice_date) = p_fiscal_year;

  -- 3. Déterminer taux BFA selon paliers
  -- PALIERS À DÉFINIR BUSINESS (exemple ci-dessous)
  -- < 10,000€       → 0%
  -- 10,000-25,000€  → 3%
  -- 25,000-50,000€  → 5%
  -- > 50,000€       → 7%

  IF v_revenue < 10000 THEN
    v_bfa_rate := 0;
  ELSIF v_revenue < 25000 THEN
    v_bfa_rate := 3;
  ELSIF v_revenue < 50000 THEN
    v_bfa_rate := 5;
  ELSE
    v_bfa_rate := 7;
  END IF;

  -- 4. Calculer montant BFA
  v_bfa_amount := ROUND(v_revenue * (v_bfa_rate / 100), 2);

  -- 5. Retourner résultat
  RETURN QUERY SELECT
    p_organisation_id,
    v_org_name,
    p_fiscal_year,
    v_revenue,
    v_bfa_rate,
    v_bfa_amount;

  RAISE NOTICE 'BFA calculé: Organisation % (%€ HT) → Taux %% = %€',
    v_org_name, v_revenue, v_bfa_rate, v_bfa_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire documentation
COMMENT ON FUNCTION calculate_annual_revenue_bfa IS
  'Calcule CA annuel facturé (paid) et taux/montant BFA selon paliers';

-- =====================================================================
-- FONCTION 2: GÉNÉRER RAPPORT BFA TOUS CLIENTS
-- =====================================================================

CREATE OR REPLACE FUNCTION generate_bfa_report_all_customers(
  p_fiscal_year INTEGER
) RETURNS TABLE (
  organisation_id UUID,
  organisation_name TEXT,
  total_revenue_ht DECIMAL(12,2),
  bfa_rate DECIMAL(5,2),
  bfa_amount DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bfa.organisation_id,
    bfa.organisation_name,
    bfa.total_revenue_ht,
    bfa.bfa_rate,
    bfa.bfa_amount
  FROM LATERAL (
    SELECT * FROM calculate_annual_revenue_bfa(o.id, p_fiscal_year)
  ) bfa
  JOIN organisations o ON o.id = bfa.organisation_id
  WHERE bfa.bfa_amount > 0 -- Uniquement clients éligibles BFA
  ORDER BY bfa.total_revenue_ht DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire documentation
COMMENT ON FUNCTION generate_bfa_report_all_customers IS
  'Génère rapport BFA pour tous clients (CA > 0) pour année fiscale donnée';

-- =====================================================================
-- FONCTION 3: VÉRIFIER ÉLIGIBILITÉ BFA CLIENT
-- =====================================================================

CREATE OR REPLACE FUNCTION check_bfa_eligibility(
  p_organisation_id UUID,
  p_fiscal_year INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_bfa_data RECORD;
  v_is_eligible BOOLEAN;
BEGIN
  -- Calculer BFA
  SELECT * INTO v_bfa_data
  FROM calculate_annual_revenue_bfa(p_organisation_id, p_fiscal_year);

  -- Éligible si BFA > 0
  v_is_eligible := v_bfa_data.bfa_amount > 0;

  RETURN jsonb_build_object(
    'eligible', v_is_eligible,
    'organisation_id', v_bfa_data.organisation_id,
    'organisation_name', v_bfa_data.organisation_name,
    'fiscal_year', v_bfa_data.fiscal_year,
    'total_revenue_ht', v_bfa_data.total_revenue_ht,
    'bfa_rate', v_bfa_data.bfa_rate,
    'bfa_amount', v_bfa_data.bfa_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire documentation
COMMENT ON FUNCTION check_bfa_eligibility IS
  'Vérifie éligibilité BFA client pour année fiscale (retour JSON)';

-- =====================================================================
-- VALIDATION MIGRATION
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 007 - RPC Functions BFA créées avec succès';
  RAISE NOTICE '📊 Fonction 1: calculate_annual_revenue_bfa(org_id, year)';
  RAISE NOTICE '📊 Fonction 2: generate_bfa_report_all_customers(year)';
  RAISE NOTICE '📊 Fonction 3: check_bfa_eligibility(org_id, year)';
  RAISE NOTICE '⚠️ Paliers BFA à valider business: 0%%, 3%%, 5%%, 7%%';
END $$;
```

---

## 9. Migration 008 : Triggers Automatisation

**Fichier** : `20251011_008_create_triggers_automation.sql`

```sql
-- =====================================================================
-- Migration 008: Triggers Automatisation
-- Date: 2025-10-11
-- Description: Triggers business logic facturation
-- =====================================================================

-- =====================================================================
-- TRIGGER 1: AUTO-UPDATE STATUT FACTURE APRÈS PAIEMENT
-- =====================================================================
-- Déjà créé dans Migration 002 (update_invoice_status_on_payment)
-- Vérifie existence et recrée si nécessaire

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_invoice_status_on_payment_trigger'
  ) THEN
    CREATE TRIGGER update_invoice_status_on_payment_trigger
      AFTER INSERT OR UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_invoice_status_on_payment();

    RAISE NOTICE '✅ Trigger update_invoice_status_on_payment créé';
  ELSE
    RAISE NOTICE '⚠️ Trigger update_invoice_status_on_payment existe déjà';
  END IF;
END $$;

-- =====================================================================
-- TRIGGER 2: VALIDATION MONTANT PAIEMENT
-- =====================================================================
-- Déjà créé dans Migration 002 (validate_payment_amount)
-- Vérifie existence et recrée si nécessaire

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'validate_payment_amount_trigger'
  ) THEN
    CREATE TRIGGER validate_payment_amount_trigger
      BEFORE INSERT OR UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION validate_payment_amount();

    RAISE NOTICE '✅ Trigger validate_payment_amount créé';
  ELSE
    RAISE NOTICE '⚠️ Trigger validate_payment_amount existe déjà';
  END IF;
END $$;

-- =====================================================================
-- TRIGGER 3: ALERTE FACTURE EN RETARD (OVERDUE)
-- =====================================================================

CREATE OR REPLACE FUNCTION check_invoice_overdue()
RETURNS TRIGGER AS $$
BEGIN
  -- Si facture non payée et due_date dépassée → Marquer overdue
  IF NEW.status IN ('sent', 'partially_paid')
    AND NEW.due_date IS NOT NULL
    AND NEW.due_date < CURRENT_DATE
    AND OLD.status != 'overdue'
  THEN
    NEW.status := 'overdue';

    RAISE WARNING 'Facture % en retard (due_date: %) - Statut: overdue',
      NEW.abby_invoice_number, NEW.due_date;

    -- TODO: Déclencher notification email équipe (via webhook externe)
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger check overdue (quotidien via cron ou update manuel)
CREATE TRIGGER check_invoice_overdue_trigger
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  WHEN (NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE)
  EXECUTE FUNCTION check_invoice_overdue();

-- =====================================================================
-- TRIGGER 4: LOG CHANGEMENTS STATUT FACTURE (AUDIT)
-- =====================================================================

CREATE TABLE IF NOT EXISTS invoice_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_invoice_status_history_invoice ON invoice_status_history(invoice_id);
CREATE INDEX idx_invoice_status_history_changed_at ON invoice_status_history(changed_at DESC);

CREATE OR REPLACE FUNCTION log_invoice_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si changement de statut → Logger historique
  IF OLD.status != NEW.status THEN
    INSERT INTO invoice_status_history (
      invoice_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );

    RAISE NOTICE 'Statut facture % changé: % → %',
      NEW.abby_invoice_number, OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_invoice_status_change_trigger
  AFTER UPDATE ON invoices
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_invoice_status_change();

-- =====================================================================
-- VALIDATION MIGRATION
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 008 - Triggers Automatisation créés avec succès';
  RAISE NOTICE '🔄 Trigger 1: Auto-update statut facture après paiement';
  RAISE NOTICE '🔒 Trigger 2: Validation montant paiement ≤ total facture';
  RAISE NOTICE '⏰ Trigger 3: Alerte facture en retard (overdue)';
  RAISE NOTICE '📜 Trigger 4: Log historique changements statut (audit)';
  RAISE NOTICE '📊 Table invoice_status_history créée pour audit';
END $$;
```

---

## 10. Migration 009 : RLS Policies Sécurité

**Fichier** : `20251011_009_create_rls_policies_invoicing.sql`

```sql
-- =====================================================================
-- Migration 009: RLS Policies Sécurité
-- Date: 2025-10-11
-- Description: Row Level Security pour tables facturation
-- =====================================================================

-- =====================================================================
-- RLS POLICIES: TABLE INVOICES
-- =====================================================================

-- Activation RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin/Owner full access
CREATE POLICY "Admins full access invoices"
  ON invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
        AND users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  );

-- Policy 2: Users can view own organisation invoices
CREATE POLICY "Users can view own organisation invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sales_orders so
      JOIN user_organisation_assignments uoa ON so.customer_id = uoa.organisation_id
      WHERE so.id = invoices.sales_order_id
        AND uoa.user_id = auth.uid()
        AND uoa.is_active = true
    )
  );

-- =====================================================================
-- RLS POLICIES: TABLE PAYMENTS
-- =====================================================================

-- Activation RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin/Owner full access
CREATE POLICY "Admins full access payments"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
        AND users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  );

-- Policy 2: Users can view own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN sales_orders so ON i.sales_order_id = so.id
      JOIN user_organisation_assignments uoa ON so.customer_id = uoa.organisation_id
      WHERE i.id = payments.invoice_id
        AND uoa.user_id = auth.uid()
        AND uoa.is_active = true
    )
  );

-- =====================================================================
-- RLS POLICIES: TABLE ABBY_SYNC_QUEUE (ADMIN ONLY)
-- =====================================================================

-- Activation RLS
ALTER TABLE abby_sync_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Admin/Owner only
CREATE POLICY "Admin only sync queue"
  ON abby_sync_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
        AND users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  );

-- =====================================================================
-- RLS POLICIES: TABLE ABBY_WEBHOOK_EVENTS (ADMIN ONLY)
-- =====================================================================

-- Activation RLS
ALTER TABLE abby_webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy: Admin/Owner only
CREATE POLICY "Admin only webhook events"
  ON abby_webhook_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
        AND users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  );

-- =====================================================================
-- RLS POLICIES: TABLE INVOICE_STATUS_HISTORY (AUDIT)
-- =====================================================================

-- Activation RLS
ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admin/Owner full access
CREATE POLICY "Admins full access invoice status history"
  ON invoice_status_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
        AND users.raw_user_meta_data->>'role' IN ('admin', 'owner')
    )
  );

-- Policy: Users can view own history
CREATE POLICY "Users can view own invoice status history"
  ON invoice_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN sales_orders so ON i.sales_order_id = so.id
      JOIN user_organisation_assignments uoa ON so.customer_id = uoa.organisation_id
      WHERE i.id = invoice_status_history.invoice_id
        AND uoa.user_id = auth.uid()
        AND uoa.is_active = true
    )
  );

-- =====================================================================
-- VALIDATION MIGRATION
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 009 - RLS Policies Sécurité créées avec succès';
  RAISE NOTICE '🔒 Table invoices: Admin full access + Users own org invoices';
  RAISE NOTICE '🔒 Table payments: Admin full access + Users own payments';
  RAISE NOTICE '🔒 Table abby_sync_queue: Admin only';
  RAISE NOTICE '🔒 Table abby_webhook_events: Admin only';
  RAISE NOTICE '🔒 Table invoice_status_history: Admin full + Users own history';
  RAISE NOTICE '⚠️ Vérifier table user_organisation_assignments existe';
END $$;
```

---

## 11. Migration 010 : Index Performance

**Fichier** : `20251011_010_create_indexes_performance.sql`

```sql
-- =====================================================================
-- Migration 010: Index Performance
-- Date: 2025-10-11
-- Description: Index supplémentaires pour optimisation queries
-- =====================================================================

-- =====================================================================
-- INDEX COMPOSITES INVOICES
-- =====================================================================

-- Index composite customer_id + invoice_date (dashboard paiements client)
CREATE INDEX IF NOT EXISTS idx_invoices_customer_date ON invoices (
  (SELECT customer_id FROM sales_orders WHERE id = sales_order_id),
  invoice_date DESC
);

-- Index composite status + due_date (factures en retard)
CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date ON invoices (
  status, due_date
) WHERE status IN ('sent', 'partially_paid');

-- Index partial invoices paid (analytics CA)
CREATE INDEX IF NOT EXISTS idx_invoices_paid ON invoices (
  invoice_date DESC,
  total_ht
) WHERE status = 'paid';

-- =====================================================================
-- INDEX COMPOSITES PAYMENTS
-- =====================================================================

-- Index composite invoice_id + payment_date (historique paiements)
CREATE INDEX IF NOT EXISTS idx_payments_invoice_date ON payments (
  invoice_id,
  payment_date DESC
);

-- Index partial paiements récents (dashboard)
CREATE INDEX IF NOT EXISTS idx_payments_recent ON payments (
  payment_date DESC
) WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days';

-- =====================================================================
-- INDEX JSONB ABBY_SYNC_QUEUE
-- =====================================================================

-- Index GIN sur abby_payload pour recherche JSON
CREATE INDEX IF NOT EXISTS idx_sync_queue_payload ON abby_sync_queue
  USING GIN (abby_payload);

-- =====================================================================
-- INDEX PARTIAL ABBY_WEBHOOK_EVENTS
-- =====================================================================

-- Index partial événements non expirés (cleanup)
CREATE INDEX IF NOT EXISTS idx_webhook_events_not_expired ON abby_webhook_events (
  event_id
) WHERE expires_at > NOW();

-- =====================================================================
-- STATISTIQUES ET VACUUM
-- =====================================================================

-- Recalculer statistiques pour optimiseur
ANALYZE invoices;
ANALYZE payments;
ANALYZE abby_sync_queue;
ANALYZE abby_webhook_events;

-- =====================================================================
-- VALIDATION MIGRATION
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 010 - Index Performance créés avec succès';
  RAISE NOTICE '📊 Index composites: customer_date, status_due_date, paid, invoice_date';
  RAISE NOTICE '📊 Index partial: paid invoices, recent payments, not expired events';
  RAISE NOTICE '🔍 Index GIN: abby_payload (recherche JSON)';
  RAISE NOTICE '📈 Statistiques recalculées (ANALYZE)';
END $$;
```

---

## 12. Seed Data Exemple

**Fichier** : `20251011_seed_data_invoicing_example.sql` (optionnel - dev uniquement)

```sql
-- =====================================================================
-- Seed Data Exemple - Facturation Abby
-- Date: 2025-10-11
-- Description: Données exemple pour tests développement
-- ⚠️ NE PAS EXÉCUTER EN PRODUCTION
-- =====================================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_order_id UUID;
  v_invoice_id UUID;
  v_org_id UUID;
BEGIN
  -- Récupérer admin user
  SELECT id INTO v_admin_id
  FROM auth.users
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE WARNING 'Aucun utilisateur trouvé - Skip seed data';
    RETURN;
  END IF;

  -- Créer organisation test (si pas existe)
  INSERT INTO organisations (
    name,
    email,
    type,
    customer_type,
    abby_customer_id,
    siret
  ) VALUES (
    'Client Test Facturation',
    'test-facturation@verone.fr',
    'customer',
    'professional',
    'abby_org_test_123456',
    '12345678901234'
  )
  ON CONFLICT (siret) DO NOTHING
  RETURNING id INTO v_org_id;

  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id
    FROM organisations
    WHERE siret = '12345678901234';
  END IF;

  -- Créer commande test (si pas existe)
  INSERT INTO sales_orders (
    order_number,
    customer_id,
    status,
    total_ht,
    total_ttc,
    created_by
  ) VALUES (
    'SO-2025-TEST-001',
    v_org_id,
    'shipped',
    850.00,
    1020.00,
    v_admin_id
  )
  ON CONFLICT (order_number) DO NOTHING
  RETURNING id INTO v_order_id;

  IF v_order_id IS NULL THEN
    SELECT id INTO v_order_id
    FROM sales_orders
    WHERE order_number = 'SO-2025-TEST-001';
  END IF;

  -- Générer facture test
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
    abby_pdf_url,
    created_by
  ) VALUES (
    v_order_id,
    'abby_inv_test_789012',
    'INV-2025-TEST-001',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '20 days',
    850.00,
    1020.00,
    170.00,
    'sent',
    'https://abby.fr/invoices/test_789012.pdf',
    v_admin_id
  )
  ON CONFLICT (sales_order_id) DO NOTHING
  RETURNING id INTO v_invoice_id;

  IF v_invoice_id IS NULL THEN
    SELECT id INTO v_invoice_id
    FROM invoices
    WHERE sales_order_id = v_order_id;
  END IF;

  -- Créer paiement partiel test
  INSERT INTO payments (
    invoice_id,
    amount_paid,
    payment_date,
    payment_method,
    synced_from_abby_at,
    created_by
  ) VALUES (
    v_invoice_id,
    500.00,
    CURRENT_DATE - INTERVAL '5 days',
    'virement',
    NOW(),
    v_admin_id
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Seed data exemple créé avec succès';
  RAISE NOTICE '📊 Organisation: % (%)', v_org_id, 'Client Test Facturation';
  RAISE NOTICE '📊 Commande: % (%)', v_order_id, 'SO-2025-TEST-001';
  RAISE NOTICE '📊 Facture: % (%)', v_invoice_id, 'INV-2025-TEST-001';
  RAISE NOTICE '📊 Paiement partiel: 500.00€ / 1020.00€';
END $$;
```

---

## 13. Rollback Scripts

**Fichier** : `rollback_invoicing_migrations.sql` (urgence uniquement)

```sql
-- =====================================================================
-- ROLLBACK - Migrations Facturation Abby
-- Date: 2025-10-11
-- Description: Script rollback complet (URGENT UNIQUEMENT)
-- ⚠️ ATTENTION: Supprime toutes données facturation
-- =====================================================================

BEGIN;

-- Confirmer rollback
DO $$
BEGIN
  RAISE WARNING '⚠️ ROLLBACK FACTURATION ABBY - SUPPRESSION DÉFINITIVE DONNÉES';
  RAISE WARNING '⚠️ Appuyer Ctrl+C pour annuler dans 5 secondes...';
  PERFORM pg_sleep(5);
END $$;

-- Supprimer triggers
DROP TRIGGER IF EXISTS log_invoice_status_change_trigger ON invoices;
DROP TRIGGER IF EXISTS check_invoice_overdue_trigger ON invoices;
DROP TRIGGER IF EXISTS update_invoice_status_on_payment_trigger ON payments;
DROP TRIGGER IF EXISTS validate_payment_amount_trigger ON payments;

-- Supprimer fonctions
DROP FUNCTION IF EXISTS log_invoice_status_change();
DROP FUNCTION IF EXISTS check_invoice_overdue();
DROP FUNCTION IF EXISTS update_invoice_status_on_payment();
DROP FUNCTION IF EXISTS validate_payment_amount();
DROP FUNCTION IF EXISTS generate_invoice_from_order(UUID);
DROP FUNCTION IF EXISTS handle_abby_webhook_invoice_paid(TEXT, DECIMAL, DATE, TEXT);
DROP FUNCTION IF EXISTS calculate_annual_revenue_bfa(UUID, INTEGER);
DROP FUNCTION IF EXISTS generate_bfa_report_all_customers(INTEGER);
DROP FUNCTION IF EXISTS check_bfa_eligibility(UUID, INTEGER);
DROP FUNCTION IF EXISTS calculate_next_retry();
DROP FUNCTION IF EXISTS mark_sync_operation_success();
DROP FUNCTION IF EXISTS cleanup_old_sync_operations();
DROP FUNCTION IF EXISTS set_webhook_event_expiry();
DROP FUNCTION IF EXISTS cleanup_expired_webhook_events();

-- Supprimer tables (CASCADE supprime relations)
DROP TABLE IF EXISTS invoice_status_history CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS abby_webhook_events CASCADE;
DROP TABLE IF EXISTS abby_sync_queue CASCADE;

-- Supprimer colonnes organisations
ALTER TABLE organisations DROP COLUMN IF EXISTS abby_customer_id;

-- Supprimer colonnes individual_customers (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'individual_customers'
  ) THEN
    ALTER TABLE individual_customers DROP COLUMN IF EXISTS abby_contact_id;
  END IF;
END $$;

COMMIT;

-- Confirmation rollback
DO $$
BEGIN
  RAISE NOTICE '✅ Rollback facturation Abby terminé';
  RAISE NOTICE '⚠️ Toutes données facturation supprimées définitivement';
END $$;
```

---

## Conclusion

Ce document fournit **10 migrations SQL production-ready** pour intégration Abby Facturation dans Vérone Back Office.

**Ordre Exécution Strict** :
1. ✅ Migration 001 : Table invoices
2. ✅ Migration 002 : Table payments
3. ✅ Migration 003 : Table abby_sync_queue
4. ✅ Migration 004 : Table abby_webhook_events
5. ✅ Migration 005 : Colonnes abby_customer_id
6. ✅ Migration 006 : RPC Functions Facturation
7. ✅ Migration 007 : RPC Functions BFA
8. ✅ Migration 008 : Triggers Automatisation
9. ✅ Migration 009 : RLS Policies Sécurité
10. ✅ Migration 010 : Index Performance

**Validation Post-Migration** :
```sql
-- Vérifier toutes tables créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'invoices',
    'payments',
    'abby_sync_queue',
    'abby_webhook_events',
    'invoice_status_history'
  );

-- Vérifier RLS activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE '%invoice%' OR tablename LIKE '%payment%' OR tablename LIKE '%abby%';

-- Vérifier fonctions créées
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%invoice%' OR routine_name LIKE '%bfa%';
```

**Prochaines Étapes** :
1. Exécuter migrations en environnement local Supabase
2. Valider contraintes business (tests unitaires SQL)
3. Tester RPC functions avec données exemple
4. Vérifier RLS policies (aucun data leak)
5. Déployer production après validation complète

---

**Document Généré** : 2025-10-10
**Révision** : 1.0
**Contact** : Orchestrateur Système Vérone
