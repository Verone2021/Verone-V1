'use client';

/**
 * Widget: Top produits
 * Affiche les 5 produits les plus vendus du mois
 *
 * @created 2026-01-12
 * @todo Intégrer avec hook useTopProducts quand la signature sera corrigée
 */

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { TrendingUp } from 'lucide-react';

const widget = {
  label: 'Top produits',
  icon: TrendingUp,
};

interface TopProductsWidgetProps {
  onRemove?: () => void;
}

export function TopProductsWidget({ onRemove }: TopProductsWidgetProps) {
  // TODO: Intégrer avec useTopProducts quand disponible
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">{widget.label}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Widget en cours de développement
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Hook useTopProducts requis
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
