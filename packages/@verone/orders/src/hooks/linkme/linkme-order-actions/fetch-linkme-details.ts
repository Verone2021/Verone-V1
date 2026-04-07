'use client';

import { createClient } from '@verone/utils/supabase/client';
import type { LinkMeOrderDetails } from './types';

/**
 * Récupère les détails LinkMe d'une commande
 */
export async function fetchLinkMeOrderDetails(
  orderId: string
): Promise<LinkMeOrderDetails | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sales_order_linkme_details')
    .select('*')
    .eq('sales_order_id', orderId)
    .maybeSingle();

  if (error) {
    console.error('Erreur fetch LinkMe details:', error);
    throw error;
  }

  return data as LinkMeOrderDetails | null;
}
