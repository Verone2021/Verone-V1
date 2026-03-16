-- ============================================================================
-- Migration: Ajout champ delivery_asap
-- Date: 2026-03-14
-- Description: Permet de choisir "dès que possible" au lieu d'une date
--              de livraison spécifique
-- ============================================================================

ALTER TABLE sales_order_linkme_details
ADD COLUMN IF NOT EXISTS delivery_asap BOOLEAN DEFAULT false;

COMMENT ON COLUMN sales_order_linkme_details.delivery_asap IS
'Si true, livraison dès que possible (remplace desired_delivery_date)';
