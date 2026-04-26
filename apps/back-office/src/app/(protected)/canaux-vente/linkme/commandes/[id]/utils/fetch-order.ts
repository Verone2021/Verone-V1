/**
 * Utility: Fetch a LinkMe order with all joins from Supabase
 */

import { createClient } from '@verone/utils/supabase/client';

import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';

import type {
  OrderWithDetails,
  EnrichedOrderItem,
  ContactRef,
  InfoRequest,
  CreatedByProfile,
} from '../components/types';

// ============================================
// RAW TYPES (intermediate Supabase data)
// ============================================

interface SalesOrderItemRaw {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  products: { name: string; sku: string } | null;
}

interface LinkmeOrderItemEnrichedRaw {
  id: string;
  product_id: string;
  product_name: string | null;
  product_sku: string | null;
  product_image_url: string | null;
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

// ============================================
// RESULT TYPE
// ============================================

export interface FetchOrderResult {
  order: OrderWithDetails;
  enrichedItems: EnrichedOrderItem[];
}

// ============================================
// QUERY STRING (outside function to reduce fn line count)
// ============================================

// Contacts FK JOINs removed from main query — fetched separately by PK
// to avoid heavy RLS policy evaluation on contacts table (3x subquery per row)
const ORDER_QUERY = `
  id,
  order_number,
  linkme_display_number,
  created_at,
  status,
  total_ht,
  total_ttc,
  notes,
  customer_id,
  customer_type,
  expected_delivery_date,
  created_by_affiliate_id,
  linkme_selection_id,
  created_by,
  payment_status_v2,
  payment_terms,
  currency,
  tax_rate,
  shipping_cost_ht,
  handling_cost_ht,
  insurance_cost_ht,
  fees_vat_rate,
  responsable_contact_id, billing_contact_id, delivery_contact_id,
  organisations!sales_orders_customer_id_fkey (
    id, trade_name, legal_name, approval_status, enseigne_id,
    address_line1, address_line2, postal_code, city,
    billing_address_line1, billing_address_line2, billing_city, billing_postal_code,
    shipping_address_line1, shipping_address_line2, shipping_city, shipping_postal_code,
    has_different_shipping_address, phone, email, siret, country, vat_number, kbis_url
  ),
  sales_order_linkme_details (
    id, sales_order_id, requester_type, requester_name, requester_email,
    requester_phone, requester_position, is_new_restaurant, owner_type,
    owner_contact_same_as_requester, owner_name, owner_email, owner_phone,
    owner_company_legal_name, owner_company_trade_name, owner_kbis_url,
    billing_contact_source, billing_name, billing_email, billing_phone,
    delivery_terms_accepted, delivery_date, desired_delivery_date,
    mall_form_required, mall_form_email, delivery_contact_name,
    delivery_contact_email, delivery_contact_phone, delivery_address,
    delivery_postal_code, delivery_city, delivery_notes, is_mall_delivery,
    mall_email, semi_trailer_accessible, access_form_required, access_form_url,
    step4_token, step4_token_expires_at, step4_completed_at,
    reception_contact_name, reception_contact_email, reception_contact_phone,
    confirmed_delivery_date, created_at, updated_at
  ),
  linkme_info_requests (
    id, token, recipient_email, recipient_type, sent_at,
    completed_at, cancelled_at, cancelled_reason
  ),
  sales_order_items (
    id, product_id, quantity, unit_price_ht, total_ht,
    products ( name, sku )
  )
`;

const CONTACT_FIELDS = 'id, first_name, last_name, email, phone, title';

const ENRICHED_QUERY =
  'id, product_id, product_name, product_sku, product_image_url, quantity, unit_price_ht, total_ht, base_price_ht, margin_rate, commission_rate, selling_price_ht, affiliate_margin, retrocession_rate, created_by_affiliate, affiliate_commission_rate';

// ============================================
// BUILDER HELPERS
// ============================================

function buildOrderFromData(
  orderData: Record<string, unknown>,
  createdByProfile: CreatedByProfile | null,
  createdByUserId: string | null
): OrderWithDetails {
  const organisation = (orderData['organisations'] ??
    null) as OrderWithDetails['organisation'];

  const linkmeDetailsRaw = orderData['sales_order_linkme_details'];
  const linkmeData = (
    Array.isArray(linkmeDetailsRaw)
      ? (linkmeDetailsRaw[0] ?? null)
      : (linkmeDetailsRaw ?? null)
  ) as LinkMeOrderDetails | null;

  const infoRequestsRaw = orderData['linkme_info_requests'];
  const infoRequests = (
    Array.isArray(infoRequestsRaw) ? infoRequestsRaw : []
  ) as InfoRequest[];

  const rawItems = (orderData['sales_order_items'] ??
    []) as SalesOrderItemRaw[];

  return {
    id: orderData['id'] as string,
    order_number: orderData['order_number'] as string,
    linkme_display_number:
      (orderData['linkme_display_number'] as string | null | undefined) ?? null,
    created_at: orderData['created_at'] as string,
    status: orderData['status'] as string,
    total_ht: (orderData['total_ht'] as number | null) ?? 0,
    total_ttc: (orderData['total_ttc'] as number | null) ?? 0,
    notes: orderData['notes'] as string | null,
    customer_id: orderData['customer_id'] as string,
    expected_delivery_date: orderData['expected_delivery_date'] as
      | string
      | null,
    created_by_affiliate_id:
      (orderData['created_by_affiliate_id'] as string | null) ?? null,
    linkme_selection_id:
      (orderData['linkme_selection_id'] as string | null) ?? null,
    created_by: createdByUserId,
    payment_status: null,
    payment_status_v2:
      (orderData['payment_status_v2'] as string | null) ?? null,
    payment_terms: (orderData['payment_terms'] as string | null) ?? null,
    currency: (orderData['currency'] as string | null) ?? null,
    tax_rate: (orderData['tax_rate'] as number | null) ?? null,
    shipping_cost_ht: (orderData['shipping_cost_ht'] as number | null) ?? null,
    handling_cost_ht: (orderData['handling_cost_ht'] as number | null) ?? null,
    insurance_cost_ht:
      (orderData['insurance_cost_ht'] as number | null) ?? null,
    fees_vat_rate: (orderData['fees_vat_rate'] as number | null) ?? null,
    createdByProfile,
    organisation,
    responsable_contact_id:
      (orderData['responsable_contact_id'] as string | null) ?? null,
    billing_contact_id:
      (orderData['billing_contact_id'] as string | null) ?? null,
    delivery_contact_id:
      (orderData['delivery_contact_id'] as string | null) ?? null,
    responsable_contact:
      (orderData['responsable_contact'] as ContactRef | null) ?? null,
    billing_contact:
      (orderData['billing_contact'] as ContactRef | null) ?? null,
    delivery_contact:
      (orderData['delivery_contact'] as ContactRef | null) ?? null,
    items: rawItems.map((item: SalesOrderItemRaw) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      total_ht: item.total_ht,
      product: item.products,
    })),
    linkmeDetails: linkmeData,
    infoRequests,
  };
}

function buildEnrichedItems(
  enrichedData: LinkmeOrderItemEnrichedRaw[]
): EnrichedOrderItem[] {
  return enrichedData.map((item: LinkmeOrderItemEnrichedRaw) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name ?? 'Produit inconnu',
    product_sku: item.product_sku ?? '-',
    product_image_url: item.product_image_url,
    quantity: item.quantity ?? 0,
    unit_price_ht: item.unit_price_ht ?? 0,
    total_ht: item.total_ht ?? 0,
    base_price_ht: item.base_price_ht ?? 0,
    margin_rate: item.margin_rate ?? 0,
    commission_rate: item.commission_rate ?? 0,
    selling_price_ht: item.selling_price_ht ?? 0,
    affiliate_margin: item.affiliate_margin ?? 0,
    retrocession_rate: item.retrocession_rate ?? 0,
    created_by_affiliate: item.created_by_affiliate ?? null,
  }));
}

async function fetchCreatedByProfile(
  supabase: ReturnType<typeof createClient>,
  createdByUserId: string
): Promise<CreatedByProfile | null> {
  // Récupère le profil + détecte si c'est un salarié back-office (rôle actif
  // dans user_app_roles). is_back_office alimente le filtre excludeCreator
  // du modal "Demander des compléments".
  const [profileResult, roleResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('user_id', createdByUserId)
      .single(),
    supabase
      .from('user_app_roles')
      .select('user_id')
      .eq('user_id', createdByUserId)
      .eq('app', 'back-office')
      .eq('is_active', true)
      .limit(1),
  ]);
  if (!profileResult.data) return null;
  return {
    ...(profileResult.data as CreatedByProfile),
    is_back_office:
      Array.isArray(roleResult.data) && roleResult.data.length > 0,
  };
}

// ============================================
// FETCH FUNCTION
// ============================================

async function fetchContactById(
  supabase: ReturnType<typeof createClient>,
  contactId: string | null
): Promise<ContactRef | null> {
  if (!contactId) return null;
  const { data } = await supabase
    .from('contacts')
    .select(CONTACT_FIELDS)
    .eq('id', contactId)
    .single();
  return data ? (data as ContactRef) : null;
}

export async function fetchOrderById(
  orderId: string
): Promise<FetchOrderResult> {
  const supabase = createClient();

  const { data: rawData, error: orderError } = await supabase
    .from('sales_orders')
    .select(ORDER_QUERY)
    .eq('id', orderId)
    .single();

  if (orderError) throw orderError;

  const orderData = rawData as Record<string, unknown>;

  // Isolation canal : cette page est reservee aux commandes LinkMe uniquement
  // Une commande LinkMe a obligatoirement created_by_affiliate_id OU linkme_selection_id
  if (
    !orderData['created_by_affiliate_id'] &&
    !orderData['linkme_selection_id']
  ) {
    throw new Error('Cette commande ne fait pas partie du canal LinkMe');
  }
  const createdByUserId = (orderData['created_by'] as string | null) ?? null;

  // Fetch contacts by PK in parallel (avoids heavy RLS on FK JOINs)
  const respId = (orderData['responsable_contact_id'] as string | null) ?? null;
  const billId = (orderData['billing_contact_id'] as string | null) ?? null;
  const delId = (orderData['delivery_contact_id'] as string | null) ?? null;
  // Deduplicate: if same contact has multiple roles, fetch only once
  const uniqueIds = [
    ...new Set([respId, billId, delId].filter(Boolean)),
  ] as string[];
  const contactResults = await Promise.all(
    uniqueIds.map(id => fetchContactById(supabase, id))
  );
  const contactMap = new Map<string, ContactRef>();
  uniqueIds.forEach((id, i) => {
    if (contactResults[i]) contactMap.set(id, contactResults[i]);
  });

  // Inject contacts into orderData for buildOrderFromData
  orderData['responsable_contact'] = respId
    ? (contactMap.get(respId) ?? null)
    : null;
  orderData['billing_contact'] = billId
    ? (contactMap.get(billId) ?? null)
    : null;
  orderData['delivery_contact'] = delId
    ? (contactMap.get(delId) ?? null)
    : null;

  const [createdByProfile, enrichedResult] = await Promise.all([
    createdByUserId
      ? fetchCreatedByProfile(supabase, createdByUserId)
      : Promise.resolve(null),
    supabase
      .from('linkme_order_items_enriched')
      .select(ENRICHED_QUERY)
      .eq('sales_order_id', orderId),
  ]);

  const order = buildOrderFromData(
    orderData,
    createdByProfile,
    createdByUserId
  );

  const enrichedData = enrichedResult.data;
  const enrichedItems =
    enrichedData && enrichedData.length > 0
      ? buildEnrichedItems(enrichedData as LinkmeOrderItemEnrichedRaw[])
      : [];

  return { order, enrichedItems };
}
