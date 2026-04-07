export const ORGANISATION_COLUMNS = `
  id, legal_name, trade_name, has_different_trade_name, type, email, phone, country,
  is_active, is_enseigne_parent, is_service_provider, enseigne_id, ownership_type,
  address_line1, address_line2, city, postal_code, region, latitude, longitude,
  billing_address_line1, billing_address_line2, billing_city, billing_postal_code, billing_region, billing_country,
  shipping_address_line1, shipping_address_line2, shipping_city, shipping_postal_code, shipping_region, shipping_country,
  has_different_shipping_address, customer_type, prepayment_required, payment_terms, payment_terms_type, payment_terms_notes,
  siren, siret, vat_number, legal_form, logo_url, notes, currency, default_vat_rate, default_channel_id,
  delivery_time_days, minimum_order_amount, preferred_supplier, rating, supplier_segment, certification_labels,
  industry_sector, linkme_code, secondary_email, website, source, source_type, source_affiliate_id,
  abby_customer_id, show_on_linkme_globe, approval_status, approved_at, approved_by,
  archived_at, created_at, created_by, updated_at, kbis_url
` as const;
