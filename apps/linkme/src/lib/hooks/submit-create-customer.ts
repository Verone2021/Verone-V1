'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { OrderFormData } from '../../components/orders/schemas/order-form.schema';
import type { AffiliateData } from './submit-create-contacts';

/**
 * Étape 1 du submit : créer une nouvelle organisation ou récupérer l'existante.
 * Retourne le customerId (organisation).
 */
export async function createOrderCustomer(
  supabase: SupabaseClient,
  formData: OrderFormData,
  affiliate: AffiliateData,
  responsableEmail: string | null | undefined,
  responsablePhone: string | null | undefined
): Promise<string> {
  if (formData.restaurant.mode === 'new' && formData.restaurant.newRestaurant) {
    const newResto = formData.restaurant.newRestaurant;

    const rpcResponse = (await supabase.rpc(
      'create_customer_organisation_for_affiliate',
      {
        p_affiliate_id: affiliate.id,
        p_legal_name: newResto.tradeName,
        p_trade_name: newResto.tradeName,
        p_email: responsableEmail ?? undefined,
        p_phone: responsablePhone ?? undefined,
        p_address: newResto.address ?? formData.delivery.address ?? undefined,
        p_postal_code:
          newResto.postalCode ?? formData.delivery.postalCode ?? undefined,
        p_city: newResto.city ?? undefined,
        p_country: newResto.country ?? 'FR',
        p_latitude: newResto.latitude ?? undefined,
        p_longitude: newResto.longitude ?? undefined,
        p_enseigne_id: affiliate.enseigne_id ?? undefined,
        p_ownership_type: newResto.ownershipType ?? undefined,
      }
    )) as unknown as {
      data: string | null;
      error: { message?: string } | null;
    };

    if (rpcResponse.error) {
      console.error('Erreur création organisation:', rpcResponse.error);
      throw new Error(
        rpcResponse.error.message ?? 'Erreur lors de la création du restaurant'
      );
    }

    return rpcResponse.data as string;
  }

  // Organisation existante
  return formData.restaurant.existingId!;
}
