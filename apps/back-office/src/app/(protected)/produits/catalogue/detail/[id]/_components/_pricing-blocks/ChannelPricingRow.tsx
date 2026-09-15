'use client';

/**
 * ChannelPricingTableRow — une ligne du tableau canal dans ChannelPricingDetailed.
 * Gère l'affichage (lecture, édition), les actions et l'expansion LinkMe.
 *
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { Fragment } from 'react';

import { Badge, ButtonV2, Input } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import {
  AlertTriangle,
  ArrowDown,
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  Link2,
  Lock,
  Pencil,
  Store,
  X,
} from 'lucide-react';

import { LinkMeExpansionRows } from './LinkMeExpansionRows';
import { MarginBadge } from './channel-pricing-helpers';
import type { ComputedChannelRow } from './channel-pricing-helpers';

// ---------------------------------------------------------------------------
// Constants (utilisées uniquement dans ce composant)
// ---------------------------------------------------------------------------

const READ_ONLY = new Set(['google_merchant', 'meta_commerce']);

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  site_internet: Globe,
  linkme: Link2,
  google_merchant: Store,
  meta_commerce: Store,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChannelPricingTableRowProps {
  row: ComputedChannelRow;
  isEditing: boolean;
  isExpanded: boolean;
  canExpand: boolean;
  draftPrice: string;
  minimumSellingPrice: number;
  isPending: boolean;
  onToggleExpand: (id: string) => void;
  onStartEdit: (id: string, price: number | null | undefined) => void;
  onDraftChange: (val: string) => void;
  onSave: (channelId: string, channelName: string) => void;
  onCancel: () => void;
  onFillMin: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChannelPricingTableRow({
  row,
  isEditing,
  isExpanded,
  canExpand,
  draftPrice,
  minimumSellingPrice,
  isPending,
  onToggleExpand,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
  onFillMin,
}: ChannelPricingTableRowProps) {
  const Icon = ICONS[row.channel_code] ?? Globe;
  const readOnly = READ_ONLY.has(row.channel_code);

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
              onClick={() => onToggleExpand(row.channel_id)}
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
                  readOnly ? 'text-neutral-400 italic' : 'text-neutral-800'
                )}
              >
                {row.channel_name}
              </span>
              {readOnly && <Lock className="h-3 w-3 text-neutral-300" />}
            </div>
            {row.commissionRate != null && row.commissionRate > 0 && (
              <span className="text-[10px] text-neutral-500 pl-6">
                commission {row.commissionRate.toFixed(0)} %
              </span>
            )}
          </div>
        </td>

        {/* Prix HT */}
        <td className="py-2 text-right tabular-nums">
          {isEditing ? (
            <div className="inline-flex items-center gap-1">
              <Input
                type="number"
                step="0.01"
                value={draftPrice}
                onChange={e => onDraftChange(e.target.value)}
                className="h-7 w-24 text-right"
              />
              {minimumSellingPrice > 0 && (
                <button
                  type="button"
                  onClick={onFillMin}
                  className="h-7 inline-flex items-center gap-0.5 rounded border border-neutral-200 bg-white px-1.5 text-[10px] font-medium text-neutral-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700"
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
            row.belowMin ? 'text-red-600 font-semibold' : 'text-neutral-600'
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
          {readOnly ? '—' : <MarginBadge value={row.grossMargin} />}
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
                  void onSave(row.channel_id, row.channel_name);
                }}
                disabled={isPending}
              >
                <Check className="h-3 w-3" />
              </ButtonV2>
              <ButtonV2
                size="sm"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                <X className="h-3 w-3" />
              </ButtonV2>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onStartEdit(row.channel_id, row.custom_price_ht)}
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
}
