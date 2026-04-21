'use client';

/**
 * PricingKpiStrip — 3 tuiles KPI pour l'onglet Tarification.
 * Tuile 1 : Prix d'achat HT (subdued)
 * Tuile 2 : Prix de revient (HERO indigo)
 * Tuile 3 : Marge cible (avec édition rapide)
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { useState, useCallback } from 'react';

import { formatPrice } from '@verone/utils';
import { Info, Pencil, Check, X } from 'lucide-react';

interface PricingKpiStripProps {
  /** Prix d'achat fournisseur brut (cost_price) */
  purchasePriceHt: number | null;
  /** Fournisseur principal (affichage) */
  supplierName?: string | null;
  /** Éco-participation (chip si > 0) */
  ecoTax?: number | null;
  /** Prix de revient moyen pondéré (cost_net_avg) */
  landedCost: number | null;
  /** Nombre d'achats utilisés dans le calcul */
  purchasesCount: number;
  /** Prix min vente HT calculé (pour afficher dans sub tuile 3) */
  minSellingPriceHt: number | null;
  /** Prix min vente TTC (calculé par le parent, source unique) */
  minSellingPriceTtc: number | null;
  /** Marge cible en % */
  marginPercent: number;
  /** Callback pour sauvegarder la nouvelle marge */
  onMarginSave?: (newMargin: number) => Promise<void>;
}

export function PricingKpiStrip({
  purchasePriceHt,
  supplierName,
  ecoTax,
  landedCost,
  purchasesCount,
  minSellingPriceHt,
  minSellingPriceTtc,
  marginPercent,
  onMarginSave,
}: PricingKpiStripProps) {
  const [editingMargin, setEditingMargin] = useState(false);
  const [draftMargin, setDraftMargin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = useCallback(() => {
    setDraftMargin(marginPercent.toString());
    setEditingMargin(true);
  }, [marginPercent]);

  const handleSaveMargin = useCallback(async () => {
    const parsed = parseFloat(draftMargin);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 500) return;
    setIsSaving(true);
    try {
      await onMarginSave?.(parsed);
      setEditingMargin(false);
    } catch {
      // toast géré par le parent
    } finally {
      setIsSaving(false);
    }
  }, [draftMargin, onMarginSave]);

  const handleCancelEdit = useCallback(() => {
    setEditingMargin(false);
  }, []);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Tuile 1 — Prix d'achat HT (subdued) */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">
          PRIX D'ACHAT HT
        </div>
        <div className="text-2xl font-semibold tabular-nums text-neutral-700">
          {purchasePriceHt != null ? formatPrice(purchasePriceHt) : '—'}
        </div>
        <div className="text-xs text-neutral-400 mt-1 space-y-0.5">
          {supplierName && <div className="truncate">{supplierName}</div>}
          {ecoTax != null && ecoTax > 0 && (
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-500 bg-neutral-50">
              éco-part. {formatPrice(ecoTax)}
            </span>
          )}
        </div>
      </div>

      {/* Tuile 2 — Prix de revient (HERO indigo) */}
      <div className="bg-indigo-50/30 rounded-lg border-2 border-indigo-500 p-4 relative">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
            PRIX DE REVIENT
          </span>
          <span title="Moyenne pondérée des achats fournisseurs (prix achat + frais logistiques par unité)">
            <Info
              className="h-3 w-3 text-indigo-400 shrink-0"
              aria-label="Information"
            />
          </span>
        </div>
        <div className="text-3xl font-bold tabular-nums text-indigo-700">
          {landedCost != null ? formatPrice(landedCost) : '—'}
        </div>
        <div className="mt-2 space-y-0.5">
          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-100 text-indigo-700">
            base calcul prix min vente
          </span>
          <div className="text-[10px] text-indigo-500 mt-1">
            moyenne pondérée · {purchasesCount} achat
            {purchasesCount !== 1 ? 's' : ''} · frais logistiques inclus
          </div>
        </div>
      </div>

      {/* Tuile 3 — Marge cible */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            MARGE CIBLE
          </span>
          {!editingMargin && onMarginSave && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="h-6 w-6 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-700 rounded"
              title="Modifier la marge cible"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>

        {editingMargin ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              min={0}
              max={500}
              step={1}
              value={draftMargin}
              onChange={e => setDraftMargin(e.target.value)}
              className="w-20 h-8 border border-neutral-300 rounded px-2 text-sm tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <span className="text-sm text-neutral-600">%</span>
            <button
              type="button"
              onClick={() => {
                void handleSaveMargin();
              }}
              disabled={isSaving}
              className="h-8 w-8 inline-flex items-center justify-center bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="h-8 w-8 inline-flex items-center justify-center border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-2xl font-semibold tabular-nums text-neutral-900">
            {marginPercent > 0 ? `${marginPercent.toFixed(0)} %` : '—'}
          </div>
        )}

        <div className="text-xs text-neutral-500 mt-1 space-y-0.5">
          {minSellingPriceHt != null && (
            <div>
              prix min vente{' '}
              <span className="font-medium">
                {formatPrice(minSellingPriceHt)}
              </span>{' '}
              HT
            </div>
          )}
          {minSellingPriceTtc != null && (
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-500">
              TTC {formatPrice(minSellingPriceTtc)}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
