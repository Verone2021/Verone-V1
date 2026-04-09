'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  CreatePurchaseOrderData,
  UpdatePurchaseOrderData,
  ReceiveItemData,
  ManualPaymentType,
} from './types';

// Créer une nouvelle commande
export async function createOrder(
  supabase: SupabaseClient,
  data: CreatePurchaseOrderData,
  callbacks: {
    onSuccess: (order: {
      id: string;
      po_number: string;
      status: string;
    }) => void;
    onError: (message: string) => void;
    refreshOrders: () => Promise<void>;
    refreshStats: () => Promise<void>;
  }
): Promise<{ id: string; po_number: string; status: string } | null> {
  // 1. Generate PO number
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data: poNumber, error: numberError } =
    await supabase.rpc('generate_po_number');

  if (numberError) throw numberError;

  // 2. Calculate totals (including eco_tax)
  const totalHT = data.items.reduce((sum, item) => {
    const subtotal =
      item.quantity *
      item.unit_price_ht *
      (1 - (item.discount_percentage ?? 0) / 100);
    const itemEcoTax = (item.eco_tax ?? 0) * item.quantity;
    return sum + subtotal + itemEcoTax;
  }, 0);

  const ecoTaxTotal = data.items.reduce((sum, item) => {
    return sum + (item.eco_tax ?? 0) * item.quantity;
  }, 0);

  const totalTTC = totalHT * (1 + 0.2); // Default VAT 20%

  // 3. Create the order
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Utilisateur non authentifié');

  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      po_number: poNumber,
      supplier_id: data.supplier_id,
      expected_delivery_date: data.expected_delivery_date,
      delivery_address: data.delivery_address as
        | import('@verone/types').Json
        | undefined,
      payment_terms: data.payment_terms,
      notes: data.notes,
      total_ht: totalHT,
      total_ttc: totalTTC,
      eco_tax_total: ecoTaxTotal,
      eco_tax_vat_rate: data.eco_tax_vat_rate ?? null,
      shipping_cost_ht: data.shipping_cost_ht ?? 0,
      customs_cost_ht: data.customs_cost_ht ?? 0,
      insurance_cost_ht: data.insurance_cost_ht ?? 0,
      created_by: user.id,
    })
    .select('id, po_number, status')
    .single();

  if (orderError) throw orderError;

  // 4. Create items (including eco_tax)
  const { error: itemsError } = await supabase
    .from('purchase_order_items')
    .insert(
      data.items.map(item => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        purchase_order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        discount_percentage: item.discount_percentage ?? 0,
        eco_tax: item.eco_tax ?? 0,
        expected_delivery_date: item.expected_delivery_date,
        notes: item.notes,
      }))
    );

  if (itemsError) throw itemsError;

  await callbacks.refreshOrders();
  await callbacks.refreshStats();

  return order;
}

// Mettre à jour une commande
export async function updateOrder(
  supabase: SupabaseClient,
  orderId: string,
  data: UpdatePurchaseOrderData
): Promise<void> {
  const { error } = await supabase
    .from('purchase_orders')
    .update({
      expected_delivery_date: data.expected_delivery_date,
      payment_terms: data.payment_terms,
      notes: data.notes,
      ...(data.delivery_address !== undefined && {
        delivery_address: data.delivery_address as import('@verone/types').Json,
      }),
    })
    .eq('id', orderId);

  if (error) throw error;
}

// Changer le statut d'une commande (utilise Server Action pour bypasser RLS)
export async function updateStatus(
  supabase: SupabaseClient,
  orderId: string,
  _newStatus: PurchaseOrderStatus,
  callbacks: {
    refreshStats: () => Promise<void>;
    refreshOrder: (id: string) => Promise<PurchaseOrder | null>;
    currentOrderId?: string | null;
  }
): Promise<void> {
  // Récupérer l'utilisateur courant
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error('Utilisateur non authentifié');
  }

  // FIXME: updatePurchaseOrderStatusAction server action can't be imported from monorepo
  // // Appeler la Server Action qui bypass RLS
  // const result = await updatePurchaseOrderStatusAction(
  //   orderId,
  //   newStatus,
  //   user.id
  // );

  // if (!result.success) {
  //   throw new Error(result.error || 'Erreur lors de la mise à jour');
  // }

  // toast({
  //   title: 'Succès',
  //   description: `Commande marquée comme ${newStatus}`,
  // });

  // await fetchOrders();
  await callbacks.refreshStats(); // ✅ FIX Bug #6: Rafraîchir les stats après changement de statut
  if (callbacks.currentOrderId === orderId) {
    await callbacks.refreshOrder(orderId);
  }
}

// Réceptionner des items (totalement ou partiellement)
export async function receiveItems(
  supabase: SupabaseClient,
  orderId: string,
  itemsToReceive: ReceiveItemData[],
  callbacks: {
    updateStatusFn: (id: string, status: PurchaseOrderStatus) => Promise<void>;
  }
): Promise<void> {
  // 1. Mettre à jour les quantités reçues
  for (const item of itemsToReceive) {
    // Récupérer la quantité actuelle
    const { data: currentItem, error: fetchError } = await supabase
      .from('purchase_order_items')
      .select('quantity_received')
      .eq('id', item.item_id)
      .single();

    if (fetchError) throw fetchError;

    // Mettre à jour avec la nouvelle quantité
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const newQuantity =
      (currentItem.quantity_received ?? 0) + item.quantity_received;

    const { error: updateError } = await supabase
      .from('purchase_order_items')
      .update({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        quantity_received: newQuantity,
      })
      .eq('id', item.item_id);

    if (updateError) throw updateError;

    // Note: Le mouvement de stock est créé automatiquement par le trigger
    // handle_purchase_order_forecast() qui détecte le changement de quantity_received
  }

  // 2. Vérifier si la commande est entièrement reçue
  const { data: orderItems, error: checkError } = await supabase
    .from('purchase_order_items')
    .select('quantity, quantity_received')
    .eq('purchase_order_id', orderId);

  if (checkError) throw checkError;

  const isFullyReceived = orderItems?.every(
    item => item.quantity_received >= item.quantity
  );
  const isPartiallyReceived = orderItems?.some(
    item => item.quantity_received > 0
  );

  let newStatus: PurchaseOrderStatus = 'validated';
  if (isFullyReceived) {
    newStatus = 'received';
  } else if (isPartiallyReceived) {
    newStatus = 'partially_received';
  }

  // 4. Mettre à jour le statut de la commande
  await callbacks.updateStatusFn(orderId, newStatus);
}

// Supprimer une commande (draft ou cancelled seulement)
export async function deleteOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<void> {
  const { error } = await supabase
    .from('purchase_orders')
    .delete()
    .eq('id', orderId)
    .in('status', ['draft', 'cancelled']); // Sécurité : seules les commandes draft ou cancelled peuvent être supprimées

  if (error) throw error;
}

// Marquer comme payé manuellement (aligné avec sales orders)
export async function markAsManuallyPaid(
  supabase: SupabaseClient,
  orderId: string,
  paymentType: ManualPaymentType,
  amount: number,
  options?: {
    reference?: string;
    note?: string;
    date?: Date;
  }
): Promise<void> {
  // 1. Appeler la RPC (insère dans order_payments + recalcule paid_amount)
  const { error: rpcError } = await supabase.rpc('mark_po_payment_received', {
    p_order_id: orderId,
    p_amount: amount,
    p_payment_type: paymentType,
    p_reference: options?.reference ?? null,
    p_note: options?.note ?? null,
    p_date: options?.date?.toISOString() ?? null,
  });

  if (rpcError) throw rpcError;
}

// Delete a manual payment from order_payments
export async function deleteManualPayment(
  supabase: SupabaseClient,
  paymentId: string
): Promise<void> {
  const { error } = await supabase.rpc('delete_order_payment', {
    p_payment_id: paymentId,
  });

  if (error) throw error;
}
