import { arrayToCSV, downloadCSV } from '@verone/utils/export/csv';
import { createClient } from '@verone/utils/supabase/client';

import { SITE_INTERNET_CHANNEL_ID } from '../constants';

// Type compatible avec arrayToCSV (Record<string, unknown>)
interface OrderExportRow extends Record<string, unknown> {
  order_number: string;
  created_at: string;
  status: string;
  customer_name: string;
  customer_email: string;
  total_ht: number;
  total_ttc: number;
}

// Type pour les infos client récupérées séparément
interface CustomerInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending_approval: 'En attente',
  validated: 'Validée',
  partially_shipped: 'Partiellement expédiée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

/**
 * Exporte les commandes site-internet au format CSV.
 * Fait deux requêtes : commandes + clients (pas de jointure inline pour éviter les types any).
 */
export async function exportOrdersCSV(): Promise<void> {
  const supabase = createClient();

  // 1. Fetch les commandes site-internet
  const { data: orders, error: ordersError } = await supabase
    .from('sales_orders')
    .select(
      'id, order_number, status, total_ttc, total_ht, created_at, individual_customer_id'
    )
    .eq('channel_id', SITE_INTERNET_CHANNEL_ID)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (ordersError) {
    console.error('[exportOrdersCSV] Fetch orders error:', ordersError);
    throw ordersError;
  }

  if (!orders || orders.length === 0) {
    throw new Error('Aucune commande à exporter.');
  }

  // 2. Récupérer les IDs clients uniques
  const customerIds = [
    ...new Set(
      orders
        .map(o => o.individual_customer_id)
        .filter((id): id is string => id !== null && id !== undefined)
    ),
  ];

  // 3. Fetch les clients en une seule requête (max 5000 ids → in operator)
  let customerMap = new Map<string, CustomerInfo>();
  if (customerIds.length > 0) {
    const { data: customers, error: customersError } = await supabase
      .from('individual_customers')
      .select('id, first_name, last_name, email')
      .in('id', customerIds)
      .limit(5000);

    if (customersError) {
      console.error('[exportOrdersCSV] Fetch customers error:', customersError);
      // Ne pas bloquer l'export si les clients ne sont pas trouvés
    } else {
      customerMap = new Map(
        (customers ?? []).map(c => [c.id, c as CustomerInfo])
      );
    }
  }

  // 4. Construire les lignes CSV
  const rows: OrderExportRow[] = orders.map(o => {
    const customer = o.individual_customer_id
      ? customerMap.get(o.individual_customer_id)
      : undefined;

    const firstName = customer?.first_name ?? '';
    const lastName = customer?.last_name ?? '';
    const customerName = `${firstName} ${lastName}`.trim() || '—';
    const status = o.status as string;

    return {
      order_number: o.order_number ?? o.id.slice(0, 8),
      created_at: o.created_at
        ? new Date(o.created_at).toLocaleDateString('fr-FR')
        : '—',
      status: STATUS_LABELS[status] ?? status,
      customer_name: customerName,
      customer_email: customer?.email ?? '—',
      total_ht: Number(o.total_ht) || 0,
      total_ttc: Number(o.total_ttc) || 0,
    };
  });

  const csv = arrayToCSV(rows, [
    { key: 'order_number', label: 'N° commande' },
    { key: 'created_at', label: 'Date' },
    { key: 'status', label: 'Statut' },
    { key: 'customer_name', label: 'Client' },
    { key: 'customer_email', label: 'Email' },
    { key: 'total_ht', label: 'Total HT (€)' },
    { key: 'total_ttc', label: 'Total TTC (€)' },
  ]);

  const today = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `commandes-site-internet-${today}.csv`);
}
