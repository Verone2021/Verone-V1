import { Package, TrendingUp, Shield, DollarSign } from 'lucide-react';

import { Card, CardContent } from '@verone/ui';

interface KpiData {
  totalProducts: number;
  avgMargin: number;
  avgBuffer: number;
  avgCommission: number;
  productsWithPricing: number;
}

export function KpiCards({ kpis }: { kpis: KpiData }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.totalProducts}</p>
              <p className="text-sm text-gray-500">Produits</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(kpis.avgMargin * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Marge moyenne</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Shield className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(kpis.avgBuffer * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Buffer moyen</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(kpis.avgCommission * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Commission moyenne</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
