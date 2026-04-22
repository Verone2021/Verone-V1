'use client';

/**
 * ChannelPricingTable — bloc central du dashboard Général. Affiche tous les
 * canaux de vente dans une table dense avec prix, écart vs min, marge brute,
 * commission canal, marge nette, statut.
 *
 * Réutilise `useChannelPricing` + `useUpdateChannelPrice` du sprint
 * SI-PRICING-001 (@verone/common/hooks).
 */

import { useMemo, useState } from 'react';

import { useChannelPricing, useUpdateChannelPrice } from '@verone/common';
import { Badge, ButtonV2, Input } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import {
  AlertTriangle,
  Check,
  Globe,
  Link2,
  Lock,
  Pencil,
  Store,
  X,
} from 'lucide-react';

interface ChannelPricingTableProps {
  productId: string;
  minimumSellingPrice: number;
  /** Prix de revient (landed cost) pour le calcul de la marge nette */
  landedCost?: number | null;
  onManageAll?: () => void;
}

const READ_ONLY = new Set(['google_merchant', 'meta_commerce']);

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  site_internet: Globe,
  linkme: Link2,
  google_merchant: Store,
  meta_commerce: Store,
};

function calcNetMarginPct(
  priceHt: number,
  commissionRate: number | null,
  landedCost: number
): number | null {
  if (priceHt <= 0) return null;
  const rate = commissionRate ?? 0;
  const netPrice = priceHt * (1 - rate / 100);
  if (netPrice <= 0) return null;
  const netMarginEur = netPrice - landedCost;
  return (netMarginEur / netPrice) * 100;
}

export function ChannelPricingTable({
  productId,
  minimumSellingPrice,
  landedCost,
  onManageAll,
}: ChannelPricingTableProps) {
  const { data: channels, isLoading } = useChannelPricing(productId);
  const update = useUpdateChannelPrice();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState('');

  const rows = useMemo(
    () =>
      (channels ?? []).map(c => {
        const effectivePrice = c.custom_price_ht ?? c.public_price_ht;
        const belowMin =
          effectivePrice != null &&
          minimumSellingPrice > 0 &&
          effectivePrice < minimumSellingPrice;
        // Marge brute (vs min vente)
        const grossMargin =
          effectivePrice != null && minimumSellingPrice > 0
            ? ((effectivePrice - minimumSellingPrice) / minimumSellingPrice) *
              100
            : null;
        // Commission canal
        const commissionRate = c.channel_commission_rate ?? null;
        // Marge nette (après commission, vs landed cost)
        const netMargin =
          effectivePrice != null && landedCost != null && landedCost > 0
            ? calcNetMarginPct(effectivePrice, commissionRate, landedCost)
            : null;
        return {
          ...c,
          effectivePrice,
          belowMin,
          grossMargin,
          commissionRate,
          netMargin,
        };
      }),
    [channels, minimumSellingPrice, landedCost]
  );

  const save = async (channelId: string) => {
    const parsed = draftPrice ? parseFloat(draftPrice) : null;
    if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) return;
    try {
      await update.mutateAsync({
        product_id: productId,
        channel_id: channelId,
        custom_price_ht: parsed,
        discount_rate: null,
        is_active: true,
      });
      setEditingId(null);
    } catch {
      // toast déjà géré par le hook
    }
  };

  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Prix par canal
        </h3>
        {minimumSellingPrice > 0 && (
          <Badge variant="outline" className="text-xs">
            Min vente HT : {formatPrice(minimumSellingPrice)}
          </Badge>
        )}
      </div>

      {isLoading && (
        <div className="text-sm text-neutral-500 py-4">Chargement…</div>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-neutral-500 border-b border-neutral-100">
                <th className="text-left py-2 pl-2 font-medium">Canal</th>
                <th className="text-right py-2 font-medium">Prix HT</th>
                <th className="text-right py-2 font-medium hidden lg:table-cell">
                  Écart min
                </th>
                <th className="text-right py-2 font-medium hidden lg:table-cell">
                  Marge brute %
                </th>
                <th className="text-right py-2 font-medium hidden xl:table-cell">
                  Commission
                </th>
                <th className="text-right py-2 font-medium hidden xl:table-cell">
                  Marge nette %
                </th>
                <th className="text-left py-2 pl-3 font-medium hidden md:table-cell">
                  Statut
                </th>
                <th className="text-right py-2 pr-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const Icon = ICONS[row.channel_code] ?? Globe;
                const readOnly = READ_ONLY.has(row.channel_code);
                const isEditing = editingId === row.channel_id;

                return (
                  <tr
                    key={row.channel_id}
                    className={cn(
                      'border-b border-neutral-50 last:border-0',
                      readOnly && 'text-neutral-400'
                    )}
                  >
                    {/* Canal */}
                    <td className="py-2 pl-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span
                            className={cn(
                              'font-medium',
                              readOnly
                                ? 'text-neutral-400 italic'
                                : 'text-neutral-800'
                            )}
                          >
                            {row.channel_name}
                          </span>
                        </div>
                        {row.commissionRate != null &&
                          row.commissionRate > 0 && (
                            <span className="text-[10px] text-neutral-500 pl-5.5">
                              commission {row.commissionRate.toFixed(0)} %
                            </span>
                          )}
                      </div>
                    </td>

                    {/* Prix HT */}
                    <td className="py-2 text-right tabular-nums">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={draftPrice}
                          onChange={e => setDraftPrice(e.target.value)}
                          className="h-7 w-24 ml-auto text-right"
                        />
                      ) : readOnly ? (
                        <span className="italic text-xs">= site-internet</span>
                      ) : row.effectivePrice != null ? (
                        formatPrice(row.effectivePrice)
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Écart min */}
                    <td className="py-2 text-right tabular-nums text-xs hidden lg:table-cell">
                      {readOnly
                        ? '—'
                        : row.effectivePrice != null && minimumSellingPrice > 0
                          ? formatPrice(
                              row.effectivePrice - minimumSellingPrice
                            )
                          : '—'}
                    </td>

                    {/* Marge brute % */}
                    <td
                      className={cn(
                        'py-2 text-right tabular-nums text-xs hidden lg:table-cell',
                        row.belowMin && 'text-red-600 font-semibold'
                      )}
                    >
                      {readOnly
                        ? '—'
                        : row.grossMargin != null
                          ? `${row.grossMargin >= 0 ? '+' : ''}${row.grossMargin.toFixed(0)} %`
                          : '—'}
                    </td>

                    {/* Commission */}
                    <td className="py-2 text-right tabular-nums text-xs hidden xl:table-cell text-neutral-500">
                      {readOnly ||
                      row.commissionRate == null ||
                      row.commissionRate === 0
                        ? '—'
                        : `−${row.commissionRate.toFixed(0)} %`}
                    </td>

                    {/* Marge nette % */}
                    <td
                      className={cn(
                        'py-2 text-right tabular-nums text-xs hidden xl:table-cell',
                        row.netMargin != null && row.netMargin < 0
                          ? 'text-red-600 font-semibold'
                          : 'text-neutral-700'
                      )}
                    >
                      {readOnly
                        ? '—'
                        : row.netMargin != null
                          ? `${row.netMargin >= 0 ? '+' : ''}${row.netMargin.toFixed(0)} %`
                          : '—'}
                    </td>

                    {/* Statut */}
                    <td className="py-2 pl-3 hidden md:table-cell">
                      {readOnly ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400">
                          <Lock className="h-3 w-3" />
                          miroir
                        </span>
                      ) : row.belowMin ? (
                        <Badge
                          variant="destructive"
                          className="text-[10px] inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 px-2 py-0.5"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Sous min
                        </Badge>
                      ) : row.is_active && row.effectivePrice != null ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-green-50 border-green-200 text-green-700"
                        >
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Inactif
                        </Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2 pr-2 text-right">
                      {readOnly ? null : isEditing ? (
                        <div className="inline-flex gap-1">
                          <ButtonV2
                            size="sm"
                            onClick={() => {
                              void save(row.channel_id);
                            }}
                            disabled={update.isPending}
                          >
                            <Check className="h-3 w-3" />
                          </ButtonV2>
                          <ButtonV2
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            disabled={update.isPending}
                          >
                            <X className="h-3 w-3" />
                          </ButtonV2>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(row.channel_id);
                            setDraftPrice(
                              row.custom_price_ht != null
                                ? String(row.custom_price_ht)
                                : ''
                            );
                          }}
                          className="h-11 w-11 md:h-8 md:w-8 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-700"
                          title="Modifier le prix canal"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {onManageAll && (
        <div className="mt-3 pt-3 border-t border-neutral-100 text-right">
          <button
            type="button"
            onClick={onManageAll}
            className="text-xs text-neutral-700 underline hover:text-neutral-900"
          >
            Modifier tous les prix canal →
          </button>
        </div>
      )}
    </section>
  );
}
