'use client';

/**
 * StockMovementsCard — mouvements de stock récents (col-span-8).
 * Sprint : BO-UI-PROD-STOCK-001
 */

import { useState, useCallback } from 'react';

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Sliders,
  ArrowLeftRight,
  ExternalLink,
} from 'lucide-react';

import { ProductStockHistoryModal } from '@verone/products';
import { useStockMovements, type StockReasonCode } from '@verone/stock';
import type { MovementType } from '@verone/stock';

interface Movement {
  id: string;
  movement_type: MovementType | string;
  quantity_change: number;
  quantity_after: number;
  reason_code?: StockReasonCode | string;
  reference_type?: string;
  reference_id?: string;
  unit_cost?: number;
  performed_by: string;
  performed_at: string;
}

interface MovementsStats {
  in: number;
  out: number;
  adjust: number;
  transfer: number;
}

interface StockMovementsCardProps {
  productId: string;
  productName: string;
  productSku: string | null;
  movements: Movement[];
  stats: MovementsStats;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

function MovementIcon({ type }: { type: string }) {
  switch (type) {
    case 'IN':
      return <ArrowDownToLine className="h-3.5 w-3.5 text-green-600" />;
    case 'OUT':
      return <ArrowUpFromLine className="h-3.5 w-3.5 text-red-600" />;
    case 'ADJUST':
      return <Sliders className="h-3.5 w-3.5 text-neutral-600" />;
    case 'TRANSFER':
      return <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />;
    default:
      return <Sliders className="h-3.5 w-3.5 text-neutral-400" />;
  }
}

function movementQtyColor(type: string): string {
  switch (type) {
    case 'IN':
      return 'text-green-600';
    case 'OUT':
      return 'text-red-600';
    case 'ADJUST':
      return 'text-neutral-600';
    case 'TRANSFER':
      return 'text-blue-600';
    default:
      return 'text-neutral-500';
  }
}

function formatRef(refType?: string, refId?: string): string {
  if (!refType || !refId) return '—';
  const prefixMap: Record<string, string> = {
    purchase_order: 'PO',
    sales_order: 'SO',
    manual: 'MAN',
    transfer: 'TR',
  };
  const prefix = prefixMap[refType] ?? refType.toUpperCase();
  return `${prefix}-${refId.slice(0, 8)}`;
}

export function StockMovementsCard({
  productId,
  productName,
  productSku,
  movements,
  stats,
}: StockMovementsCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { getReasonDescription } = useStockMovements();

  const handleOpenHistory = useCallback(() => {
    setShowHistory(true);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  return (
    <>
      <div className="bg-white rounded-lg border border-neutral-200 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-neutral-900">
              Mouvements de stock récents
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {stats.in > 0 && (
                <span className="rounded px-1.5 py-0.5 text-[10px] border bg-green-50 text-green-700 border-green-200">
                  {stats.in} entrée{stats.in > 1 ? 's' : ''}
                </span>
              )}
              {stats.out > 0 && (
                <span className="rounded px-1.5 py-0.5 text-[10px] border bg-red-50 text-red-700 border-red-200">
                  {stats.out} sortie{stats.out > 1 ? 's' : ''}
                </span>
              )}
              {stats.adjust > 0 && (
                <span className="rounded px-1.5 py-0.5 text-[10px] border bg-neutral-100 text-neutral-600 border-neutral-200">
                  {stats.adjust} ajust.
                </span>
              )}
              {stats.transfer > 0 && (
                <span className="rounded px-1.5 py-0.5 text-[10px] border bg-blue-50 text-blue-700 border-blue-200">
                  {stats.transfer} transfert{stats.transfer > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenHistory}
            className="flex items-center gap-1 text-xs border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 px-3 py-1.5 rounded-md whitespace-nowrap shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Voir tout →
          </button>
        </div>

        {/* Table */}
        {movements.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-10 text-sm text-neutral-400">
            Aucun mouvement enregistré
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-neutral-500 border-b border-neutral-100">
                  <th className="pl-4 pr-2 py-2 text-left font-medium">Date</th>
                  <th className="px-2 py-2 text-left font-medium">Type</th>
                  <th className="px-2 py-2 text-right font-medium">Qté</th>
                  <th className="px-2 py-2 text-right font-medium hidden sm:table-cell">
                    Stock après
                  </th>
                  <th className="px-2 py-2 text-left font-medium hidden md:table-cell">
                    Motif
                  </th>
                  <th className="px-2 py-2 text-left font-medium hidden lg:table-cell">
                    Référence
                  </th>
                  <th className="px-2 py-2 text-right font-medium hidden xl:table-cell">
                    Coût unit.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {movements.map(m => (
                  <tr
                    key={m.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="pl-4 pr-2 py-2.5 text-neutral-600 whitespace-nowrap text-xs">
                      {formatDate(m.performed_at)}
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-1">
                        <MovementIcon type={m.movement_type} />
                        <span className="text-[10px] uppercase tracking-wide font-medium text-neutral-500 hidden sm:inline">
                          {m.movement_type}
                        </span>
                      </span>
                    </td>
                    <td
                      className={`px-2 py-2.5 text-right tabular-nums font-medium text-sm ${movementQtyColor(m.movement_type)}`}
                    >
                      {m.quantity_change > 0 ? '+' : ''}
                      {m.quantity_change}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-neutral-700 text-sm hidden sm:table-cell">
                      {m.quantity_after}
                    </td>
                    <td className="px-2 py-2.5 text-neutral-600 text-xs hidden md:table-cell">
                      {m.reason_code
                        ? getReasonDescription(m.reason_code as StockReasonCode)
                        : '—'}
                    </td>
                    <td className="px-2 py-2.5 text-neutral-500 text-xs font-mono hidden lg:table-cell">
                      {formatRef(m.reference_type, m.reference_id)}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-neutral-600 text-xs hidden xl:table-cell">
                      {m.unit_cost != null
                        ? new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(m.unit_cost)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-neutral-100">
          <p className="text-[10px] italic text-neutral-400">
            Les 24 motifs (reason_code) sont organisés par catégorie : ventes,
            pertes/dégradations, usage commercial, R&D, retours SAV, corrections
            inventaire, réceptions PO.
          </p>
        </div>
      </div>

      {/* Modal historique complet */}
      <ProductStockHistoryModal
        product={{
          id: productId,
          name: productName,
          sku: productSku ?? '',
        }}
        isOpen={showHistory}
        onClose={handleCloseHistory}
      />
    </>
  );
}
