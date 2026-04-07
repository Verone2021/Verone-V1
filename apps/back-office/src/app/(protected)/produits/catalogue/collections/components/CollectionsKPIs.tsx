'use client';

import { Archive, Eye, Layers } from 'lucide-react';

import { KPICardUnified } from '@verone/ui';

interface CollectionsKPIsProps {
  stats: {
    total: number;
    active: number;
    archived: number;
  };
  loading: boolean;
  archivedLoading: boolean;
}

export function CollectionsKPIs({
  stats,
  loading,
  archivedLoading,
}: CollectionsKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pt-6">
      <KPICardUnified
        variant="elegant"
        title="Collections totales"
        value={loading ? '...' : stats.total}
        icon={Layers}
      />
      <KPICardUnified
        variant="elegant"
        title="Collections actives"
        value={loading ? '...' : stats.active}
        icon={Eye}
      />
      <KPICardUnified
        variant="elegant"
        title="Collections archivées"
        value={archivedLoading ? '...' : stats.archived}
        icon={Archive}
      />
    </div>
  );
}
