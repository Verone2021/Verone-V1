'use client';

import { Badge, Button, Input, ScrollArea } from '@verone/ui';
import {
  Search,
  Building2,
  Check,
  RefreshCw,
  Plus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import { formatAmount, formatDate } from './utils';
import type { PurchaseOrder } from './types';

interface PurchaseOrdersTabProps {
  filteredPurchaseOrders: PurchaseOrder[];
  purchaseOrderSuggestions: PurchaseOrder[];
  isLoading: boolean;
  selectedPurchaseOrderId: string | null;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSelectPurchaseOrder: (poId: string, totalTtc: number) => void;
  onQuickLinkPurchaseOrder: (poId: string) => Promise<void>;
  remainingAmount: number;
  allocatedAmount: string;
  onAllocatedAmountChange: (v: string) => void;
  isLinking: boolean;
  onLink: () => void;
}

export function PurchaseOrdersTab({
  filteredPurchaseOrders,
  purchaseOrderSuggestions,
  isLoading,
  selectedPurchaseOrderId,
  searchQuery,
  onSearchChange,
  onSelectPurchaseOrder,
  onQuickLinkPurchaseOrder,
  remainingAmount,
  allocatedAmount,
  onAllocatedAmountChange,
  isLinking,
  onLink,
}: PurchaseOrdersTabProps) {
  return (
    <>
      {/* Recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Rechercher par numéro, fournisseur..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Suggestions pour commandes fournisseurs */}
      {purchaseOrderSuggestions.length > 0 && !selectedPurchaseOrderId && (
        <div className="p-3 mb-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              Suggestions
            </span>
          </div>
          <div className="space-y-2">
            {purchaseOrderSuggestions.map(po => (
              <button
                key={po.id}
                onClick={() => void onQuickLinkPurchaseOrder(po.id)}
                className="w-full flex items-center justify-between p-2 bg-white rounded border border-orange-200 hover:border-orange-400 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="font-medium text-sm">#{po.po_number}</span>
                    {po.supplier_name && (
                      <span className="text-xs text-slate-500 ml-2">
                        {po.supplier_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatAmount(po.total_ttc)}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${(po.matchScore ?? 0) >= 60 ? 'border-green-500 text-green-700' : 'border-orange-500 text-orange-700'}`}
                  >
                    {po.matchScore}%
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="h-[180px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filteredPurchaseOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Aucune commande fournisseur trouvée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPurchaseOrders.map(po => (
              <div
                key={po.id}
                onClick={() => onSelectPurchaseOrder(po.id, po.total_ttc)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-colors
                  ${selectedPurchaseOrderId === po.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
                  ${(po.matchScore ?? 0) >= 40 ? 'border-l-4 border-l-orange-400' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedPurchaseOrderId === po.id ? (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Check className="h-4 w-4 text-blue-600" />
                      </div>
                    ) : (po.matchScore ?? 0) >= 40 ? (
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-orange-600" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">#{po.po_number}</p>
                      <p className="text-xs text-slate-500">
                        {po.supplier_name ?? 'Fournisseur'} -{' '}
                        {formatDate(po.created_at)}
                      </p>
                      {po.matchReasons && po.matchReasons.length > 0 && (
                        <p className="text-xs text-orange-600 mt-0.5">
                          {po.matchReasons.join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <span className="font-semibold text-sm">
                        {formatAmount(po.total_ttc)}
                      </span>
                      {(po.matchScore ?? 0) > 0 && (
                        <Badge
                          variant="outline"
                          className={`ml-2 text-xs ${
                            (po.matchScore ?? 0) >= 60
                              ? 'border-green-500 text-green-700'
                              : (po.matchScore ?? 0) >= 40
                                ? 'border-orange-500 text-orange-700'
                                : 'border-slate-300 text-slate-500'
                          }`}
                        >
                          {po.matchScore}%
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

      {selectedPurchaseOrderId && (
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
                Ajouter cette commande fournisseur
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );
}
