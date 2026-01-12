'use client';

/**
 * Graphique: Trésorerie 12 mois
 * Évolution de la trésorerie sur 12 mois
 *
 * @created 2026-01-12
 * @todo Intégrer avec hook useCashFlowForecast quand disponible
 */

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Wallet } from 'lucide-react';

import { CHART_CATALOG } from '../../lib/chart-catalog';

const chart = CHART_CATALOG.treasury_12m;

interface TreasuryChartProps {
  onRemove?: () => void;
}

export function TreasuryChart({ onRemove }: TreasuryChartProps) {
  // TODO: Intégrer avec useCashFlowForecast quand disponible
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">{chart.label}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Wallet className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Graphique en cours de développement
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Hook useCashFlowForecast requis
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
