'use client';

import { ArrowLeft, Calendar, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge, Button } from '@verone/ui';

import { getOrderChannel } from './types';
import type { OrderWithDetails } from './types';

interface OrderHeaderProps {
  order: OrderWithDetails;
  locked: boolean;
  editOrderDateOpen: boolean;
  setEditOrderDateOpen: (open: boolean) => void;
  setEditOrderDateValue: (value: string) => void;
}

function getStatusBadge(status: string) {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    draft: 'secondary',
    validated: 'default',
    cancelled: 'destructive',
  };
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    validated: 'Validée',
    cancelled: 'Annulée',
    shipped: 'Expédiée',
    delivered: 'Livrée',
  };
  return (
    <Badge variant={variants[status] ?? 'outline'}>
      {labels[status] ?? status}
    </Badge>
  );
}

export function OrderHeader({
  order,
  locked,
  setEditOrderDateOpen,
  setEditOrderDateValue,
}: OrderHeaderProps) {
  const router = useRouter();
  const channel = getOrderChannel(
    order.created_by_affiliate_id,
    order.linkme_selection_id
  );

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => router.push('/canaux-vente/linkme/commandes')}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900">
            {order.order_number}
          </h1>
          {order.linkme_display_number && (
            <span className="text-sm font-normal text-gray-500">
              ({order.linkme_display_number})
            </span>
          )}
          {getStatusBadge(order.status)}
          {locked && (
            <span className="flex items-center gap-1.5 text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded-md">
              <Lock className="h-3 w-3" />
              Informations verrouillées
            </span>
          )}
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${channel.bg} ${channel.color}`}
          >
            {channel.label}
          </span>
          {!locked ? (
            <button
              type="button"
              className="text-gray-600 text-xs hover:text-blue-600 hover:underline flex items-center gap-1"
              onClick={() => {
                setEditOrderDateValue(order.order_date ?? '');
                setEditOrderDateOpen(true);
              }}
              title="Modifier la date de commande"
            >
              <Calendar className="h-3 w-3" />
              {order.order_date
                ? new Date(order.order_date + 'T00:00:00').toLocaleDateString(
                    'fr-FR',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }
                  )
                : 'Date non renseignee'}
            </button>
          ) : (
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {order.order_date
                ? new Date(order.order_date + 'T00:00:00').toLocaleDateString(
                    'fr-FR',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }
                  )
                : 'Date non renseignee'}
            </span>
          )}
          {order.createdByProfile && (
            <span className="text-xs text-blue-600">
              par{' '}
              {[
                order.createdByProfile.first_name,
                order.createdByProfile.last_name,
              ]
                .filter(Boolean)
                .join(' ') || 'Inconnu'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
