'use client';

import type { createClient } from '@verone/utils/supabase/client';

type SupabaseClient = ReturnType<typeof createClient>;

interface OrderWithCustomer {
  customer_type: string;
  customer_id: string | null;
  individual_customer_id: string | null;
}

/**
 * Enrichit une liste de commandes avec customer_name
 * Gère la relation polymorphique organization / individual
 */
export async function enrichCustomerNames<T extends OrderWithCustomer>(
  supabase: SupabaseClient,
  orders: T[]
): Promise<(T & { customer_name: string })[]> {
  const orgIds = orders
    .filter(o => o.customer_type === 'organization' && o.customer_id)
    .map(o => o.customer_id)
    .filter((id): id is string => id !== null);

  const indivIds = orders
    .filter(o => o.customer_type === 'individual' && o.individual_customer_id)
    .map(o => o.individual_customer_id)
    .filter((id): id is string => id !== null);

  const organisationsMap = new Map<string, string>();
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from('organisations')
      .select('id, legal_name, trade_name')
      .in('id', orgIds);

    if (orgs) {
      orgs.forEach(org =>
        organisationsMap.set(org.id, org.trade_name ?? org.legal_name)
      );
    }
  }

  const individualsMap = new Map<string, string>();
  if (indivIds.length > 0) {
    const { data: indivs } = await supabase
      .from('individual_customers')
      .select('id, first_name, last_name')
      .in('id', indivIds);

    if (indivs) {
      indivs.forEach(indiv =>
        individualsMap.set(indiv.id, `${indiv.first_name} ${indiv.last_name}`)
      );
    }
  }

  return orders.map(order => ({
    ...order,
    customer_name:
      order.customer_type === 'organization'
        ? (organisationsMap.get(order.customer_id ?? '') ??
          'Organisation inconnue')
        : order.individual_customer_id
          ? (individualsMap.get(order.individual_customer_id) ??
            'Client inconnu')
          : 'Particulier',
  }));
}
