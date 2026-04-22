'use client';

/**
 * StockKpiStrip — 4 tuiles KPI horizontales pour l'onglet Stock.
 * Sprint : BO-UI-PROD-STOCK-001
 */

import { useState, useCallback } from 'react';

import { Pencil, Check, X } from 'lucide-react';

import { cn } from '@verone/utils';

import type { Product, ProductRow } from '../types';

interface StockKpiStripProps {
  product: Product;
  reservationsTotal: number;
  lastMovementDate: string | null;
  lastMovementQty: number | null;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function StockKpiStrip({
  product,
  reservationsTotal,
  lastMovementDate,
  lastMovementQty,
  onProductUpdate,
}: StockKpiStripProps) {
  const stockReal = product.stock_real ?? 0;
  const stockForecastedOut = product.stock_forecasted_out ?? 0;
  const stockAvailable = stockReal - stockForecastedOut - reservationsTotal;
  const minStock = product.min_stock ?? 0;
  const reorderPoint = product.reorder_point ?? 0;
  const costNetAvg = product.cost_net_avg ?? 0;
  const valuation = stockReal * costNetAvg;
  const isBelowMin = stockAvailable < minStock;

  // Edition inline seuils
  const [editingSeuils, setEditingSeuils] = useState(false);
  const [draftMin, setDraftMin] = useState(minStock);
  const [draftReorder, setDraftReorder] = useState(reorderPoint);
  const [saving, setSaving] = useState(false);

  const handleStartEdit = useCallback(() => {
    setDraftMin(product.min_stock ?? 0);
    setDraftReorder(product.reorder_point ?? 0);
    setEditingSeuils(true);
  }, [product.min_stock, product.reorder_point]);

  const handleCancelEdit = useCallback(() => {
    setEditingSeuils(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onProductUpdate({
        min_stock: draftMin,
        reorder_point: draftReorder,
      });
      setEditingSeuils(false);
    } catch (err) {
      console.error('[StockKpiStrip] save seuils failed:', err);
    } finally {
      setSaving(false);
    }
  }, [draftMin, draftReorder, onProductUpdate]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Tuile 1 — Stock disponible (hero indigo) */}
      <div className="bg-white rounded-lg border-2 border-indigo-500 bg-indigo-50/30 p-4">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 mb-1">
          Stock disponible
        </p>
        <p className="text-3xl font-bold tabular-nums text-indigo-700">
          {stockAvailable}
        </p>
        <p className="text-[11px] text-neutral-500 mt-1">
          = réel&nbsp;
          <span className="tabular-nums font-medium text-neutral-700">
            {stockReal}
          </span>
          &nbsp;− réservé&nbsp;
          <span className="tabular-nums font-medium text-neutral-700">
            {reservationsTotal}
          </span>
          &nbsp;− prévues&nbsp;
          <span className="tabular-nums font-medium text-neutral-700">
            {stockForecastedOut}
          </span>
        </p>
        <div className="mt-2">
          {isBelowMin ? (
            <span className="rounded px-1.5 py-0.5 text-[10px] border bg-red-50 text-red-700 border-red-200 font-medium">
              SOUS MIN
            </span>
          ) : (
            <span className="rounded px-1.5 py-0.5 text-[10px] border bg-green-50 text-green-700 border-green-200 font-medium">
              OK
            </span>
          )}
        </div>
      </div>

      {/* Tuile 2 — Stock réel physique */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 mb-1">
          Stock réel physique
        </p>
        <p className="text-2xl font-semibold tabular-nums text-neutral-900">
          {stockReal}
        </p>
        {lastMovementDate ? (
          <p className="text-[11px] text-neutral-500 mt-1">
            dernier mouvement&nbsp;·&nbsp;
            {lastMovementQty != null && lastMovementQty > 0 ? '+' : ''}
            <span className="tabular-nums font-medium text-neutral-700">
              {lastMovementQty}
            </span>
            &nbsp;le&nbsp;{formatDate(lastMovementDate)}
          </p>
        ) : (
          <p className="text-[11px] text-neutral-400 mt-1">
            Aucun mouvement enregistré
          </p>
        )}
      </div>

      {/* Tuile 3 — Seuils d'alerte (éditable inline) */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 group relative">
        <div className="flex items-start justify-between">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 mb-1">
            Seuils d&apos;alerte
          </p>
          {!editingSeuils && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
              aria-label="Modifier les seuils"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {editingSeuils ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-neutral-500 w-10 shrink-0">
                Min
              </label>
              <input
                type="number"
                min={0}
                value={draftMin}
                onChange={e => setDraftMin(Number(e.target.value))}
                className="w-full border border-neutral-300 rounded px-1.5 py-0.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-neutral-500 w-10 shrink-0">
                Réap.
              </label>
              <input
                type="number"
                min={0}
                value={draftReorder}
                onChange={e => setDraftReorder(Number(e.target.value))}
                className="w-full border border-neutral-300 rounded px-1.5 py-0.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  void handleSave().catch(console.error);
                }}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-2 md:px-2 md:py-0.5 rounded text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 min-h-[44px] md:min-h-0"
              >
                <Check className="h-3 w-3" />
                {saving ? '…' : 'OK'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-3 py-2 md:px-2 md:py-0.5 rounded text-[11px] border border-neutral-300 text-neutral-600 hover:bg-neutral-50 min-h-[44px] md:min-h-0"
              >
                <X className="h-3 w-3" />
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-2xl font-semibold tabular-nums text-neutral-900">
              {minStock}&nbsp;
              <span className="text-neutral-400">/</span>
              &nbsp;{reorderPoint}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              seuil min&nbsp;·&nbsp;point de réappro
            </p>
          </>
        )}
      </div>

      {/* Tuile 4 — Valorisation */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 mb-1">
          Valorisation stock
        </p>
        <p
          className={cn(
            'text-2xl font-semibold tabular-nums',
            valuation > 0 ? 'text-neutral-900' : 'text-neutral-400'
          )}
        >
          {formatEur(valuation)}
        </p>
        {costNetAvg > 0 ? (
          <p className="text-[11px] text-neutral-500 mt-1">
            <span className="tabular-nums font-medium text-neutral-700">
              {stockReal}
            </span>
            &nbsp;u&nbsp;×&nbsp;
            <span className="tabular-nums font-medium text-neutral-700">
              {formatEur(costNetAvg)}
            </span>
            &nbsp;(prix revient moyen)
          </p>
        ) : (
          <p className="text-[11px] text-neutral-400 mt-1">
            Prix revient non renseigné
          </p>
        )}
      </div>
    </div>
  );
}
