'use client';

import { KpiCard, KpiGrid } from '@verone/ui-business';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface LibraryStatsProps {
  totalDocuments: number;
  ventesTotal: number;
  achatsTotal: number;
  sansPdf: number;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =====================================================================
// COMPONENT
// =====================================================================

export function LibraryStats({
  totalDocuments,
  ventesTotal,
  achatsTotal,
  sansPdf,
}: LibraryStatsProps) {
  return (
    <KpiGrid columns={4}>
      <KpiCard
        title="Total documents"
        value={totalDocuments}
        valueType="number"
        icon={<FileText className="h-4 w-4" />}
      />
      <KpiCard
        title="Total ventes HT"
        value={formatCurrency(ventesTotal)}
        icon={<TrendingUp className="h-4 w-4" />}
        variant="success"
      />
      <KpiCard
        title="Total achats HT"
        value={formatCurrency(achatsTotal)}
        icon={<TrendingDown className="h-4 w-4" />}
      />
      <KpiCard
        title="Sans PDF"
        value={sansPdf}
        valueType="number"
        icon={<AlertTriangle className="h-4 w-4" />}
        variant={sansPdf > 0 ? 'warning' : 'default'}
      />
    </KpiGrid>
  );
}
