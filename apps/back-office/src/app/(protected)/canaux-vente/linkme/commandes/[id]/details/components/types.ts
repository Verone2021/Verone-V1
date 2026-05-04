import type { LinkMeOrderDetails } from '../../../../hooks/use-linkme-order-actions';

// ============================================
// TYPES
// ============================================

export interface CreatedByProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  /**
   * true si le créateur est un salarié back-office (entrée active dans
   * user_app_roles avec app='back-office'). Permet d'exclure ce destinataire
   * du modal "Demander des compléments" : un salarié ne peut pas se
   * demander à lui-même les infos qu'il n'a pas saisies.
   */
  is_back_office?: boolean;
}

/** Contact résolu via FK JOIN sur sales_orders -> contacts */
export interface ContactRef {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string | null;
}

export interface OrderWithDetails {
  id: string;
  order_number: string;
  linkme_display_number: string | null;
  created_at: string;
  order_date: string | null;
  status: string;
  total_ht: number;
  total_ttc: number;
  notes: string | null;
  customer_id: string | null;
  expected_delivery_date: string | null;
  pending_admin_validation: boolean | null;
  created_by_affiliate_id: string | null;
  linkme_selection_id: string | null;
  created_by: string | null;
  payment_status: string | null;
  payment_status_v2: string | null;
  payment_terms: string | null;
  paid_amount: number;
  currency: string | null;
  tax_rate: number | null;
  shipping_cost_ht: number | null;
  handling_cost_ht: number | null;
  insurance_cost_ht: number | null;
  fees_vat_rate: number | null;
  createdByProfile: CreatedByProfile | null;
  organisation: {
    id: string;
    trade_name: string | null;
    legal_name: string;
    approval_status: string | null;
    enseigne_id: string | null;
    address_line1: string | null;
    address_line2: string | null;
    postal_code: string | null;
    city: string | null;
    billing_address_line1: string | null;
    billing_address_line2: string | null;
    billing_city: string | null;
    billing_postal_code: string | null;
    shipping_address_line1: string | null;
    shipping_address_line2: string | null;
    shipping_city: string | null;
    shipping_postal_code: string | null;
    has_different_shipping_address: boolean | null;
    phone: string | null;
    email: string | null;
    siret: string | null;
    country: string | null;
    vat_number: string | null;
    ownership_type: 'franchise' | 'succursale' | null;
  } | null;
  items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price_ht: number;
    total_ht: number;
    tax_rate: number | null;
    product: {
      name: string;
      sku: string;
    } | null;
  }>;
  linkmeDetails: LinkMeOrderDetails | null;
  infoRequests: InfoRequest[];
  // Contacts via FK (source de vérité)
  responsable_contact_id: string | null;
  billing_contact_id: string | null;
  delivery_contact_id: string | null;
  responsable_contact: ContactRef | null;
  billing_contact: ContactRef | null;
  delivery_contact: ContactRef | null;
  // Rapprochement bancaire (from transaction_document_links)
  is_matched: boolean;
  matched_transaction_id: string | null;
  matched_transaction_label: string | null;
  matched_transaction_amount: number | null;
  matched_transaction_emitted_at: string | null;
  matched_transaction_attachment_ids: string[] | null;
}

export interface InfoRequest {
  id: string;
  token: string;
  recipient_email: string;
  recipient_type: string;
  sent_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
}

export interface EnrichedOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image_url: string | null;
  product_image_cloudflare_id: string | null;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  base_price_ht: number;
  margin_rate: number;
  commission_rate: number;
  selling_price_ht: number;
  affiliate_margin: number;
  retrocession_rate: number;
  created_by_affiliate: string | null;
  stock_real?: number | null;
  stock_forecasted?: number | null;
}

export interface SalesOrderItemRaw {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  tax_rate: number | null;
  products: { name: string; sku: string } | null;
}

export interface LinkmeOrderItemEnrichedRaw {
  id: string;
  product_id: string;
  product_name: string | null;
  product_sku: string | null;
  product_image_url: string | null;
  product_image_cloudflare_id: string | null;
  quantity: number | null;
  unit_price_ht: number | null;
  total_ht: number | null;
  base_price_ht: number | null;
  margin_rate: number | null;
  commission_rate: number | null;
  selling_price_ht: number | null;
  affiliate_margin: number | null;
  retrocession_rate?: number | null;
  created_by_affiliate: string | null;
  affiliate_commission_rate: number | null;
}

export type ContactRole = 'responsable' | 'billing' | 'delivery';

export interface FusedContactGroup {
  contact: ContactRef;
  roles: ContactRole[];
}

export function getOrderChannel(
  created_by_affiliate_id: string | null,
  linkme_selection_id: string | null
): { label: string; color: string; bg: string } {
  if (created_by_affiliate_id !== null) {
    return { label: 'Affilié', color: 'text-teal-700', bg: 'bg-teal-100' };
  }
  if (linkme_selection_id !== null) {
    return {
      label: 'Sélection publique',
      color: 'text-amber-700',
      bg: 'bg-amber-100',
    };
  }
  return { label: 'Back-office', color: 'text-blue-700', bg: 'bg-blue-100' };
}
