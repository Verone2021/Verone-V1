'use client';

import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Package,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

import type { ShipmentStats } from './expeditions-types';

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: ReactNode;
  valueClassName?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  valueClassName = 'text-gray-900',
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

interface ExpeditionsStatsProps {
  stats: ShipmentStats;
}

export function ExpeditionsStats({ stats }: ExpeditionsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="En attente"
        value={stats.total_pending}
        subtitle="Commandes confirmées"
        icon={<Package className="h-4 w-4 text-gray-400" />}
      />
      <StatCard
        title="Partielles"
        value={stats.total_partial}
        subtitle="Expéditions incomplètes"
        icon={<TrendingUp className="h-4 w-4 text-verone-warning" />}
        valueClassName="text-verone-warning"
      />
      <StatCard
        title="Aujourd'hui"
        value={stats.total_completed_today}
        subtitle="Expéditions complètes"
        icon={<CheckCircle className="h-4 w-4 text-verone-success" />}
        valueClassName="text-verone-success"
      />
      <StatCard
        title="En retard"
        value={stats.total_overdue}
        subtitle="Date dépassée"
        icon={<AlertTriangle className="h-4 w-4 text-verone-danger" />}
        valueClassName="text-verone-danger"
      />
      <StatCard
        title="Urgent"
        value={stats.total_urgent}
        subtitle="Sous 3 jours"
        icon={<Clock className="h-4 w-4 text-verone-warning" />}
        valueClassName="text-verone-warning"
      />
    </div>
  );
}
