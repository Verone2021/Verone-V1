-- ============================================================================
-- Migration: Add delivery fields to sales_order_linkme_details
-- Date: 2026-01-15
-- Task: LM-ORD-009
-- Description: Ajouter colonnes détaillées livraison pour workflow 6 étapes
-- ============================================================================

-- ============================================
-- ALTER TABLE: Add delivery columns
-- ============================================

ALTER TABLE sales_order_linkme_details
ADD COLUMN delivery_contact_name TEXT,
ADD COLUMN delivery_contact_email TEXT,
ADD COLUMN delivery_contact_phone TEXT,
ADD COLUMN delivery_address TEXT,
ADD COLUMN delivery_postal_code TEXT,
ADD COLUMN delivery_city TEXT,
ADD COLUMN delivery_latitude NUMERIC(10,8),
ADD COLUMN delivery_longitude NUMERIC(11,8),
ADD COLUMN delivery_date DATE,
ADD COLUMN is_mall_delivery BOOLEAN DEFAULT FALSE,
ADD COLUMN mall_email TEXT,
ADD COLUMN access_form_required BOOLEAN DEFAULT FALSE,
ADD COLUMN access_form_url TEXT,
ADD COLUMN semi_trailer_accessible BOOLEAN DEFAULT TRUE,
ADD COLUMN delivery_notes TEXT;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN sales_order_linkme_details.delivery_contact_name IS
  'Nom complet du contact livraison (peut être = responsable)';

COMMENT ON COLUMN sales_order_linkme_details.delivery_contact_email IS
  'Email du contact livraison';

COMMENT ON COLUMN sales_order_linkme_details.delivery_contact_phone IS
  'Téléphone du contact livraison';

COMMENT ON COLUMN sales_order_linkme_details.delivery_address IS
  'Adresse complète de livraison (rue)';

COMMENT ON COLUMN sales_order_linkme_details.delivery_postal_code IS
  'Code postal de livraison';

COMMENT ON COLUMN sales_order_linkme_details.delivery_city IS
  'Ville de livraison';

COMMENT ON COLUMN sales_order_linkme_details.delivery_latitude IS
  'Latitude GPS pour livraison';

COMMENT ON COLUMN sales_order_linkme_details.delivery_longitude IS
  'Longitude GPS pour livraison';

COMMENT ON COLUMN sales_order_linkme_details.delivery_date IS
  'Date de livraison souhaitée (remplace desired_delivery_date)';

COMMENT ON COLUMN sales_order_linkme_details.is_mall_delivery IS
  'Livraison dans un centre commercial (TRUE/FALSE)';

COMMENT ON COLUMN sales_order_linkme_details.mall_email IS
  'Email du centre commercial (si is_mall_delivery = TRUE)';

COMMENT ON COLUMN sales_order_linkme_details.access_form_required IS
  'Formulaire d''accès requis pour livraison (TRUE/FALSE)';

COMMENT ON COLUMN sales_order_linkme_details.access_form_url IS
  'URL Supabase Storage du formulaire d''accès (si access_form_required = TRUE)';

COMMENT ON COLUMN sales_order_linkme_details.semi_trailer_accessible IS
  'Accessible par semi-remorque (TRUE par défaut)';

COMMENT ON COLUMN sales_order_linkme_details.delivery_notes IS
  'Notes optionnelles pour la livraison';
