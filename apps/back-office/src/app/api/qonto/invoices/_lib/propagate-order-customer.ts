/**
 * [BO-FIN-037] Propagation du billingOrgId + adresses vers la commande source.
 *
 * R6 : UPDATE uniquement si commande status = 'draft'.
 * Non-bloquant : log + skip si statut != draft ou si UPDATE échoue.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@verone/types';

/** Adresse partielle acceptable pour la propagation — postal_code peut être absent. */
interface IPartialAddress {
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  city?: string;
  country?: string;
}

interface IPropagateParams {
  supabase: SupabaseClient<Database>;
  salesOrderId: string;
  billingOrgId: string;
  billingAddress?: IPartialAddress;
  shippingAddress?: IPartialAddress;
}

/**
 * Propage le changement de facturation vers la commande source.
 *
 * - Ne s'exécute QUE si la commande est en status 'draft' (R6).
 * - Met à jour customer_id, billing_address et shipping_address.
 * - Non-bloquant : toute erreur est loggée et silenciée.
 */
export async function propagateOrderCustomer(
  params: IPropagateParams
): Promise<void> {
  const {
    supabase,
    salesOrderId,
    billingOrgId,
    billingAddress,
    shippingAddress,
  } = params;

  // Vérifier le statut avant UPDATE (R6 — jamais sur commande non-draft)
  const { data: orderStatus, error: fetchError } = await supabase
    .from('sales_orders')
    .select('status, customer_id')
    .eq('id', salesOrderId)
    .single();

  if (fetchError || !orderStatus) {
    console.warn(
      '[BO-FIN-037] Could not fetch order status for propagation, skipping:',
      fetchError
    );
    return;
  }

  if (orderStatus.status !== 'draft') {
    console.warn(
      `[BO-FIN-037] Order ${salesOrderId} not draft (status=${orderStatus.status}), skipping propagation`
    );
    return;
  }

  // Pas de propagation si l'org est déjà celle de la commande
  if (orderStatus.customer_id === billingOrgId) {
    return;
  }

  type SalesOrderUpdate =
    Database['public']['Tables']['sales_orders']['Update'];

  const update: SalesOrderUpdate = {
    customer_id: billingOrgId,
  };

  if (billingAddress) {
    update.billing_address = billingAddress as unknown as Json;
  }

  if (shippingAddress) {
    update.shipping_address = shippingAddress as unknown as Json;
  }

  try {
    const { error: updateError } = await supabase
      .from('sales_orders')
      .update(update as Record<string, unknown>)
      .eq('id', salesOrderId);

    if (updateError) {
      console.error(
        '[BO-FIN-037] Failed to propagate billing org to order (non-blocking):',
        updateError
      );
    } else {
      console.warn(
        `[BO-FIN-037] Propagated billing org ${billingOrgId} to order ${salesOrderId}`
      );
    }
  } catch (e) {
    console.error(
      '[BO-FIN-037] Exception propagating billing org to order (non-blocking):',
      e
    );
  }
}
