'use client';

import { Box, TrendingUp, Package, Users } from 'lucide-react';

import {
  formatVolumeM3,
  useStorageTotals,
} from '../../hooks/use-linkme-storage';

function KPICard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}): React.ReactElement {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-md ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-lg font-bold truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function StockageKPIs(): React.ReactElement {
  const { data: totals } = useStorageTotals();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <KPICard
        icon={Box}
        label="Volume total"
        value={formatVolumeM3(totals?.total_volume_m3 ?? 0)}
        color="blue"
      />
      <KPICard
        icon={TrendingUp}
        label="Vol. facturable"
        value={formatVolumeM3(totals?.billable_volume_m3 ?? 0)}
        color="green"
      />
      <KPICard
        icon={Package}
        label="Unites"
        value={`${totals?.total_units ?? 0}`}
        color="purple"
      />
      <KPICard
        icon={Users}
        label="Clients"
        value={`${totals?.affiliates_count ?? 0}`}
        color="orange"
      />
    </div>
  );
}
