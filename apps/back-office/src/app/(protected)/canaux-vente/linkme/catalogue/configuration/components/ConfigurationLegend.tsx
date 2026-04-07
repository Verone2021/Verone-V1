import { TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';

import { Card, CardContent } from '@verone/ui';

export function ConfigurationLegend() {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded" />
            <span>Modification en attente</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>Marge &gt; 15%</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-amber-500" />
            <span>Marge 0-15%</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span>Marge négative</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-600" />
            <span>Buffer = Marge de sécurité (5-10%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
