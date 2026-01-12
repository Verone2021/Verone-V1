'use client';

/**
 * Graphique: Classification ABC
 * Répartition valeur stock (A: 80%, B: 15%, C: 5%)
 *
 * @created 2026-01-12
 * @todo Intégrer avec hook useABCAnalysis quand disponible
 */

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { BarChart3 } from 'lucide-react';

import { CHART_CATALOG } from '../../lib/chart-catalog';

const chart = CHART_CATALOG.abc_analysis;

interface ABCAnalysisChartProps {
  onRemove?: () => void;
}

export function ABCAnalysisChart({ onRemove }: ABCAnalysisChartProps) {
  // TODO: Intégrer avec useABCAnalysis quand disponible
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">{chart.label}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Graphique en cours de développement
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Hook useABCAnalysis requis
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
