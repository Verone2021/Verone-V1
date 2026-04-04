'use client';

import { useRouter } from 'next/navigation';

import type { LinkedSalesOrder } from '@verone/consultations';
import { Badge } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { ShoppingCart, ExternalLink } from 'lucide-react';

const soStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-amber-100 text-amber-700',
  validated: 'bg-blue-100 text-blue-700',
  partially_shipped: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const soStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  pending_approval: 'En attente',
  validated: 'Validee',
  partially_shipped: 'Part. expediee',
  shipped: 'Expediee',
  cancelled: 'Annulee',
};

interface ConsultationLinkedOrdersProps {
  linkedSalesOrders: LinkedSalesOrder[];
  salesOrdersLoading: boolean;
}

export function ConsultationLinkedOrders({
  linkedSalesOrders,
  salesOrdersLoading,
}: ConsultationLinkedOrdersProps) {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold">Commandes</span>
          <span className="text-xs text-gray-400">
            ({linkedSalesOrders.length})
          </span>
        </div>

        {salesOrdersLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
          </div>
        ) : linkedSalesOrders.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucune commande liee a cette consultation
          </p>
        ) : (
          <div className="space-y-2">
            {linkedSalesOrders.map(order => (
              <div
                key={order.id}
                className="flex items-center justify-between p-2 rounded border border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{order.order_number}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')} —{' '}
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(order.total_ht)}{' '}
                      HT
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      soStatusColors[order.status] ??
                      'bg-gray-100 text-gray-700'
                    }
                  >
                    {soStatusLabels[order.status] ?? order.status}
                  </Badge>
                  <ButtonUnified
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/commandes/clients`)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </ButtonUnified>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
