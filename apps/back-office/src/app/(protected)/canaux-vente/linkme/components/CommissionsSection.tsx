'use client';

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { useToast } from '@verone/common';
import { Download } from 'lucide-react';

import {
  BulkActionsBar,
  CommissionsFilters,
} from './commissions/CommissionsFilters';
import { CommissionsSummary } from './commissions/CommissionsSummary';
import { CommissionsTable } from './commissions/CommissionsTable';
import { useCommissions } from './commissions/useCommissions';
import type { Commission } from './commissions/types';
import { statusConfig } from './commissions/types';

function exportToCSV(
  commissions: Commission[],
  toast: ReturnType<typeof useToast>['toast']
) {
  if (commissions.length === 0) {
    toast({
      title: 'Aucune donnée',
      description: 'Aucune commission à exporter',
      variant: 'destructive',
    });
    return;
  }

  const headers = [
    'Date',
    'Affilié',
    'Commande',
    'Montant HT',
    'Commission Affilié',
    'Commission LinkMe',
    'Statut',
  ];
  const rows = commissions.map(c => [
    c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '-',
    c.affiliate?.display_name ?? 'N/A',
    (c.order_id ?? '').slice(0, 8),
    c.order_amount_ht.toFixed(2),
    c.affiliate_commission.toFixed(2),
    c.linkme_commission.toFixed(2),
    statusConfig[(c.status ?? 'pending') as keyof typeof statusConfig].label,
  ]);

  const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `commissions-linkme-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  toast({
    title: 'Export réussi',
    description: `${commissions.length} commission(s) exportée(s)`,
  });
}

export function CommissionsSection() {
  const { toast } = useToast();
  const {
    commissions,
    affiliates,
    loading,
    processing,
    handleValidate,
    handleMarkPaid,
  } = useCommissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [affiliateFilter, setAffiliateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = commissions.filter(c => {
    const matchesSearch = (c.order_id ?? '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesAffiliate =
      affiliateFilter === 'all' || c.affiliate_id === affiliateFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesAffiliate && matchesStatus;
  });

  const totals = {
    pending: filtered
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.affiliate_commission, 0),
    validated: filtered
      .filter(c => c.status === 'validated')
      .reduce((sum, c) => sum + c.affiliate_commission, 0),
    paid: filtered
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.affiliate_commission, 0),
  };

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    const selectableIds = filtered
      .filter(c => c.status === 'pending' || c.status === 'validated')
      .map(c => c.id);
    setSelectedIds(
      selectedIds.length === selectableIds.length ? [] : selectableIds
    );
  }

  async function onValidate(ids: string[]) {
    await handleValidate(ids);
    setSelectedIds([]);
  }

  async function onMarkPaid(ids: string[]) {
    await handleMarkPaid(ids);
    setSelectedIds([]);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasActiveFilters =
    searchTerm !== '' || affiliateFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      <CommissionsSummary
        pending={totals.pending}
        validated={totals.validated}
        paid={totals.paid}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Commissions</CardTitle>
              <CardDescription>
                Gestion des commissions affiliés
              </CardDescription>
            </div>
            <ButtonV2
              variant="outline"
              onClick={() => exportToCSV(filtered, toast)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
          <CommissionsFilters
            searchTerm={searchTerm}
            affiliateFilter={affiliateFilter}
            statusFilter={statusFilter}
            affiliates={affiliates}
            onSearchChange={setSearchTerm}
            onAffiliateChange={setAffiliateFilter}
            onStatusChange={setStatusFilter}
          />
          <BulkActionsBar
            selectedCount={selectedIds.length}
            processing={processing}
            onValidate={() => {
              void onValidate(selectedIds).catch(error => {
                console.error(
                  '[CommissionsSection] Bulk validate failed:',
                  error
                );
              });
            }}
            onMarkPaid={() => {
              void onMarkPaid(selectedIds).catch(error => {
                console.error(
                  '[CommissionsSection] Bulk mark paid failed:',
                  error
                );
              });
            }}
          />
          <CommissionsTable
            commissions={filtered}
            selectedIds={selectedIds}
            processing={processing}
            hasActiveFilters={hasActiveFilters}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onValidate={ids => {
              void onValidate(ids).catch(error => {
                console.error(
                  '[CommissionsSection] Row validate failed:',
                  error
                );
              });
            }}
            onMarkPaid={ids => {
              void onMarkPaid(ids).catch(error => {
                console.error(
                  '[CommissionsSection] Row mark paid failed:',
                  error
                );
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
