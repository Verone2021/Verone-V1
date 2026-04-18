'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Wallet } from 'lucide-react';

import type { Commission } from './types';
import { statusConfig } from './types';

interface CommissionsTableProps {
  commissions: Commission[];
  selectedIds: string[];
  processing: boolean;
  hasActiveFilters: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onValidate: (ids: string[]) => void;
  onMarkPaid: (ids: string[]) => void;
}

export function CommissionsTable({
  commissions,
  selectedIds,
  processing,
  hasActiveFilters,
  onToggleSelect,
  onToggleSelectAll,
  onValidate,
  onMarkPaid,
}: CommissionsTableProps) {
  if (commissions.length === 0) {
    return (
      <div className="text-center py-12">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucune commission</h3>
        <p className="text-muted-foreground">
          {hasActiveFilters
            ? 'Aucun résultat pour ces filtres'
            : 'Les commissions apparaîtront ici après les premières ventes'}
        </p>
      </div>
    );
  }

  const selectableCount = commissions.filter(
    c => c.status === 'pending' || c.status === 'validated'
  ).length;
  const allSelected =
    selectedIds.length > 0 && selectedIds.length === selectableCount;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onToggleSelectAll}
            />
          </TableHead>
          <TableHead className="hidden lg:table-cell">Date</TableHead>
          <TableHead>Affilié</TableHead>
          <TableHead className="hidden xl:table-cell">Commande</TableHead>
          <TableHead className="hidden lg:table-cell text-right">
            Montant HT
          </TableHead>
          <TableHead className="text-right">Commission</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {commissions.map(commission => {
          const statusInfo =
            statusConfig[
              (commission.status ?? 'pending') as keyof typeof statusConfig
            ];
          const canSelect =
            commission.status === 'pending' ||
            commission.status === 'validated';

          return (
            <TableRow key={commission.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(commission.id)}
                  onCheckedChange={() => onToggleSelect(commission.id)}
                  disabled={!canSelect}
                />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {commission.created_at
                  ? new Date(commission.created_at).toLocaleDateString('fr-FR')
                  : '-'}
              </TableCell>
              <TableCell>
                {commission.affiliate?.display_name ?? 'N/A'}
              </TableCell>
              <TableCell className="hidden xl:table-cell font-mono text-sm">
                #{(commission.order_id ?? '').slice(0, 8)}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right">
                {commission.order_amount_ht.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                })}{' '}
                €
              </TableCell>
              <TableCell className="text-right font-medium">
                {commission.affiliate_commission.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                })}{' '}
                €
              </TableCell>
              <TableCell>
                <Badge variant={statusInfo.variant}>
                  <statusInfo.icon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {commission.status === 'pending' && (
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void onValidate([commission.id]);
                    }}
                    disabled={processing}
                  >
                    Valider
                  </ButtonV2>
                )}
                {commission.status === 'validated' && (
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void onMarkPaid([commission.id]);
                    }}
                    disabled={processing}
                  >
                    Payer
                  </ButtonV2>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
