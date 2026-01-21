-- ============================================================================
-- Migration: Add contact reference columns to sales_orders
-- Date: 2026-01-21
-- Task: Contact Management LinkMe
-- Description: Ajouter colonnes FK pour persister les contacts sélectionnés dans les commandes
-- ============================================================================

-- ============================================
-- 1. AJOUT DES COLONNES
-- ============================================

-- Ajouter les colonnes de référence aux contacts
ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS responsable_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS billing_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delivery_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- ============================================
-- 2. INDEXES POUR PERFORMANCE
-- ============================================

-- Index pour requêtes fréquentes sur les contacts
CREATE INDEX IF NOT EXISTS idx_sales_orders_responsable_contact
  ON sales_orders(responsable_contact_id)
  WHERE responsable_contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_orders_billing_contact
  ON sales_orders(billing_contact_id)
  WHERE billing_contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_orders_delivery_contact
  ON sales_orders(delivery_contact_id)
  WHERE delivery_contact_id IS NOT NULL;

-- ============================================
-- 3. COMMENTAIRES DE DOCUMENTATION
-- ============================================

COMMENT ON COLUMN sales_orders.responsable_contact_id IS
'Contact responsable de la commande (contact principal du restaurant).
Référence vers contacts.id. NULL si non défini ou contact supprimé (ON DELETE SET NULL).';

COMMENT ON COLUMN sales_orders.billing_contact_id IS
'Contact pour la facturation.
Peut être différent du responsable ou identique (même ID).
Référence vers contacts.id. NULL si non défini ou contact supprimé (ON DELETE SET NULL).';

COMMENT ON COLUMN sales_orders.delivery_contact_id IS
'Contact pour la livraison (réception marchandise).
Peut être le responsable, le contact facturation, ou un contact spécifique.
Référence vers contacts.id. NULL si non défini ou contact supprimé (ON DELETE SET NULL).';

-- ============================================
-- 4. ROLLBACK PLAN (si nécessaire)
-- ============================================

-- Pour rollback :
-- DROP INDEX IF EXISTS idx_sales_orders_delivery_contact;
-- DROP INDEX IF EXISTS idx_sales_orders_billing_contact;
-- DROP INDEX IF EXISTS idx_sales_orders_responsable_contact;
-- ALTER TABLE sales_orders DROP COLUMN IF EXISTS delivery_contact_id;
-- ALTER TABLE sales_orders DROP COLUMN IF EXISTS billing_contact_id;
-- ALTER TABLE sales_orders DROP COLUMN IF EXISTS responsable_contact_id;
