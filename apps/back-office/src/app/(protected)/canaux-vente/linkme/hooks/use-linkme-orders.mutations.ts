import { createClient } from '@verone/utils/supabase/client';

import { fetchLinkMeOrderById } from './use-linkme-orders.fetchers';
import {
  LINKME_CHANNEL_ID,
  type CreateLinkMeOrderInput,
  type LinkMeOrder,
  type SalesOrderItemRow,
  type UpdateLinkMeOrderInput,
} from './use-linkme-orders.types';

/**
 * Met à jour une commande LinkMe
 */
export async function updateLinkMeOrder(
  input: UpdateLinkMeOrderInput
): Promise<LinkMeOrder> {
  const supabase = createClient();

  const { data: currentOrder, error: fetchError } = await supabase
    .from('sales_orders')
    .select(
      'id, tax_rate, shipping_cost_ht, insurance_cost_ht, handling_cost_ht, notes, sales_order_items(quantity, unit_price_ht)'
    )
    .eq('id', input.id)
    .single();

  if (fetchError || !currentOrder) {
    throw new Error('Commande non trouvée');
  }

  const taxRate = input.tax_rate ?? currentOrder.tax_rate ?? 0.2;
  const shippingCostHt =
    input.shipping_cost_ht ?? currentOrder.shipping_cost_ht ?? 0;
  const insuranceCostHt =
    input.insurance_cost_ht ?? currentOrder.insurance_cost_ht ?? 0;
  const handlingCostHt =
    input.handling_cost_ht ?? currentOrder.handling_cost_ht ?? 0;

  let productsHt = 0;
  if (input.items && input.items.length > 0) {
    for (const item of input.items) {
      productsHt += item.quantity * item.unit_price_ht;
    }
  } else {
    const items = currentOrder.sales_order_items as SalesOrderItemRow[] | null;
    for (const item of items ?? []) {
      productsHt += item.quantity * item.unit_price_ht;
    }
  }

  const totalHt =
    productsHt + shippingCostHt + insuranceCostHt + handlingCostHt;
  const totalTtc = totalHt * (1 + taxRate);

  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({
      tax_rate: taxRate,
      shipping_cost_ht: shippingCostHt,
      insurance_cost_ht: insuranceCostHt,
      handling_cost_ht: handlingCostHt,
      notes: input.internal_notes ?? currentOrder.notes,
      total_ht: totalHt,
      total_ttc: totalTtc,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id);

  if (updateError) {
    console.error('Erreur mise à jour commande:', updateError);
    throw updateError;
  }

  if (input.items && input.items.length > 0) {
    for (const item of input.items) {
      if (item.id) {
        const updatePayload: Record<string, unknown> = {
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
        };
        if (item.retrocession_rate !== undefined) {
          updatePayload.retrocession_rate = item.retrocession_rate;
        }
        await supabase
          .from('sales_order_items')
          .update(updatePayload)
          .eq('id', item.id);
      }
    }
  }

  return fetchLinkMeOrderById(input.id);
}

/**
 * Crée une commande LinkMe
 * =====================================================
 * MAPPING DB CORRIGÉ :
 * - customer_id : ID unique du client (org OU individual)
 * - customer_type : 'organization' ou 'individual'
 * - order_number : généré via generate_so_number
 * - created_by : ID de l'utilisateur connecté
 * =====================================================
 */
export async function createLinkMeOrder(
  input: CreateLinkMeOrderInput
): Promise<LinkMeOrder> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Utilisateur non connecté. Veuillez vous reconnecter.');
  }

  const { data: orderNumber, error: numberError } =
    await supabase.rpc('generate_so_number');

  if (numberError) {
    console.error('Erreur génération numéro commande:', numberError);
    throw new Error('Impossible de générer le numéro de commande');
  }

  let productsHt = 0;
  let totalTva = 0;
  let _totalRetrocession = 0;

  for (const item of input.items) {
    const clientUnitPrice = item.unit_price_ht;
    const lineTotal = item.quantity * clientUnitPrice;
    const lineTva = lineTotal * (item.tax_rate ?? 0.2);
    productsHt += lineTotal;
    totalTva += lineTva;
    _totalRetrocession +=
      item.unit_price_ht * item.quantity * item.retrocession_rate;
  }

  const shippingCostHt = input.shipping_cost_ht ?? 0;
  const insuranceCostHt = input.insurance_cost_ht ?? 0;
  const handlingCostHt = input.handling_cost_ht ?? 0;
  const fraisTaxRate = input.frais_tax_rate ?? 0.2;
  const totalFrais = shippingCostHt + insuranceCostHt + handlingCostHt;
  const totalHt = productsHt + totalFrais;
  const totalTvaFrais = totalFrais * fraisTaxRate;
  const totalTtc = totalHt + totalTva + totalTvaFrais;

  const customerId =
    input.customer_type === 'organization'
      ? input.customer_organisation_id
      : input.individual_customer_id;

  if (!customerId) {
    throw new Error('ID client requis');
  }

  const orderData = {
    order_number: orderNumber,
    channel_id: LINKME_CHANNEL_ID,
    customer_id: customerId,
    customer_type: input.customer_type,
    created_by: user.id,
    created_by_affiliate_id: input.affiliate_id,
    status: 'draft' as const,
    payment_status_v2: 'pending',
    total_ht: totalHt,
    total_ttc: totalTtc,
    tax_rate: 0,
    order_date: input.order_date,
    notes: input.internal_notes ?? null,
    shipping_cost_ht: shippingCostHt,
    insurance_cost_ht: insuranceCostHt,
    handling_cost_ht: handlingCostHt,
    responsable_contact_id: input.responsable_contact_id ?? null,
    billing_contact_id: input.billing_contact_id ?? null,
    delivery_contact_id: input.delivery_contact_id ?? null,
    billing_address: input.billing_address
      ? JSON.stringify({
          address_line1: input.billing_address.address_line1,
          city: input.billing_address.city,
          postal_code: input.billing_address.postal_code,
          country: input.billing_address.country ?? 'FR',
        })
      : null,
    shipping_address: input.shipping_address
      ? JSON.stringify({
          address_line1: input.shipping_address.address_line1,
          address_line2: input.shipping_address.address_line2 ?? '',
          city: input.shipping_address.city,
          postal_code: input.shipping_address.postal_code,
          country: input.shipping_address.country ?? 'FR',
        })
      : null,
    expected_delivery_date: input.expected_delivery_date ?? null,
    is_shopping_center_delivery: input.is_shopping_center_delivery ?? false,
    accepts_semi_truck: input.accepts_semi_truck ?? true,
  };

  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert(orderData)
    .select(
      'id, order_number, linkme_display_number, channel_id, customer_id, customer_type, status, payment_status_v2, total_ht, total_ttc, tax_rate, shipping_cost_ht, insurance_cost_ht, handling_cost_ht, notes, created_at, updated_at'
    )
    .single();

  if (orderError) {
    console.error('Erreur création commande:', orderError);
    throw new Error(
      `Erreur création commande: ${orderError.message ?? 'Erreur inconnue'}`
    );
  }

  const orderItems = input.items.map(item => ({
    sales_order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price_ht: item.unit_price_ht,
    tax_rate: item.tax_rate ?? 0.2,
    retrocession_rate: item.retrocession_rate,
    base_price_ht_locked: item.base_price_ht,
    selling_price_ht_locked: item.unit_price_ht,
    linkme_selection_item_id: item.linkme_selection_item_id ?? null,
  }));

  const { error: itemsError } = await supabase
    .from('sales_order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('Erreur création lignes commande:', itemsError);
    await supabase.from('sales_orders').delete().eq('id', order.id);
    throw itemsError;
  }

  const ld = input.linkme_details;
  const { error: detailsError } = await supabase
    .from('sales_order_linkme_details')
    .insert({
      sales_order_id: order.id,
      requester_type: 'manual_entry' as const,
      requester_name: '',
      requester_email: '',
      requester_phone: ld?.requester_phone ?? null,
      is_new_restaurant: false,
      delivery_terms_accepted: false,
      billing_name: ld?.billing_name ?? null,
      billing_email: ld?.billing_email ?? null,
      billing_phone: ld?.billing_phone ?? null,
      delivery_contact_name: ld?.delivery_contact_name ?? null,
      delivery_contact_email: ld?.delivery_contact_email ?? null,
      delivery_contact_phone: ld?.delivery_contact_phone ?? null,
      delivery_address: ld?.delivery_address ?? null,
      delivery_postal_code: ld?.delivery_postal_code ?? null,
      delivery_city: ld?.delivery_city ?? null,
      is_mall_delivery: ld?.is_mall_delivery ?? false,
      semi_trailer_accessible: ld?.semi_trailer_accessible ?? true,
      desired_delivery_date: ld?.desired_delivery_date ?? null,
      delivery_notes: ld?.delivery_notes ?? null,
    });

  if (detailsError) {
    console.error(
      '[createLinkMeOrder] Erreur création sales_order_linkme_details:',
      detailsError
    );
  }

  return order as unknown as LinkMeOrder;
}
