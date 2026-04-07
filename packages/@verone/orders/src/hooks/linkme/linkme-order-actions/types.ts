'use client';

// ============================================
// TYPES — linkme order actions
// ============================================

export interface ApproveOrderInput {
  orderId: string;
}

export interface RequestInfoMissingField {
  key: string;
  label: string;
  category: string;
  inputType: string;
}

export interface RequestInfoInput {
  orderId: string;
  customMessage?: string;
  /** Champs manquants détectés — envoyés au formulaire interactif */
  missingFields: RequestInfoMissingField[];
  /** Destinataire : demandeur ou propriétaire */
  recipientType?: 'requester' | 'owner';
  /** Emails destinataires explicites (prioritaire sur recipientType) */
  recipientEmails?: string[];
}

export interface RejectOrderInput {
  orderId: string;
  reason: string;
}

export interface OrderActionResult {
  success: boolean;
  message: string;
  step4Token?: string;
}

export interface LinkMeOrderDetails {
  id: string;
  sales_order_id: string;
  requester_type: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  requester_position: string | null;
  is_new_restaurant: boolean;
  owner_type: string | null;
  owner_contact_same_as_requester: boolean | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_company_legal_name: string | null;
  owner_company_trade_name: string | null;
  owner_kbis_url: string | null;
  billing_contact_source: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  delivery_terms_accepted: boolean | null;
  delivery_date: string | null;
  desired_delivery_date: string | null;
  mall_form_required: boolean | null;
  mall_form_email: string | null;
  step4_token: string | null;
  step4_token_expires_at: string | null;
  step4_completed_at: string | null;
  reception_contact_name: string | null;
  reception_contact_email: string | null;
  reception_contact_phone: string | null;
  confirmed_delivery_date: string | null;
  // Delivery fields (from form Step 7)
  delivery_contact_name: string | null;
  delivery_contact_email: string | null;
  delivery_contact_phone: string | null;
  delivery_address: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  delivery_notes: string | null;
  is_mall_delivery: boolean | null;
  mall_email: string | null;
  semi_trailer_accessible: boolean | null;
  access_form_required: boolean | null;
  access_form_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  /** Field keys explicitly ignored by back-office staff for this order */
  ignored_missing_fields: string[];
}

export interface UpdateLinkMeDetailsInput {
  orderId: string;
  updates: Partial<{
    // Étape 1: Demandeur
    requester_type: string;
    requester_name: string;
    requester_email: string;
    requester_phone: string | null;
    requester_position: string | null;
    is_new_restaurant: boolean;
    // Étape 2: Propriétaire
    owner_type: string | null;
    owner_contact_same_as_requester: boolean | null;
    owner_name: string | null;
    owner_email: string | null;
    owner_phone: string | null;
    owner_company_legal_name: string | null;
    owner_company_trade_name: string | null;
    owner_kbis_url: string | null;
    // Étape 3: Facturation
    billing_contact_source: string | null;
    billing_name: string | null;
    billing_email: string | null;
    billing_phone: string | null;
    // Livraison
    delivery_terms_accepted: boolean | null;
    desired_delivery_date: string | null;
    mall_form_required: boolean | null;
    mall_form_email: string | null;
    delivery_contact_name: string | null;
    delivery_contact_email: string | null;
    delivery_contact_phone: string | null;
    delivery_address: string | null;
    delivery_postal_code: string | null;
    delivery_city: string | null;
    delivery_notes: string | null;
    is_mall_delivery: boolean | null;
    mall_email: string | null;
    semi_trailer_accessible: boolean | null;
    access_form_required: boolean | null;
    access_form_url: string | null;
    // Post-approbation
    reception_contact_name: string | null;
    reception_contact_email: string | null;
    reception_contact_phone: string | null;
    confirmed_delivery_date: string | null;
  }>;
}

export interface PendingOrderItem {
  id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  products: {
    id: string;
    name: string;
    sku: string;
    primary_image_url: string | null;
  } | null;
}

export interface PendingOrderLinkMeDetails {
  is_new_restaurant: boolean;
  requester_type: string | null;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requester_position: string | null;
  owner_type: string | null;
  owner_contact_same_as_requester: boolean | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_company_legal_name: string | null;
  owner_company_trade_name: string | null;
  billing_contact_source: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  delivery_contact_name: string | null;
  delivery_contact_email: string | null;
  delivery_contact_phone: string | null;
  delivery_address: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  is_mall_delivery: boolean | null;
  mall_email: string | null;
  desired_delivery_date: string | null;
  mall_form_required: boolean | null;
  ignored_missing_fields: string[] | null;
  missing_fields_count: number | null;
}

export interface PendingOrder {
  id: string;
  order_number: string;
  linkme_display_number: string | null;
  status: string;
  total_ht: number;
  total_ttc: number;
  created_at: string;
  // LinkMe details (simple)
  requester_name: string | null;
  requester_email: string | null;
  requester_type: string | null;
  // Organisation
  organisation_name: string | null;
  enseigne_name: string | null;
  // Organisation info for missing fields
  organisation_siret: string | null;
  organisation_country: string | null;
  organisation_vat_number: string | null;
  organisation_legal_name: string | null;
  organisation_billing_address: string | null;
  organisation_billing_postal_code: string | null;
  organisation_billing_city: string | null;
  // Enriched data for detail view
  linkme_details: PendingOrderLinkMeDetails | null;
  items: PendingOrderItem[];
}

export type OrderValidationStatus = 'pending' | 'approved' | 'rejected';
