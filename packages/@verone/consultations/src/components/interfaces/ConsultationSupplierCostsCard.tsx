'use client';

import { useState } from 'react';

import { Input } from '@verone/ui';
import { AlertTriangle, Check, Truck } from 'lucide-react';

import type { SupplierEconomics } from '../../lib/consultation-supplier-costs';
import type {
  ConsultationSupplierCost,
  UpsertSupplierCostData,
} from '../../hooks/use-consultation-supplier-costs';

// ── Types ──────────────────────────────────────────────────────────

export interface ConsultationSupplierRef {
  supplierId: string;
  supplierName: string;
  /** Nombre de lignes de la consultation portées par ce fournisseur. */
  lineCount: number;
}

interface ConsultationSupplierCostsCardProps {
  suppliers: ConsultationSupplierRef[];
  supplierCosts: ConsultationSupplierCost[];
  supplierEconomics: SupplierEconomics[];
  unallocatedSupplierFees: number;
  onSave: (data: UpsertSupplierCostData) => Promise<boolean>;
}

// ── Component ──────────────────────────────────────────────────────

/**
 * Frais de port, douane et autres saisis une fois par fournisseur. Ils sont
 * répartis sur les lignes de ce fournisseur au prorata de la valeur de ligne
 * (BO-CONSULT-P9-001) — le prix de revient de chaque ligne les intègre.
 */
export function ConsultationSupplierCostsCard({
  suppliers,
  supplierCosts,
  supplierEconomics,
  unallocatedSupplierFees,
  onSave,
}: ConsultationSupplierCostsCardProps) {
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [shipping, setShipping] = useState('');
  const [customs, setCustoms] = useState('');
  const [other, setOther] = useState('');
  const [saving, setSaving] = useState(false);

  if (suppliers.length === 0) return null;

  const costBySupplier = new Map(
    supplierCosts.map(cost => [cost.supplier_id, cost])
  );
  const econBySupplier = new Map(
    supplierEconomics.map(econ => [econ.supplierId, econ])
  );

  const startEdit = (supplierId: string) => {
    const cost = costBySupplier.get(supplierId);
    setEditingSupplier(supplierId);
    setShipping(cost?.shipping_cost_ht ? String(cost.shipping_cost_ht) : '');
    setCustoms(cost?.customs_cost_ht ? String(cost.customs_cost_ht) : '');
    setOther(cost?.other_cost_ht ? String(cost.other_cost_ht) : '');
  };

  const parseAmount = (value: string): number => {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const save = (supplierId: string): void => {
    setSaving(true);
    void onSave({
      supplier_id: supplierId,
      shipping_cost_ht: parseAmount(shipping),
      customs_cost_ht: parseAmount(customs),
      other_cost_ht: parseAmount(other),
    })
      .then(success => {
        if (success) setEditingSupplier(null);
      })
      .catch(err => {
        console.error('[ConsultationSupplierCostsCard] save failed:', err);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-zinc-100">
      <div className="px-4 py-2.5 flex items-center gap-2 bg-zinc-50/50 border-b border-zinc-100">
        <Truck className="h-3.5 w-3.5 text-zinc-500" />
        <h3 className="text-xs font-bold text-zinc-700">
          Frais par fournisseur
        </h3>
        <span className="text-[10px] text-zinc-400">
          répartis sur les lignes du fournisseur, au prorata de leur valeur
        </span>
      </div>

      {unallocatedSupplierFees > 0 && (
        <div className="px-4 py-2 flex items-start gap-2 bg-amber-50 border-b border-amber-100">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-amber-800">
            {unallocatedSupplierFees.toFixed(2)}€ de frais ne sont imputés à
            aucune ligne : le fournisseur concerné n&apos;a que des lignes
            gratuites, des échantillons ou des lignes refusées. Ces frais ne
            sont comptés ni dans le prix de revient ni dans la marge.
          </p>
        </div>
      )}

      <div className="divide-y divide-zinc-50">
        {suppliers.map(supplier => {
          const cost = costBySupplier.get(supplier.supplierId);
          const econ = econBySupplier.get(supplier.supplierId);
          const total = econ?.supplierCosts ?? 0;
          const isEditing = editingSupplier === supplier.supplierId;

          return (
            <div
              key={supplier.supplierId}
              className="px-4 py-2.5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-zinc-900 truncate">
                  {supplier.supplierName}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {supplier.lineCount} ligne
                  {supplier.lineCount > 1 ? 's' : ''}
                  {total > 0 && ` · ${total.toFixed(2)}€ de frais`}
                  {econ?.costPriceTotal
                    ? ` · revient ${econ.costPriceTotal.toFixed(2)}€`
                    : ''}
                </p>
              </div>

              {isEditing ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shipping}
                    onChange={e => setShipping(e.target.value)}
                    placeholder="Port"
                    title="Transport (€ HT)"
                    className="w-20 h-8 text-[11px] px-1.5 py-0"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customs}
                    onChange={e => setCustoms(e.target.value)}
                    placeholder="Douane"
                    title="Douane (€ HT)"
                    className="w-20 h-8 text-[11px] px-1.5 py-0"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={other}
                    onChange={e => setOther(e.target.value)}
                    placeholder="Autres"
                    title="Autres frais (€ HT)"
                    className="w-20 h-8 text-[11px] px-1.5 py-0"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => save(supplier.supplierId)}
                    className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                    aria-label="Enregistrer les frais"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSupplier(null)}
                    className="h-11 px-3 md:h-8 text-[11px] text-zinc-500 hover:bg-zinc-100 rounded"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-500">
                    {cost
                      ? `Port ${cost.shipping_cost_ht.toFixed(2)}€ · Douane ${cost.customs_cost_ht.toFixed(2)}€ · Autres ${cost.other_cost_ht.toFixed(2)}€`
                      : 'Aucun frais saisi'}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(supplier.supplierId)}
                    className="h-11 px-3 md:h-8 text-[11px] font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 rounded"
                  >
                    {cost ? 'Modifier' : 'Saisir'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
