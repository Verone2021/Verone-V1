'use client';

/**
 * ChannelPricingDetailed — version étendue du tableau prix par canal pour
 * l'onglet Tarification. Colonnes : Canal / Prix HT / Écart vs min / Marge
 * brute % / Commission / Marge nette / Statut / Actions.
 * Ligne LinkMe : expandable avec breakdown commission + marge nette.
 * Miroirs (Google Merchant, Meta Commerce) : lockés, lien = site-internet.
 * Chip rouge "Sous min" proéminent.
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { Fragment, useMemo, useState, useCallback } from 'react';

import { useChannelPricing, useUpdateChannelPrice } from '@verone/common';
import { Badge, ButtonV2, Input } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  Link2,
  Lock,
  Pencil,
  RefreshCw,
  Store,
  X,
} from 'lucide-react';

import { LinkMeExpansionRows } from './LinkMeExpansionRows';

interface ChannelPricingDetailedProps {
  productId: string;
  minimumSellingPrice: number;
  landedCost: number | null;
}

const READ_ONLY = new Set(['google_merchant', 'meta_commerce']);

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  site_internet: Globe,
  linkme: Link2,
  google_merchant: Store,
  meta_commerce: Store,
};

function calcGrossMarginPct(
  priceHt: number,
  minSelling: number
): number | null {
  if (minSelling <= 0) return null;
  return ((priceHt - minSelling) / minSelling) * 100;
}

function calcNetMarginPct(
  priceHt: number,
  commissionRate: number | null,
  landedCost: number
): number | null {
  if (priceHt <= 0 || landedCost <= 0) return null;
  const rate = commissionRate ?? 0;
  const netPrice = priceHt * (1 - rate / 100);
  if (netPrice <= 0) return null;
  return ((netPrice - landedCost) / netPrice) * 100;
}

function MarginBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-neutral-300">—</span>;
  const isNeg = value < 0;
  return (
    <span
      className={cn(
        'tabular-nums font-medium',
        isNeg ? 'text-red-600' : 'text-green-700'
      )}
    >
      {value >= 0 ? '+' : ''}
      {value.toFixed(0)} %
    </span>
  );
}

export function ChannelPricingDetailed({
  productId,
  minimumSellingPrice,
  landedCost,
}: ChannelPricingDetailedProps) {
  const { data: channels, isLoading } = useChannelPricing(productId);
  const update = useUpdateChannelPrice();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const rows = useMemo(
    () =>
      (channels ?? []).map(c => {
        const effectivePrice = c.custom_price_ht ?? c.public_price_ht;
        const belowMin =
          effectivePrice != null &&
          minimumSellingPrice > 0 &&
          effectivePrice < minimumSellingPrice;
        const gapVsMin =
          effectivePrice != null && minimumSellingPrice > 0
            ? effectivePrice - minimumSellingPrice
            : null;
        const grossMargin =
          effectivePrice != null
            ? calcGrossMarginPct(effectivePrice, minimumSellingPrice)
            : null;
        const commissionRate = c.channel_commission_rate ?? null;
        const netMargin =
          effectivePrice != null && landedCost != null && landedCost > 0
            ? calcNetMarginPct(effectivePrice, commissionRate, landedCost)
            : null;
        const commissionAmount =
          effectivePrice != null && commissionRate != null
            ? effectivePrice * (commissionRate / 100)
            : null;
        const netPrice =
          effectivePrice != null && commissionRate != null
            ? effectivePrice * (1 - commissionRate / 100)
            : null;
        const netMarginEur =
          netPrice != null && landedCost != null ? netPrice - landedCost : null;
        return {
          ...c,
          effectivePrice,
          belowMin,
          gapVsMin,
          grossMargin,
          commissionRate,
          netMargin,
          commissionAmount,
          netPrice,
          netMarginEur,
        };
      }),
    [channels, minimumSellingPrice, landedCost]
  );

  const save = useCallback(
    async (channelId: string) => {
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
        // toast géré par le hook
      }
    },
    [draftPrice, update, productId]
  );

  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-neutral-900">
          Prix par canal — détail
        </h3>
        <div className="flex items-center gap-2">
          {minimumSellingPrice > 0 && (
            <Badge
              variant="outline"
              className="text-xs bg-green-50 border-green-200 text-green-700"
            >
              Min vente HT {formatPrice(minimumSellingPrice)}
            </Badge>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs border border-neutral-200 rounded px-2 py-1 hover:bg-neutral-50 text-neutral-600"
            title="Bientôt : mise à jour groupée des prix canal"
          >
            <RefreshCw className="h-3 w-3" />
            Mise à jour groupée
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-sm text-neutral-400 py-4">Chargement…</div>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-neutral-500 border-b border-neutral-100">
                <th
                  className="text-left py-2 pl-2 w-5 font-medium"
                  aria-label="Expand"
                />
                <th className="text-left py-2 font-medium">Canal</th>
                <th className="text-right py-2 font-medium">Prix HT</th>
                <th className="text-right py-2 font-medium hidden lg:table-cell">
                  Écart vs min
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
                const isExpanded = expandedId === row.channel_id;
                const canExpand =
                  row.channel_code === 'linkme' &&
                  row.commissionRate != null &&
                  row.commissionRate > 0 &&
                  row.effectivePrice != null;

                return (
                  <Fragment key={row.channel_id}>
                    <tr
                      className={cn(
                        'border-b border-neutral-50 last:border-0',
                        readOnly && 'text-neutral-400',
                        isExpanded && 'bg-neutral-50'
                      )}
                    >
                      {/* Expand toggle */}
                      <td className="py-2 pl-2 w-5">
                        {canExpand && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(row.channel_id)}
                            className="h-5 w-5 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-700"
                            aria-label={isExpanded ? 'Réduire' : 'Voir détail'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </td>

                      {/* Canal */}
                      <td className="py-2">
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
                            {readOnly && (
                              <Lock className="h-3 w-3 text-neutral-300" />
                            )}
                          </div>
                          {row.commissionRate != null &&
                            row.commissionRate > 0 && (
                              <span className="text-[10px] text-neutral-500 pl-6">
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
                          <span className="italic text-xs text-neutral-400">
                            = site-internet
                          </span>
                        ) : row.effectivePrice != null ? (
                          formatPrice(row.effectivePrice)
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Écart vs min */}
                      <td
                        className={cn(
                          'py-2 text-right tabular-nums text-xs hidden lg:table-cell',
                          row.belowMin
                            ? 'text-red-600 font-semibold'
                            : 'text-neutral-600'
                        )}
                      >
                        {readOnly
                          ? '—'
                          : row.gapVsMin != null
                            ? `${row.gapVsMin >= 0 ? '+' : ''}${formatPrice(row.gapVsMin)}`
                            : '—'}
                      </td>

                      {/* Marge brute */}
                      <td className="py-2 text-right text-xs hidden lg:table-cell">
                        {readOnly ? (
                          '—'
                        ) : (
                          <MarginBadge value={row.grossMargin} />
                        )}
                      </td>

                      {/* Commission */}
                      <td className="py-2 text-right tabular-nums text-xs hidden xl:table-cell text-neutral-500">
                        {readOnly || !row.commissionRate
                          ? '—'
                          : `−${row.commissionRate.toFixed(0)} %`}
                      </td>

                      {/* Marge nette */}
                      <td className="py-2 text-right text-xs hidden xl:table-cell">
                        {readOnly ? '—' : <MarginBadge value={row.netMargin} />}
                      </td>

                      {/* Statut */}
                      <td className="py-2 pl-3 hidden md:table-cell">
                        {readOnly ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 italic">
                            Miroir
                          </span>
                        ) : row.belowMin ? (
                          <Badge className="text-[10px] inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 px-2 py-0.5">
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

                    {/* Sub-rows LinkMe : commission + marge nette */}
                    {canExpand && isExpanded && (
                      <LinkMeExpansionRows
                        channelId={row.channel_id}
                        commissionRate={row.commissionRate!}
                        commissionAmount={row.commissionAmount}
                        grossMarginEur={row.grossMargin}
                        netMarginEur={row.netMarginEur}
                        netMarginPercent={row.netMargin}
                      />
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
