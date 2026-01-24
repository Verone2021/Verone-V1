'use client';

/**
 * Widget: Activité récente
 * Affiche les 10 dernières actions utilisateurs
 *
 * @created 2026-01-12
 * @todo Intégrer avec hook useRecentActivity quand disponible
 */

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Activity } from 'lucide-react';

const widget = {
  label: 'Activité récente',
  icon: Activity,
};

interface RecentActivityWidgetProps {
  onRemove?: () => void;
}

export function RecentActivityWidget({ onRemove }: RecentActivityWidgetProps) {
  // TODO: Intégrer avec useRecentActivity quand disponible
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">{widget.label}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Widget en cours de développement
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Hook useRecentActivity requis
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
