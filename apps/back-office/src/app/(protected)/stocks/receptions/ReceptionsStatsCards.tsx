'use client';

import type { ReceptionShipmentStats } from '@verone/types';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Package,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

interface ReceptionsStatsCardsProps {
  stats: ReceptionShipmentStats;
}

export function ReceptionsStatsCards({ stats }: ReceptionsStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              En attente
            </CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {stats.total_pending}
          </div>
          <p className="text-xs text-gray-500 mt-1">Commandes confirmées</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Partielles
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-verone-warning" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-verone-warning">
            {stats.total_partial}
          </div>
          <p className="text-xs text-gray-500 mt-1">Réceptions incomplètes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Aujourd'hui
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-verone-success" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-verone-success">
            {stats.total_completed_today}
          </div>
          <p className="text-xs text-gray-500 mt-1">Réceptions complètes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              En retard
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-verone-danger" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-verone-danger">
            {stats.total_overdue}
          </div>
          <p className="text-xs text-gray-500 mt-1">Date dépassée</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Urgent
            </CardTitle>
            <Clock className="h-4 w-4 text-verone-warning" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-verone-warning">
            {stats.total_urgent}
          </div>
          <p className="text-xs text-gray-500 mt-1">Sous 3 jours</p>
        </CardContent>
      </Card>
    </div>
  );
}
