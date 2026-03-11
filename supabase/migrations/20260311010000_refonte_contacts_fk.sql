-- ============================================================================
-- Migration: Refonte architecture contacts commandes LinkMe
--
-- Objectif: Passer de flat-copy (linkme_details) à FK (sales_orders.contacts)
-- Les champs flat restent en DB comme audit trail mais l'UI lira via FK.
-- ============================================================================

-- 1. Ajouter colonne is_delivery_only sur contacts
-- (contact ponctuel livraison, sans organisation_id)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_delivery_only BOOLEAN DEFAULT false;

-- 2. Peupler responsable_contact_id depuis linkme_details (best-effort match par email)
UPDATE sales_orders so
SET responsable_contact_id = c.id
FROM sales_order_linkme_details d
JOIN contacts c ON LOWER(TRIM(c.email)) = LOWER(TRIM(d.requester_email)) AND c.is_active = true
WHERE d.sales_order_id = so.id
  AND so.responsable_contact_id IS NULL
  AND d.requester_email IS NOT NULL AND TRIM(d.requester_email) != '';

-- 3. Peupler billing_contact_id depuis linkme_details (match par email)
UPDATE sales_orders so
SET billing_contact_id = c.id
FROM sales_order_linkme_details d
JOIN contacts c ON LOWER(TRIM(c.email)) = LOWER(TRIM(d.billing_email)) AND c.is_active = true
WHERE d.sales_order_id = so.id
  AND so.billing_contact_id IS NULL
  AND d.billing_email IS NOT NULL AND TRIM(d.billing_email) != '';

-- 4. Peupler delivery_contact_id depuis linkme_details (match par email)
UPDATE sales_orders so
SET delivery_contact_id = c.id
FROM sales_order_linkme_details d
JOIN contacts c ON LOWER(TRIM(c.email)) = LOWER(TRIM(d.delivery_contact_email)) AND c.is_active = true
WHERE d.sales_order_id = so.id
  AND so.delivery_contact_id IS NULL
  AND d.delivery_contact_email IS NOT NULL AND TRIM(d.delivery_contact_email) != '';
