'use client';

import { Badge } from '@verone/ui';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { CustomerOrder } from '../../hooks/use-customer-detail';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-50 text-yellow-700' },
  validated: { label: 'Validee', className: 'bg-blue-50 text-blue-700' },
  paid: { label: 'Payee', className: 'bg-green-50 text-green-700' },
  shipped: { label: 'Expediee', className: 'bg-indigo-50 text-indigo-700' },
  delivered: { label: 'Livree', className: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Annulee', className: 'bg-red-50 text-red-700' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

interface Props {
  orders: CustomerOrder[];
  totalSpent: number;
  orderCount: number;
  isLoading: boolean;
}

export function CustomerOrdersTab({
  orders,
  totalSpent,
  orderCount,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 uppercase">Commandes</p>
          <p className="text-xl font-bold text-gray-900">{orderCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 uppercase">Total depense</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(totalSpent)}
          </p>
        </div>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-6">
          Aucune commande pour le moment.
        </p>
      ) : (
        <div className="space-y-2">
          {orders.map(order => {
            const statusConfig =
              STATUS_LABELS[order.status ?? ''] ?? STATUS_LABELS.pending;
            return (
              <div
                key={order.id}
                className="flex items-center justify-between bg-white border rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.order_number ?? 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.created_at
                      ? format(new Date(order.created_at), 'dd MMM yyyy', {
                          locale: fr,
                        })
                      : '-'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                  <span className="text-sm font-semibold text-gray-900 min-w-[80px] text-right">
                    {formatCurrency(Number(order.total_ttc) || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
