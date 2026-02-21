'use client';

import { ButtonV2 } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { ShoppingCart, Package } from 'lucide-react';

interface SummaryItem {
  name: string;
  quantity: number;
  totalHt: number;
}

interface OrderSummaryPanelProps {
  items: SummaryItem[];
  subtotalHt: number;
  totalCharges: number;
  totalTva: number;
  totalTtc: number;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  submitDisabled: boolean;
  loading: boolean;
  /** Optional extra content (e.g. LinkMe commission details) */
  extraContent?: React.ReactNode;
}

export function OrderSummaryPanel({
  items,
  subtotalHt,
  totalCharges,
  totalTva,
  totalTtc,
  onSubmit,
  onCancel,
  submitLabel,
  submitDisabled,
  loading,
  extraContent,
}: OrderSummaryPanelProps) {
  return (
    <div className="sticky top-6 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-800">
              Résumé de la commande
            </h3>
          </div>
        </div>

        {/* Items list */}
        <div className="px-5 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <Package className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">Aucun article</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-gray-700 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      Qté: {item.quantity}
                    </p>
                  </div>
                  <span className="text-gray-700 font-medium whitespace-nowrap">
                    {formatCurrency(item.totalHt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total HT</span>
              <span className="text-gray-700">
                {formatCurrency(subtotalHt)}
              </span>
            </div>
            {totalCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frais</span>
                <span className="text-gray-700">
                  {formatCurrency(totalCharges)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">TVA</span>
              <span className="text-gray-700">{formatCurrency(totalTva)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-base font-semibold text-gray-900">
                  Total TTC
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(totalTtc)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Extra content (e.g. LinkMe commissions) */}
        {extraContent && (
          <div className="px-5 py-3 border-t border-gray-100">
            {extraContent}
          </div>
        )}

        {/* Action buttons */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-2">
          <ButtonV2
            type="button"
            className="w-full"
            onClick={onSubmit}
            disabled={submitDisabled || loading}
          >
            {loading ? 'En cours...' : submitLabel}
          </ButtonV2>
          <ButtonV2
            type="button"
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </ButtonV2>
        </div>
      </div>
    </div>
  );
}
