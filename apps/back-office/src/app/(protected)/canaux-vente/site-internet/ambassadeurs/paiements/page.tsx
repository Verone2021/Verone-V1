'use client';

import { useState } from 'react';

import { Button } from '@verone/ui';
import { Download } from 'lucide-react';

import { exportPayoutsCsv } from './payouts-csv-export';
import { PayoutTable } from './PayoutTable';
import { usePaidAttributionsForMonth } from '../../hooks/use-pending-payouts';

// ============================================
// CsvExportButton
// ============================================

function CsvExportButton() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);

  const { data, isLoading } = usePaidAttributionsForMonth(year, month);

  const handleExport = () => {
    if (!data || data.length === 0) return;
    exportPayoutsCsv(data, year, month);
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isLoading || !data || data.length === 0}
      className="h-11 md:h-9 gap-1.5"
    >
      <Download className="h-4 w-4" />
      <span>
        Export CSV {month}/{year}
      </span>
      {data && data.length > 0 && (
        <span className="text-xs text-muted-foreground">({data.length})</span>
      )}
    </Button>
  );
}

// ============================================
// Page
// ============================================

export default function AmbassadeursPaiementsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">
            Paiements ambassadeurs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ambassadeurs dont le solde dépasse le seuil de paiement
          </p>
        </div>
        <CsvExportButton />
      </div>

      {/* Table */}
      <PayoutTable />
    </div>
  );
}
