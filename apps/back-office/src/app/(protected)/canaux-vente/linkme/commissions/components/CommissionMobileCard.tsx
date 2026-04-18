'use client';

import {
  Badge,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Checkbox,
} from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { ChevronRight, Wallet } from 'lucide-react';

import type { Commission } from '../types';
import { CommissionDetailContent } from './CommissionDetailContent';

interface CommissionMobileCardProps {
  commission: Commission;
  showCheckboxes: boolean;
  selectedIds: string[];
  expandedId: string | null;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string | null) => void;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function OrgDisplay({
  commission,
}: {
  commission: Commission;
}): React.ReactElement {
  const org = commission.sales_order?.customer;
  if (!org) return <span className="text-gray-400 text-sm">-</span>;
  const tradeName = org.trade_name;
  const legalName = org.legal_name;
  if (tradeName && tradeName !== legalName) {
    return (
      <span className="text-sm">
        {tradeName}{' '}
        <span className="text-muted-foreground text-xs">({legalName})</span>
      </span>
    );
  }
  return <span className="text-sm">{legalName}</span>;
}

export function CommissionMobileCard({
  commission,
  showCheckboxes,
  selectedIds,
  expandedId,
  onToggleSelect,
  onToggleExpand,
}: CommissionMobileCardProps): React.ReactElement {
  const orderNumber =
    commission.sales_order?.order_number ??
    commission.order_number ??
    `#${commission.order_id.slice(0, 8)}`;

  const commissionHT =
    commission.total_payout_ht ?? commission.affiliate_commission;
  const commissionTTC =
    commission.total_payout_ttc ?? commission.affiliate_commission_ttc ?? 0;

  const isExpanded = expandedId === commission.id;
  const isPaid = commission.sales_order?.payment_status_v2 === 'paid';

  const dateStr =
    commission.sales_order?.created_at ?? commission.created_at ?? null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {showCheckboxes && (
            <div className="pt-0.5">
              <Checkbox
                checked={selectedIds.includes(commission.id)}
                onCheckedChange={() => onToggleSelect(commission.id)}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold truncate">
                {orderNumber}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDate(dateStr)}
              </span>
            </div>
            <div className="mt-1 truncate">
              <OrgDisplay commission={commission} />
            </div>
          </div>
          <button
            type="button"
            className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center shrink-0 rounded-md hover:bg-muted/50 transition-colors"
            onClick={() => onToggleExpand(isExpanded ? null : commission.id)}
            aria-label={isExpanded ? 'Replier' : 'Voir le detail'}
          >
            <ChevronRight
              className={`h-5 w-5 md:h-4 md:w-4 text-muted-foreground transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Affilié</p>
            <p className="truncate">
              {commission.affiliate?.display_name ?? 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paiement</p>
            <Badge
              variant={isPaid ? 'default' : 'outline'}
              className={
                isPaid
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-orange-50 text-orange-600 border-orange-200'
              }
            >
              {isPaid ? 'Payé' : 'En attente'}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total HT</p>
            <p>
              {formatPrice(
                commission.sales_order?.total_ht ?? commission.order_amount_ht
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total TTC</p>
            <p>{formatPrice(commission.sales_order?.total_ttc ?? 0)}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Rémunération HT</p>
          <p className="font-bold text-orange-600">
            {formatPrice(commissionHT)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Rémunération TTC</p>
          <p className="font-bold text-orange-600">
            {formatPrice(commissionTTC)}
          </p>
        </div>
      </CardFooter>

      {isExpanded && (
        <div className="px-4 pb-4 border-t pt-3">
          <CommissionDetailContent commission={commission} />
        </div>
      )}
    </Card>
  );
}

// Composant icone vide pour emptyMessage
export function CommissionsEmptyMessage({
  description,
}: {
  description: string;
}): React.ReactElement {
  return (
    <div className="text-center py-12">
      <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Aucune commission</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
