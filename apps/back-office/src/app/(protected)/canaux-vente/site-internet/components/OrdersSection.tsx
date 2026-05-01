/**
 * OrdersSection - Commandes du canal Site Internet
 *
 * Utilise SalesOrdersTable de @verone/orders avec channelId filter.
 * Pattern identique à LinkMe (CommandesClient.tsx).
 *
 * Fonctionnalités ajoutées :
 * - Bouton "Exporter CSV" dans le header (via renderHeaderRight)
 */

'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { SalesOrdersTable } from '@verone/orders';
import type { SalesOrder } from '@verone/orders';
import { Button } from '@verone/ui';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { updateSalesOrderStatus } from '@/app/actions/sales-orders';

import { SITE_INTERNET_CHANNEL_ID } from '../constants';
import { exportOrdersCSV } from '../utils/export-orders-csv';

export function OrdersSection() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  const handleViewOrder = useCallback(
    (order: SalesOrder) => {
      router.push(`/commandes/clients/${order.id}/details`);
    },
    [router]
  );

  const handleExportCSV = useCallback(() => {
    setIsExporting(true);
    void exportOrdersCSV()
      .then(() => {
        toast.success('Export CSV téléchargé');
      })
      .catch(err => {
        console.error('[OrdersSection] Export CSV error:', err);
        toast.error(
          err instanceof Error ? err.message : "Erreur lors de l'export CSV"
        );
      })
      .finally(() => {
        setIsExporting(false);
      });
  }, []);

  const renderHeaderRight = useCallback(
    () => (
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-1.5" />
        )}
        Exporter CSV
      </Button>
    ),
    [handleExportCSV, isExporting]
  );

  return (
    <SalesOrdersTable
      channelId={SITE_INTERNET_CHANNEL_ID}
      onViewOrder={handleViewOrder}
      showChannelColumn={false}
      showKPIs
      allowValidate
      allowShip
      allowCancel
      allowEdit
      enablePagination
      defaultItemsPerPage={20}
      updateStatusAction={updateSalesOrderStatus}
      renderHeaderRight={renderHeaderRight}
    />
  );
}
