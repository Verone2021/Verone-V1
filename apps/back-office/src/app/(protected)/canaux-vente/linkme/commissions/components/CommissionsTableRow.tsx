'use client';

import React from 'react';

import { Badge } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { TableCell, TableRow } from '@verone/ui';
import { formatPrice } from '@verone/utils';
import { ChevronRight } from 'lucide-react';

import type { Commission } from '../types';
import { CommissionDetailContent } from './CommissionDetailContent';

interface CommissionsTableRowProps {
  commission: Commission;
  showCheckboxes: boolean;
  selectedIds: string[];
  expandedId: string | null;
  colCount: number;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string | null) => void;
}

export function CommissionsTableRow({
  commission,
  showCheckboxes,
  selectedIds,
  expandedId,
  colCount,
  onToggleSelect,
  onToggleExpand,
}: CommissionsTableRowProps) {
  const orderNumber =
    commission.sales_order?.order_number ??
    commission.order_number ??
    `#${commission.order_id.slice(0, 8)}`;
  const commissionHT =
    commission.total_payout_ht ?? commission.affiliate_commission;
  const commissionTTC =
    commission.total_payout_ttc ?? commission.affiliate_commission_ttc ?? 0;
  const isExpanded = expandedId === commission.id;

  const org = commission.sales_order?.customer;
  const orgDisplay = (() => {
    if (!org) return <span className="text-gray-400">-</span>;
    const tradeName = org.trade_name;
    const legalName = org.legal_name;
    if (tradeName && tradeName !== legalName) {
      return (
        <span className="text-sm">
          {tradeName}{' '}
          <span className="text-muted-foreground">({legalName})</span>
        </span>
      );
    }
    return <span className="text-sm">{legalName}</span>;
  })();

  return (
    <React.Fragment key={commission.id}>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => onToggleExpand(isExpanded ? null : commission.id)}
      >
        {showCheckboxes && (
          <TableCell onClick={e => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds.includes(commission.id)}
              onCheckedChange={() => onToggleSelect(commission.id)}
            />
          </TableCell>
        )}
        <TableCell>
          <div className="flex items-center gap-2">
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
            <span>
              {(commission.sales_order?.created_at ?? commission.created_at)
                ? new Date(
                    (commission.sales_order?.created_at ??
                      commission.created_at)!
                  ).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                  })
                : '-'}
            </span>
          </div>
        </TableCell>
        <TableCell className="font-mono text-sm font-medium">
          {orderNumber}
        </TableCell>
        <TableCell>{orgDisplay}</TableCell>
        <TableCell>{commission.affiliate?.display_name ?? 'N/A'}</TableCell>
        <TableCell>
          <Badge
            variant={
              commission.sales_order?.payment_status_v2 === 'paid'
                ? 'default'
                : 'outline'
            }
            className={
              commission.sales_order?.payment_status_v2 === 'paid'
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-orange-50 text-orange-600 border-orange-200'
            }
          >
            {commission.sales_order?.payment_status_v2 === 'paid'
              ? 'Payé'
              : 'En attente'}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          {formatPrice(
            commission.sales_order?.total_ht ?? commission.order_amount_ht
          )}
        </TableCell>
        <TableCell className="text-right">
          {formatPrice(commission.sales_order?.total_ttc ?? 0)}
        </TableCell>
        <TableCell className="text-right font-medium">
          {formatPrice(commissionHT)}
        </TableCell>
        <TableCell className="text-right font-bold text-orange-600">
          {formatPrice(commissionTTC)}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={colCount} className="bg-muted/30 p-0">
            <div className="p-4">
              <CommissionDetailContent commission={commission} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}
