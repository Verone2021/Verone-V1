-- Migration: Supprimer SECURITY DEFINER sur 10 vues
-- Phase 1.2 : CRITICAL SECURITY (P0)
-- Source: Supabase Security Advisor - 10 vues avec SECURITY DEFINER
-- Date: 2025-11-21
-- Impact: Empêche bypass des RLS policies via vues

-- VUE 1: product_images_complete
DROP VIEW IF EXISTS public.product_images_complete CASCADE;
CREATE VIEW public.product_images_complete AS
SELECT pi.id, pi.product_id, pi.image_url, pi.display_order, pi.alt_text,
       pi.created_at, pi.updated_at, p.name AS product_name, p.organisation_id
FROM product_images pi
JOIN products p ON p.id = pi.product_id
ORDER BY pi.product_id, pi.display_order;

-- VUE 2: consultations_with_primary_image
DROP VIEW IF EXISTS public.consultations_with_primary_image CASCADE;
CREATE VIEW public.consultations_with_primary_image AS
SELECT cc.id, cc.customer_id, cc.product_id, cc.consultation_date, cc.status,
       cc.notes, cc.follow_up_date, cc.created_at, cc.updated_at, cc.organisation_id,
       p.name AS product_name,
       (SELECT pi.image_url FROM product_images pi
        WHERE pi.product_id = cc.product_id ORDER BY pi.display_order ASC LIMIT 1) AS primary_image_url
FROM client_consultations cc
LEFT JOIN products p ON p.id = cc.product_id;

-- VUE 3: stock_health_monitor
DROP VIEW IF EXISTS public.stock_health_monitor CASCADE;
CREATE VIEW public.stock_health_monitor AS
SELECT p.id AS product_id, p.name AS product_name, p.sku, p.organisation_id,
       COALESCE(s.quantity_available, 0) AS stock_available,
       COALESCE(s.quantity_forecasted_in, 0) AS forecasted_in,
       COALESCE(s.quantity_forecasted_out, 0) AS forecasted_out,
       COALESCE(s.minimum_stock_alert, 0) AS minimum_stock,
       p.status AS product_status,
       CASE WHEN COALESCE(s.quantity_available, 0) = 0 THEN 'OUT_OF_STOCK'
            WHEN COALESCE(s.quantity_available, 0) <= COALESCE(s.minimum_stock_alert, 0) THEN 'LOW_STOCK'
            ELSE 'HEALTHY' END AS stock_health
FROM products p
LEFT JOIN stock s ON s.product_id = p.id
WHERE p.archived_at IS NULL;

-- VUE 4: stock_overview
DROP VIEW IF EXISTS public.stock_overview CASCADE;
CREATE VIEW public.stock_overview AS
SELECT p.id AS product_id, p.name AS product_name, p.sku, p.organisation_id,
       s.quantity_available, s.quantity_forecasted_in, s.quantity_forecasted_out,
       s.minimum_stock_alert, s.updated_at AS stock_updated_at,
       (COALESCE(s.quantity_available, 0) + COALESCE(s.quantity_forecasted_in, 0) - COALESCE(s.quantity_forecasted_out, 0)) AS forecasted_stock
FROM products p
LEFT JOIN stock s ON s.product_id = p.id
WHERE p.archived_at IS NULL;

-- VUE 5: mcp_queue_status
DROP VIEW IF EXISTS public.mcp_queue_status CASCADE;
CREATE VIEW public.mcp_queue_status AS
SELECT entity_type, entity_id, operation, status, priority, retry_count,
       created_at, updated_at, scheduled_at, error_message
FROM mcp_sync_queue
ORDER BY priority DESC, created_at ASC;

-- VUE 6: stock_alerts_view
DROP VIEW IF EXISTS public.stock_alerts_view CASCADE;
CREATE VIEW public.stock_alerts_view AS
SELECT sa.id, sa.product_id, sa.alert_type, sa.threshold_value, sa.current_value,
       sa.is_resolved, sa.resolved_at, sa.created_at, sa.updated_at, sa.organisation_id,
       p.name AS product_name, p.sku, p.status AS product_status
FROM stock_alerts sa
JOIN products p ON p.id = sa.product_id
WHERE sa.is_resolved = false
ORDER BY sa.created_at DESC;

-- VUE 7: products_with_default_package
DROP VIEW IF EXISTS public.products_with_default_package CASCADE;
CREATE VIEW public.products_with_default_package AS
SELECT p.id, p.name, p.sku, p.organisation_id, p.status,
       p.package_length_cm, p.package_width_cm, p.package_height_cm, p.package_weight_kg,
       COALESCE(p.package_length_cm, 50) AS effective_length_cm,
       COALESCE(p.package_width_cm, 50) AS effective_width_cm,
       COALESCE(p.package_height_cm, 50) AS effective_height_cm,
       COALESCE(p.package_weight_kg, 5) AS effective_weight_kg
FROM products p
WHERE p.archived_at IS NULL;

-- VUE 8: individual_customers_display
DROP VIEW IF EXISTS public.individual_customers_display CASCADE;
CREATE VIEW public.individual_customers_display AS
SELECT ic.id, ic.customer_id, ic.first_name, ic.last_name, ic.birthdate, ic.gender,
       ic.created_at, ic.updated_at, c.email, c.phone, c.organisation_id, c.status AS customer_status,
       CONCAT(ic.first_name, ' ', ic.last_name) AS full_name
FROM individual_customers ic
JOIN customers c ON c.id = ic.customer_id;

-- VUE 9: collection_primary_images
DROP VIEW IF EXISTS public.collection_primary_images CASCADE;
CREATE VIEW public.collection_primary_images AS
SELECT c.id AS collection_id, c.name AS collection_name, c.slug, c.organisation_id, c.is_active,
       (SELECT ci.image_url FROM collection_images ci
        WHERE ci.collection_id = c.id ORDER BY ci.display_order ASC LIMIT 1) AS primary_image_url
FROM collections c
WHERE c.archived_at IS NULL;

-- VUE 10: audit_log_summary
DROP VIEW IF EXISTS public.audit_log_summary CASCADE;
CREATE VIEW public.audit_log_summary AS
SELECT al.id, al.table_name, al.operation, al.user_id, al.organisation_id,
       al.created_at, al.record_id, up.display_name AS user_name, up.email AS user_email
FROM audit_logs al
LEFT JOIN user_profiles up ON up.id = al.user_id
ORDER BY al.created_at DESC;
