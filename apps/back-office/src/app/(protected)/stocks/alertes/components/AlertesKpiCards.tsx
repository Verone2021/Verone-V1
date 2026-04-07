import { AlertTriangle, Bell, Info, XCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';

interface AlertStats {
  total: number;
  unacknowledged: number;
  critical: number;
  warning: number;
  info: number;
  inDraft: number;
}

export function AlertesKpiCards({ alertStats }: { alertStats: AlertStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-black">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Alertes Actives
          </CardTitle>
          <Bell className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">
            {alertStats.unacknowledged}
          </div>
          <p className="text-xs text-gray-600">sur {alertStats.total} total</p>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Critique
          </CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {alertStats.critical}
          </div>
          <p className="text-xs text-gray-600">action immédiate requise</p>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Avertissement
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-black" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">
            {alertStats.warning}
          </div>
          <p className="text-xs text-gray-600">surveillance requise</p>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Information
          </CardTitle>
          <Info className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {alertStats.info}
          </div>
          <p className="text-xs text-gray-600">informations système</p>
        </CardContent>
      </Card>
    </div>
  );
}
