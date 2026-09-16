'use client';

import { ButtonV2 } from '@verone/ui/components/ui/button';
import { Checkbox } from '@verone/ui/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@verone/ui/components/ui/dropdown-menu';
import { cn } from '@verone/utils';
import { MoreHorizontal, Trophy } from 'lucide-react';

import type { SourcingCandidateSupplier } from '../../../hooks/sourcing/use-sourcing-notebook';
import {
  OFFER_NEXT_STATUS,
  OFFER_STATUS_LABELS,
  type OfferComparison,
  type OfferStatus,
} from '../../../utils/sourcing-offer-cost';

const STATUT_CLASSES: Record<OfferStatus, string> = {
  identified: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  responded: 'bg-amber-100 text-amber-700',
  shortlisted: 'bg-indigo-100 text-indigo-700',
  selected: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export function euros(value: number | null, currency = 'EUR'): string {
  if (value === null) return '—';
  return value.toLocaleString('fr-FR', { style: 'currency', currency });
}

export function supplierName(offer: SourcingCandidateSupplier): string {
  return (
    offer.supplier?.trade_name ?? offer.supplier?.legal_name ?? 'Fournisseur'
  );
}

/** Une offre passée par `compareOffers`, telle que l'écran la manipule. */
export type OfferLine = OfferComparison<
  SourcingCandidateSupplier & { quotedPrice: number | null }
>;

export interface OfferLineProps {
  item: OfferLine;
  selected: boolean;
  onToggle: () => void;
  isCurrentSupplier: boolean;
  busy: boolean;
  adopting: boolean;
  onEdit: (offer: SourcingCandidateSupplier) => void;
  onUpdateStatus: (offerId: string, status: OfferStatus) => void;
  onAdopt: (offerId: string) => void;
}

function StatusBadge({ status }: { status: string }) {
  const known = (
    status in OFFER_STATUS_LABELS ? status : 'identified'
  ) as OfferStatus;
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        STATUT_CLASSES[known]
      )}
    >
      {OFFER_STATUS_LABELS[known]}
    </span>
  );
}

function OfferActions({
  item,
  busy,
  adopting,
  onEdit,
  onUpdateStatus,
  onAdopt,
}: Omit<OfferLineProps, 'selected' | 'onToggle' | 'isCurrentSupplier'>) {
  const status = item.offer.status as OfferStatus;
  const next = OFFER_NEXT_STATUS[status];
  const canAdopt =
    status !== 'rejected' &&
    status !== 'selected' &&
    (item.offer.quoted_price ?? 0) > 0;

  return (
    <div className="flex items-center justify-end gap-1">
      {canAdopt && (
        <ButtonV2
          variant="success"
          size="sm"
          onClick={() => onAdopt(item.offer.id)}
          disabled={busy || adopting}
          className="h-11 md:h-8"
        >
          {adopting ? '…' : 'Retenir'}
        </ButtonV2>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonV2
            variant="ghost"
            size="sm"
            icon={MoreHorizontal}
            disabled={busy}
            aria-label="Autres actions sur l’offre"
            className="h-11 w-11 md:h-8 md:w-8"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="min-h-11 md:min-h-0"
            onClick={() => onEdit(item.offer)}
          >
            Modifier l’offre
          </DropdownMenuItem>
          {next !== undefined && (
            <DropdownMenuItem
              className="min-h-11 md:min-h-0"
              onClick={() => onUpdateStatus(item.offer.id, next)}
            >
              Passer en « {OFFER_STATUS_LABELS[next]} »
            </DropdownMenuItem>
          )}
          {status !== 'rejected' && (
            <DropdownMenuItem
              className="min-h-11 text-red-600 focus:text-red-600 md:min-h-0"
              onClick={() => onUpdateStatus(item.offer.id, 'rejected')}
            >
              Écarter
            </DropdownMenuItem>
          )}
          {status === 'rejected' && (
            <DropdownMenuItem
              className="min-h-11 md:min-h-0"
              onClick={() => onUpdateStatus(item.offer.id, 'contacted')}
            >
              Remettre en lice
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function GapLabel({ item }: { item: OfferLineProps['item'] }) {
  if (item.gapToTarget === null)
    return <span className="text-gray-400">—</span>;
  const over = item.gapToTarget > 0;
  return (
    <span className={over ? 'text-red-600' : 'text-green-600'}>
      {over ? '+' : ''}
      {item.gapToTargetPercent?.toLocaleString('fr-FR', {
        maximumFractionDigits: 0,
      })}
      %
    </span>
  );
}

export function OfferRow({
  item,
  selected,
  onToggle,
  isCurrentSupplier,
  ...actions
}: OfferLineProps) {
  const { offer, cost } = item;
  return (
    <tr
      className={cn(
        'border-b border-gray-100 text-sm',
        offer.status === 'rejected' && 'opacity-50'
      )}
    >
      <td className="p-2">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={`Sélectionner ${supplierName(offer)}`}
        />
      </td>
      <td className="p-2">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium" title={supplierName(offer)}>
            {supplierName(offer)}
          </span>
          {item.isBest && (
            <Trophy
              className="h-3.5 w-3.5 shrink-0 text-amber-500"
              aria-label="Meilleur coût rendu"
            />
          )}
          {isCurrentSupplier && (
            <span className="shrink-0 rounded-full bg-black px-1.5 py-0.5 text-[10px] text-white">
              actuel
            </span>
          )}
        </span>
      </td>
      <td className="p-2">
        <StatusBadge status={offer.status} />
      </td>
      <td className="p-2 text-right">
        {euros(offer.quoted_price, offer.quoted_currency)}
      </td>
      <td className="hidden p-2 text-right lg:table-cell">
        {offer.quoted_moq ?? '—'}
      </td>
      <td className="hidden p-2 text-right xl:table-cell">
        {offer.quoted_lead_days != null ? `${offer.quoted_lead_days} j` : '—'}
      </td>
      <td className="hidden p-2 text-right text-gray-600 lg:table-cell">
        {cost.hasFees ? euros(cost.feesPerUnit) : '—'}
      </td>
      <td className="p-2 text-right font-medium">
        {euros(cost.landedUnitCost)}
      </td>
      <td className="hidden p-2 text-right xl:table-cell">
        <GapLabel item={item} />
      </td>
      <td className="p-2">
        <OfferActions item={item} {...actions} />
      </td>
    </tr>
  );
}

export function OfferCard({
  item,
  selected,
  onToggle,
  isCurrentSupplier,
  ...actions
}: OfferLineProps) {
  const { offer, cost } = item;
  return (
    <div
      className={cn(
        'space-y-2 rounded-lg border border-gray-200 bg-white p-3',
        offer.status === 'rejected' && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            aria-label={`Sélectionner ${supplierName(offer)}`}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-sm font-medium">
            {supplierName(offer)}
            {item.isBest && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
            {isCurrentSupplier && (
              <span className="rounded-full bg-black px-1.5 py-0.5 text-[10px] text-white">
                actuel
              </span>
            )}
          </p>
          <p className="mt-1">
            <StatusBadge status={offer.status} />
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{euros(cost.landedUnitCost)}</p>
          <p className="text-xs text-gray-500">rendu</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <dt>Prix</dt>
          <dd>{euros(offer.quoted_price, offer.quoted_currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Frais/u</dt>
          <dd>{cost.hasFees ? euros(cost.feesPerUnit) : '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt>MOQ</dt>
          <dd>{offer.quoted_moq ?? '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Délai</dt>
          <dd>
            {offer.quoted_lead_days != null
              ? `${offer.quoted_lead_days} j`
              : '—'}
          </dd>
        </div>
        {item.gapToTarget !== null && (
          <div className="col-span-2 flex justify-between">
            <dt>Écart au prix cible</dt>
            <dd>
              <GapLabel item={item} />
            </dd>
          </div>
        )}
      </dl>

      <OfferActions item={item} {...actions} />
    </div>
  );
}
