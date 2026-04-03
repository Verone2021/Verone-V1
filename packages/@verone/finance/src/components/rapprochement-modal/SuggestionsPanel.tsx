'use client';

import { Badge } from '@verone/ui';
import { ArrowRight, Package, Sparkles } from 'lucide-react';

import type { SalesOrder } from './types';
import { formatAmount } from './utils';

interface Props {
  suggestions: SalesOrder[];
  selectedOrderId: string | null;
  onQuickLink: (orderId: string) => void;
}

export function SuggestionsPanel({
  suggestions,
  selectedOrderId,
  onQuickLink,
}: Props) {
  if (suggestions.length === 0 || selectedOrderId) return null;

  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-800">
          Suggestions de rapprochement
        </span>
      </div>
      <div className="space-y-2">
        {suggestions.map(order => (
          <button
            key={order.id}
            onClick={() => void Promise.resolve(onQuickLink(order.id))}
            className="w-full flex items-center justify-between p-2 bg-white rounded border border-amber-200 hover:border-amber-400 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-500" />
              <div>
                <span className="font-medium text-sm">
                  #{order.order_number}
                </span>
                {order.customer_name && (
                  <span className="text-xs text-slate-500 ml-2">
                    {order.customer_name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {formatAmount(order.total_ttc)}
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${
                  (order.matchScore ?? 0) >= 60
                    ? 'border-green-500 text-green-700'
                    : 'border-amber-500 text-amber-700'
                }`}
              >
                {order.matchScore}%
              </Badge>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          </button>
        ))}
      </div>
      {suggestions[0]?.matchReasons && (
        <p className="text-xs text-amber-600 mt-2">
          Critères: {suggestions[0].matchReasons.join(', ')}
        </p>
      )}
    </div>
  );
}
