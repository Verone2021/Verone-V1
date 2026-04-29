'use client';

/**
 * StockSettingsCard — paramètres stock inline-éditables (col-span-6).
 *
 * Champs : min_stock (seuil alerte), supplier_moq (MOQ fournisseur),
 * stock_status (readonly), weight (éditable).
 *
 * Le MOQ est la quantité minimum imposée par le fournisseur pour passer
 * commande. La suggestion de réappro est calculée à partir de la formule
 * officielle Verone (vue stock_alerts_unified_view.shortage_quantity)
 * combinée au MOQ : ne plus utiliser reorder_point qui faisait double
 * emploi avec min_stock.
 */

import { useState, useCallback } from 'react';

import { Settings, Pencil, Check, X } from 'lucide-react';
import Link from 'next/link';

import type { Database } from '@verone/types';

import type { Product, ProductRow } from '../types';

type StockStatusEnum = Database['public']['Enums']['stock_status_type'];

const STOCK_STATUS_LABELS: Record<StockStatusEnum, string> = {
  in_stock: 'EN STOCK',
  out_of_stock: 'RUPTURE',
  coming_soon: 'À VENIR',
};

const STOCK_STATUS_CHIP: Record<
  StockStatusEnum,
  { bg: string; text: string; border: string }
> = {
  in_stock: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  out_of_stock: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  coming_soon: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
};

interface InlineNumberFieldProps {
  label: string;
  value: number;
  unit?: string;
  onSave: (v: number) => Promise<void>;
}

function InlineNumberField({
  label,
  value,
  unit,
  onSave,
}: InlineNumberFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleStart = useCallback(() => {
    setDraft(value);
    setEditing(true);
  }, [value]);

  const handleCancel = useCallback(() => {
    setEditing(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      console.error('[StockSettingsCard] inline save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [draft, onSave]);

  return (
    <div className="group">
      <p className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 mb-1">
        {label}
      </p>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            value={draft}
            onChange={e => setDraft(Number(e.target.value))}
            className="w-20 border border-neutral-300 rounded px-1.5 py-0.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
          {unit && <span className="text-xs text-neutral-500">{unit}</span>}
          <button
            type="button"
            onClick={() => {
              void handleSave().catch(console.error);
            }}
            disabled={saving}
            className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <p className="text-lg font-semibold tabular-nums text-neutral-900">
            {value}
          </p>
          {unit && <span className="text-xs text-neutral-500">{unit}</span>}
          <button
            type="button"
            onClick={handleStart}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
            aria-label={`Modifier ${label}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

interface StockSettingsCardProps {
  product: Product;
  productId: string;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
  onOpenMovementModal: () => void;
}

export function StockSettingsCard({
  product,
  productId,
  onProductUpdate,
  onOpenMovementModal,
}: StockSettingsCardProps) {
  const rawStatus = product.stock_status;
  const stockStatus: StockStatusEnum =
    rawStatus != null && rawStatus in STOCK_STATUS_LABELS
      ? rawStatus
      : 'in_stock';
  const chipStyle = STOCK_STATUS_CHIP[stockStatus];

  const handleSaveMinStock = useCallback(
    async (v: number) => {
      await onProductUpdate({ min_stock: v });
    },
    [onProductUpdate]
  );

  const handleSaveSupplierMoq = useCallback(
    async (v: number) => {
      // MOQ minimum = 1 (default DB)
      await onProductUpdate({ supplier_moq: Math.max(v, 1) });
    },
    [onProductUpdate]
  );

  const handleSaveWeight = useCallback(
    async (v: number) => {
      await onProductUpdate({ weight: v });
    },
    [onProductUpdate]
  );

  return (
    <div className="bg-white rounded-lg border border-neutral-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-neutral-100">
        <Settings className="h-4 w-4 text-neutral-500" />
        <h3 className="text-sm font-semibold text-neutral-900">
          Paramètres stock
        </h3>
      </div>

      {/* Grille 2 cols */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {/* Seuil alerte */}
          <InlineNumberField
            label="Seuil alerte"
            value={product.min_stock ?? 0}
            onSave={handleSaveMinStock}
          />

          {/* MOQ fournisseur */}
          <InlineNumberField
            label="MOQ fournisseur"
            value={product.supplier_moq ?? 1}
            onSave={handleSaveSupplierMoq}
          />

          {/* Statut stock — readonly */}
          <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 mb-1">
              Statut stock
            </p>
            <div className="flex flex-col gap-1">
              <span
                className={`inline-flex rounded px-1.5 py-0.5 text-[10px] border font-medium w-fit ${chipStyle.bg} ${chipStyle.text} ${chipStyle.border}`}
              >
                {STOCK_STATUS_LABELS[stockStatus]}
              </span>
              <p className="text-[10px] text-neutral-400 italic">
                Calculé automatiquement
              </p>
            </div>
          </div>

          {/* Poids unitaire */}
          <InlineNumberField
            label="Poids unitaire"
            value={product.weight != null ? Number(product.weight) : 0}
            unit="kg"
            onSave={handleSaveWeight}
          />
        </div>
      </div>

      {/* Footer liens */}
      <div className="px-4 py-3 border-t border-neutral-100">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link
            href="/stocks/inventaire"
            className="text-[10px] text-indigo-600 hover:text-indigo-700 underline"
          >
            Voir inventaire global →
          </Link>
          <Link
            href={`/stocks/mouvements?product_id=${productId}`}
            className="text-[10px] text-indigo-600 hover:text-indigo-700 underline"
          >
            Historique complet →
          </Link>
          <Link
            href="/stocks/alertes"
            className="text-[10px] text-indigo-600 hover:text-indigo-700 underline"
          >
            Règles d&apos;alerte →
          </Link>
          <button
            type="button"
            onClick={onOpenMovementModal}
            className="text-[10px] text-indigo-600 hover:text-indigo-700 underline bg-transparent border-0 p-0 cursor-pointer"
          >
            Créer mouvement manuel →
          </button>
        </div>
      </div>
    </div>
  );
}
