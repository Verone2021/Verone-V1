'use client';

/**
 * ChannelPricingCard — vue carte (mobile) d'un canal de prix.
 * Utilisée par ChannelPricingDetailed via ResponsiveDataView.
 * Reprend exactement les mêmes handlers et état que ChannelPricingTableRow.
 *
 * Sprint : BO-PRODUCTS-MOBILE-RESPONSIVE-001
 */

import { Badge, ButtonV2, Input } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import {
  AlertTriangle,
  ArrowDown,
  Check,
  Globe,
  Link2,
  Lock,
  Pencil,
  Store,
  X,
} from 'lucide-react';

import { MarginBadge } from './channel-pricing-helpers';
import type { ComputedChannelRow } from './channel-pricing-helpers';

const READ_ONLY = new Set(['google_merchant', 'meta_commerce']);

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  site_internet: Globe,
  linkme: Link2,
  google_merchant: Store,
  meta_commerce: Store,
};

interface ChannelPricingCardProps {
  row: ComputedChannelRow;
  isEditing: boolean;
  draftPrice: string;
  minimumSellingPrice: number;
  isPending: boolean;
  onStartEdit: (id: string, price: number | null | undefined) => void;
  onDraftChange: (val: string) => void;
  onSave: (channelId: string, channelName: string) => void;
  onCancel: () => void;
  onFillMin: () => void;
}

export function ChannelPricingCard({
  row,
  isEditing,
  draftPrice,
  minimumSellingPrice,
  isPending,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
  onFillMin,
}: ChannelPricingCardProps) {
  const Icon = ICONS[row.channel_code] ?? Globe;
  const readOnly = READ_ONLY.has(row.channel_code);

  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white p-3 space-y-2',
        row.belowMin && 'border-red-200 bg-red-50/40'
      )}
    >
      {/* Header: icon + name + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-neutral-500" />
          <span
            className={cn(
              'text-sm font-medium',
              readOnly ? 'italic text-neutral-400' : 'text-neutral-800'
            )}
          >
            {row.channel_name}
          </span>
          {readOnly && <Lock className="h-3 w-3 text-neutral-300" />}
        </div>

        {/* Status badge */}
        {readOnly ? (
          <span className="text-[10px] italic text-neutral-400">Miroir</span>
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
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-neutral-500">Prix HT</span>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.01"
              value={draftPrice}
              onChange={e => onDraftChange(e.target.value)}
              className="h-8 w-24 text-right"
            />
            {minimumSellingPrice > 0 && (
              <button
                type="button"
                onClick={onFillMin}
                className="h-8 inline-flex items-center gap-0.5 rounded border border-neutral-200 bg-white px-1.5 text-[10px] font-medium text-neutral-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                title={`Utiliser le prix min vente (${formatPrice(minimumSellingPrice)})`}
              >
                <ArrowDown className="h-3 w-3" />
                min
              </button>
            )}
          </div>
        ) : readOnly ? (
          <span className="italic text-xs text-neutral-400">
            = site-internet
          </span>
        ) : (
          <span className="tabular-nums text-sm font-medium text-neutral-800">
            {row.effectivePrice != null ? formatPrice(row.effectivePrice) : '—'}
          </span>
        )}
      </div>

      {/* Margins row (if data available) */}
      {!readOnly && (row.grossMargin != null || row.netMargin != null) && (
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          {row.grossMargin != null && (
            <span>
              Marge brute : <MarginBadge value={row.grossMargin} />
            </span>
          )}
          {row.commissionRate != null && row.commissionRate > 0 && (
            <span>
              Commission :{' '}
              <span className="tabular-nums text-neutral-700">
                −{row.commissionRate.toFixed(0)} %
              </span>
            </span>
          )}
          {row.netMargin != null && (
            <span>
              Nette : <MarginBadge value={row.netMargin} />
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {!readOnly && (
        <div className="flex justify-end gap-2 pt-1 border-t border-neutral-100">
          {isEditing ? (
            <>
              <ButtonV2
                size="sm"
                onClick={() => {
                  void onSave(row.channel_id, row.channel_name);
                }}
                disabled={isPending}
                className="h-11 md:h-9"
              >
                <Check className="h-3.5 w-3.5" />
              </ButtonV2>
              <ButtonV2
                size="sm"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
                className="h-11 md:h-9"
              >
                <X className="h-3.5 w-3.5" />
              </ButtonV2>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onStartEdit(row.channel_id, row.custom_price_ht)}
              className="h-11 w-11 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-700"
              title="Modifier le prix canal"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
