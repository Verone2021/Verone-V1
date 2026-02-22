-- Migration: Backfill sales_order_linkme_details for LinkMe orders created from back-office
-- These orders were created via use-linkme-orders.ts which did not create the details record.
--
-- NOT NULL columns that need placeholder values:
--   - requester_type: 'backoffice_created' (sentinel value, not a real requester type)
--   - requester_name: '' (empty string, will show as missing in messagerie)
--   - requester_email: '' (empty string, will show as missing in messagerie)
--   - is_new_restaurant: false (default)
--   - delivery_terms_accepted: false (default)

INSERT INTO public.sales_order_linkme_details (
  sales_order_id,
  requester_type,
  requester_name,
  requester_email,
  is_new_restaurant,
  delivery_terms_accepted
)
SELECT
  so.id,
  'manual_entry',
  '',
  '',
  false,
  false
FROM public.sales_orders so
LEFT JOIN public.sales_order_linkme_details sold ON sold.sales_order_id = so.id
WHERE (
  so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
  OR so.created_by_affiliate_id IS NOT NULL
)
AND sold.id IS NULL;
