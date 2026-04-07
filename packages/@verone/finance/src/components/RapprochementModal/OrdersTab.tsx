'use client';

import { Badge, Button, Input, ScrollArea } from '@verone/ui';
import {
  Search,
  Package,
  Check,
  RefreshCw,
  Plus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import { formatAmount, formatDate } from './utils';
import type { SalesOrder } from './types';

interface OrdersTabProps {
  filteredOrders: SalesOrder[];
  suggestions: SalesOrder[];
  isLoading: boolean;
  selectedOrderId: string | null;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSelectOrder: (orderId: string, remaining: number) => void;
  onQuickLink: (orderId: string) => Promise<void>;
  remainingAmount: number;
  allocatedAmount: string;
  onAllocatedAmountChange: (v: string) => void;
  isLinking: boolean;
  onLink: () => void;
}

export function OrdersTab({
  filteredOrders,
  suggestions,
  isLoading,
  selectedOrderId,
  searchQuery,
  onSearchChange,
  onSelectOrder,
  onQuickLink,
  remainingAmount,
  allocatedAmount,
  onAllocatedAmountChange,
  isLinking,
  onLink,
}: OrdersTabProps) {
  return (
    <>
      {/* Recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Rechercher par numéro de commande..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Suggestions automatiques */}
      {suggestions.length > 0 && !selectedOrderId && (
        <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
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
                onClick={() => void onQuickLink(order.id)}
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
      )}

      <ScrollArea className="h-[220px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order.id, order.remaining)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-colors
                  ${selectedOrderId === order.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
                  ${(order.matchScore ?? 0) >= 40 ? 'border-l-4 border-l-amber-400' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedOrderId === order.id ? (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Check className="h-4 w-4 text-blue-600" />
                      </div>
                    ) : (order.matchScore ?? 0) >= 40 ? (
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-amber-600" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        #{order.order_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.customer_name ?? 'Client'} -{' '}
                        {formatDate(order.created_at)}
                      </p>
                      {order.matchReasons && order.matchReasons.length > 0 && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          {order.matchReasons.join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <span className="font-semibold text-sm">
                        {formatAmount(order.total_ttc)}
                      </span>
                      {order.amount_paid > 0 && (
                        <p className="text-xs text-slate-500">
                          Payé: {formatAmount(order.amount_paid)} — Reste:{' '}
                          {formatAmount(order.remaining)}
                        </p>
                      )}
                      {(order.matchScore ?? 0) > 0 && (
                        <Badge
                          variant="outline"
                          className={`ml-2 text-xs ${
                            (order.matchScore ?? 0) >= 60
                              ? 'border-green-500 text-green-700'
                              : (order.matchScore ?? 0) >= 40
                                ? 'border-amber-500 text-amber-700'
                                : 'border-slate-300 text-slate-500'
                          }`}
                        >
                          {order.matchScore}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {selectedOrderId && (
        <div className="pt-4 border-t mt-4 space-y-3">
          <div>
            <label className="text-sm text-slate-600">
              Montant à allouer (€)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder={String(remainingAmount.toFixed(2))}
              value={allocatedAmount}
              onChange={e => onAllocatedAmountChange(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button className="w-full" onClick={onLink} disabled={isLinking}>
            {isLinking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Liaison...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter cette commande
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
