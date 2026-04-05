'use client';

import { formatCurrency } from '@verone/utils';
import { Calendar } from 'lucide-react';

import type { OrderForLink } from './types';

interface RapprochementOrderInfoProps {
  order: OrderForLink;
  isDebitSide: boolean;
}

export function RapprochementOrderInfo({
  order,
  isDebitSide,
}: RapprochementOrderInfoProps) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg space-y-1">
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <p className="font-medium text-sm text-slate-900">
            Commande #{order.order_number}
          </p>
          {order.customer_name && (
            <p className="text-xs text-slate-500">{order.customer_name}</p>
          )}
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(order.order_date ?? order.created_at).toLocaleDateString(
              'fr-FR'
            )}
            {order.shipped_at &&
              ` • Expédiée ${new Date(order.shipped_at).toLocaleDateString('fr-FR')}`}
          </p>
        </div>
        <span
          className={`text-base font-bold ${isDebitSide ? 'text-red-600' : 'text-green-600'}`}
        >
          {isDebitSide ? '-' : ''}
          {formatCurrency(Math.abs(order.total_ttc))}
        </span>
      </div>
    </div>
  );
}
