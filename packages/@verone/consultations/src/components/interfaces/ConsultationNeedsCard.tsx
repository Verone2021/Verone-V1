'use client';

import { useState } from 'react';

import { Input } from '@verone/ui';
import { Check, ListChecks, Plus, Trash2 } from 'lucide-react';

import type {
  ConsultationNeed,
  CreateConsultationNeedData,
} from '../../hooks/use-consultation-needs';
import type { LineEconomics } from '../../lib/consultation-economics';
import { isCandidateLine } from '../../lib/consultation-line-status';

// ── Types ──────────────────────────────────────────────────────────

/** Ligne de consultation, réduite à ce que la comparaison d'options exige. */
export interface NeedLineSummary {
  id: string;
  need_id?: string | null;
  status: string;
  productName: string;
  quantity: number;
}

interface ConsultationNeedsCardProps {
  needs: ConsultationNeed[];
  lines: NeedLineSummary[];
  economicsByItemId: Map<string, LineEconomics>;
  onAdd: (data: CreateConsultationNeedData) => Promise<boolean>;
  onRemove: (needId: string) => Promise<boolean>;
}

// ── Component ──────────────────────────────────────────────────────

/**
 * Besoins exprimés par le client et options proposées pour chacun.
 *
 * Une option (statut « Option ») ne compte ni dans le chiffre d'affaires ni
 * dans la marge tant qu'elle n'est pas retenue — voir `consultation-line-status`.
 */
export function ConsultationNeedsCard({
  needs,
  lines,
  economicsByItemId,
  onAdd,
  onRemove,
}: ConsultationNeedsCardProps) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [targetPrice, setTargetPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setLabel('');
    setQuantity('1');
    setTargetPrice('');
  };

  const submit = (): void => {
    const trimmed = label.trim();
    if (trimmed === '') return;
    const parsedQuantity = Number(quantity);
    const parsedTarget = Number(targetPrice);

    setSaving(true);
    void onAdd({
      label: trimmed,
      quantity:
        Number.isFinite(parsedQuantity) && parsedQuantity > 0
          ? Math.trunc(parsedQuantity)
          : 1,
      target_unit_price_ht:
        targetPrice.trim() !== '' &&
        Number.isFinite(parsedTarget) &&
        parsedTarget >= 0
          ? parsedTarget
          : null,
    })
      .then(success => {
        if (success) {
          resetForm();
          setAdding(false);
        }
      })
      .catch(err => {
        console.error('[ConsultationNeedsCard] add failed:', err);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const unassigned = lines.filter(line => !line.need_id);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-zinc-100">
      <div className="px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <ListChecks className="h-3.5 w-3.5 text-zinc-500" />
          <h3 className="text-xs font-bold text-zinc-700">Besoins du client</h3>
          <span className="text-[10px] text-zinc-400">
            plusieurs produits sur un même besoin = options comparées
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAdding(value => !value)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 rounded h-7"
        >
          <Plus className="h-3.5 w-3.5" />
          Besoin
        </button>
      </div>

      {adding && (
        <div className="px-4 py-2.5 flex flex-wrap items-center gap-1.5 border-b border-zinc-100 bg-blue-50/30">
          <Input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Ex : suspensions au-dessus du bar"
            className="flex-1 min-w-[180px] h-8 text-[12px]"
          />
          <Input
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            title="Quantité souhaitée"
            className="w-16 h-8 text-[12px]"
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            value={targetPrice}
            onChange={e => setTargetPrice(e.target.value)}
            placeholder="Budget /u"
            title="Budget unitaire visé (€ HT)"
            className="w-24 h-8 text-[12px]"
          />
          <button
            type="button"
            disabled={saving || label.trim() === ''}
            onClick={submit}
            className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
            aria-label="Enregistrer le besoin"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      )}

      {needs.length === 0 && !adding ? (
        <p className="px-4 py-3 text-[11px] text-zinc-400">
          Aucun besoin listé. Utile quand le client demande plusieurs choses
          distinctes et qu&apos;on veut comparer plusieurs produits pour
          chacune.
        </p>
      ) : (
        <div className="divide-y divide-zinc-50">
          {needs.map(need => {
            const needLines = lines.filter(line => line.need_id === need.id);
            const options = needLines.filter(line =>
              isCandidateLine(line.status)
            );
            const retained = needLines.filter(
              line => !isCandidateLine(line.status)
            );

            return (
              <div key={need.id} className="px-4 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-zinc-900">
                      {need.label}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {need.quantity} souhaité
                      {need.quantity > 1 ? 's' : ''}
                      {need.target_unit_price_ht != null &&
                        ` · budget ${need.target_unit_price_ht.toFixed(2)}€ /u`}
                      {` · ${needLines.length} produit${needLines.length > 1 ? 's' : ''} rattaché${needLines.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void onRemove(need.id).catch(err => {
                        console.error(
                          '[ConsultationNeedsCard] remove failed:',
                          err
                        );
                      });
                    }}
                    className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                    aria-label={`Supprimer le besoin ${need.label}`}
                    title="Supprimer ce besoin — les produits rattachés restent dans la consultation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {needLines.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {[...retained, ...options].map(line => {
                      const econ = economicsByItemId.get(line.id);
                      const isOption = isCandidateLine(line.status);
                      const overBudget =
                        need.target_unit_price_ht != null &&
                        econ?.unitPrice != null &&
                        econ.unitPrice > need.target_unit_price_ht;

                      return (
                        <li
                          key={line.id}
                          className="flex items-center justify-between gap-2 text-[11px]"
                        >
                          <span className="truncate text-zinc-600">
                            {isOption && (
                              <span className="mr-1 rounded bg-violet-100 px-1 py-0.5 text-[9px] font-bold uppercase text-violet-700">
                                Option
                              </span>
                            )}
                            {line.productName}
                            <span className="text-zinc-400">
                              {' '}
                              ×{line.quantity}
                            </span>
                          </span>
                          <span
                            className={`flex-shrink-0 font-medium ${overBudget ? 'text-red-600' : 'text-zinc-700'}`}
                            title={
                              overBudget
                                ? 'Au-dessus du budget visé pour ce besoin'
                                : undefined
                            }
                          >
                            {econ?.unitPrice != null
                              ? `${econ.unitPrice.toFixed(2)}€ /u`
                              : 'Prix à fixer'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}

          {needs.length > 0 && unassigned.length > 0 && (
            <p className="px-4 py-2 text-[10px] text-zinc-400">
              {unassigned.length} ligne{unassigned.length > 1 ? 's' : ''} sans
              besoin rattaché.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
