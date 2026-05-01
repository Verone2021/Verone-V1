import type {
  LinkMeOrder,
  OrderItem,
  QueryOrderRow,
} from './use-linkme-orders.types';

/**
 * Maps a Supabase query row to a LinkMeOrder domain object.
 */
export function mapRowToOrder(
  row: QueryOrderRow,
  imageMap: Map<string, string | null>,
  cloudflareImageMap: Map<string, string | null> = new Map()
): LinkMeOrder {
  const ld = row.linkme_details?.[0] ?? null;

  // Customer name: from organisation or individual_customer, fallback to linkme_details
  let customerName = 'Client inconnu';
  if (row.customer_type === 'organization' && row.organisation) {
    customerName =
      row.organisation.trade_name ??
      row.organisation.legal_name ??
      'Client inconnu';
  } else if (row.individual_customer) {
    customerName =
      `${row.individual_customer.first_name} ${row.individual_customer.last_name}`.trim();
  } else if (ld?.billing_name) {
    customerName = ld.billing_name;
  } else if (ld?.requester_name) {
    customerName = ld.requester_name;
  }

  // Compute total affiliate margin from items retrocession
  const totalAffiliateMargin =
    Number(row.affiliate_total_ht) ||
    row.items.reduce(
      (sum, item) => sum + (Number(item.retrocession_amount) || 0),
      0
    );

  // Compute total payout (catalogue commission + affiliate product revenue)
  const catalogueCommHT = row.items
    .filter(i => i.product?.created_by_affiliate == null)
    .reduce((sum, i) => sum + (Number(i.retrocession_amount) || 0), 0);
  const affiliateItemsArr = row.items.filter(
    i => i.product?.created_by_affiliate != null
  );
  const affiliateRevHT = affiliateItemsArr.reduce(
    (sum, i) => sum + (Number(i.total_ht) || 0),
    0
  );
  const affiliateLinkMeCommHT = affiliateItemsArr.reduce(
    (sum, i) =>
      sum +
      (Number(i.total_ht) || 0) *
        ((Number(i.product?.affiliate_commission_rate) || 0) / 100),
    0
  );
  const totalPayoutHT =
    catalogueCommHT + (affiliateRevHT - affiliateLinkMeCommHT);

  return {
    id: row.id,
    order_number: row.order_number,
    linkme_display_number: row.linkme_display_number ?? null,
    status: row.status,
    payment_status: row.payment_status_v2,
    total_ht: Number(row.total_ht) || 0,
    total_ttc: Number(row.total_ttc) || 0,
    shipping_cost_ht: Number(row.shipping_cost_ht) || 0,
    handling_cost_ht: Number(row.handling_cost_ht) || 0,
    insurance_cost_ht: Number(row.insurance_cost_ht) || 0,
    total_affiliate_margin: totalAffiliateMargin,
    total_payout_ht: totalPayoutHT,
    // Customer
    customer_name: customerName,
    customer_type:
      (row.customer_type as 'organization' | 'individual') ?? 'organization',
    customer_id: row.customer_id ?? '',
    customer_address: ld?.delivery_address ?? null,
    customer_postal_code: ld?.delivery_postal_code ?? null,
    customer_city: ld?.delivery_city ?? null,
    customer_email: ld?.billing_email ?? ld?.requester_email ?? null,
    customer_phone: ld?.billing_phone ?? ld?.requester_phone ?? null,
    // Structured addresses (fallback to organisation address if billing_address is null)
    billing_address:
      row.billing_address ??
      (row.organisation?.address_line1
        ? {
            line1: row.organisation.address_line1,
            city: row.organisation.city ?? undefined,
            postal_code: row.organisation.postal_code ?? undefined,
            country: row.organisation.country ?? undefined,
            contact_name: customerName,
          }
        : null),
    shipping_address: row.shipping_address,
    // Dates
    desired_delivery_date: ld?.desired_delivery_date ?? null,
    confirmed_delivery_date: ld?.confirmed_delivery_date ?? null,
    // Billing contact
    billing_name: ld?.billing_name ?? null,
    billing_email: ld?.billing_email ?? null,
    billing_phone: ld?.billing_phone ?? null,
    // Requester
    requester_name: ld?.requester_name ?? null,
    requester_email: ld?.requester_email ?? null,
    requester_phone: ld?.requester_phone ?? null,
    requester_position: ld?.requester_position ?? null,
    // Delivery contact
    delivery_contact_name: ld?.delivery_contact_name ?? null,
    delivery_contact_email: ld?.delivery_contact_email ?? null,
    delivery_contact_phone: ld?.delivery_contact_phone ?? null,
    // Delivery address
    delivery_address_text: ld?.delivery_address ?? null,
    delivery_postal_code: ld?.delivery_postal_code ?? null,
    delivery_city: ld?.delivery_city ?? null,
    // Delivery options
    is_mall_delivery: ld?.is_mall_delivery ?? false,
    delivery_notes: ld?.delivery_notes ?? null,
    owner_type: ld?.owner_type ?? null,
    // Reception contact
    reception_contact_name: ld?.reception_contact_name ?? null,
    reception_contact_email: ld?.reception_contact_email ?? null,
    reception_contact_phone: ld?.reception_contact_phone ?? null,
    // Affiliate
    affiliate_id: row.affiliate?.id ?? row.created_by_affiliate_id ?? '',
    affiliate_name: row.affiliate?.display_name ?? null,
    affiliate_type:
      (row.affiliate?.affiliate_type as 'enseigne' | 'organisation') ?? null,
    selection_id: row.selection?.id ?? row.linkme_selection_id ?? null,
    selection_name: row.selection?.name ?? null,
    items_count: row.items?.length ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    pending_admin_validation: row.pending_admin_validation ?? false,
    // Items with images
    items: (row.items ?? []).map(
      (item): OrderItem => ({
        id: item.id,
        product_id: item.product_id ?? item.product?.id ?? '',
        product_name: item.product?.name ?? 'Produit inconnu',
        product_sku: item.product?.sku ?? '',
        product_image_url: imageMap.get(item.product_id) ?? null,
        product_cloudflare_image_id:
          cloudflareImageMap.get(item.product_id) ?? null,
        quantity: item.quantity ?? 0,
        unit_price_ht: Number(item.unit_price_ht) || 0,
        total_ht: Number(item.total_ht) || 0,
        tax_rate: Number(item.tax_rate) || 0,
        base_price_ht: Number(item.base_price_ht_locked) || 0,
        margin_rate:
          Number(item.base_price_ht_locked) > 0
            ? ((Number(item.unit_price_ht) -
                Number(item.base_price_ht_locked)) /
                Number(item.base_price_ht_locked)) *
              100
            : 0,
        commission_rate: Number(item.retrocession_rate) || 0,
        selling_price_ht: Number(item.selling_price_ht_locked) || 0,
        affiliate_margin: Number(item.retrocession_amount) || 0,
        is_affiliate_product: item.product?.created_by_affiliate != null,
        affiliate_commission_rate:
          Number(item.product?.affiliate_commission_rate) || 0,
      })
    ),
  };
}
