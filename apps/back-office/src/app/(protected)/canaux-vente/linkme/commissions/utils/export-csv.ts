import { statusConfig } from '../constants';
import type { Commission, TabType } from '../types';

export function buildCommissionsCsv(filtered: Commission[]): string {
  const headers = [
    'Date',
    'N° Commande',
    'Organisation',
    'Affilié',
    'Paiement Client',
    'Total HT',
    'Rémunération HT',
    'Rémunération TTC',
    'Statut',
  ];

  const rows = filtered.map(c => {
    const org = c.sales_order?.customer;
    const orgName = org
      ? org.trade_name && org.trade_name !== org.legal_name
        ? `${org.trade_name} (${org.legal_name})`
        : org.legal_name
      : '-';
    return [
      (c.sales_order?.created_at ?? c.created_at)
        ? new Date(
            (c.sales_order?.created_at ?? c.created_at)!
          ).toLocaleDateString('fr-FR')
        : '-',
      c.sales_order?.order_number ?? c.order_number ?? '-',
      orgName,
      c.affiliate?.display_name ?? 'N/A',
      c.sales_order?.payment_status_v2 === 'paid' ? 'Payé' : 'En attente',
      (c.sales_order?.total_ht ?? c.order_amount_ht).toFixed(2),
      (c.total_payout_ht ?? c.affiliate_commission).toFixed(2),
      (c.total_payout_ttc ?? c.affiliate_commission_ttc ?? 0).toFixed(2),
      statusConfig[(c.status ?? 'pending') as keyof typeof statusConfig]
        ?.label ?? c.status,
    ];
  });

  return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
}

export function downloadCsv(
  csv: string,
  activeTab: TabType,
  count: number
): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `commissions-linkme-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  void count; // used by caller for toast message
}
