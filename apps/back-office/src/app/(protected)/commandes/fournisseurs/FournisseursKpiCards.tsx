'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatCurrency } from '@verone/utils';

interface FournisseursKpiCardsProps {
  filteredStats: {
    total_orders: number;
    total_ttc: number;
    total_ht: number;
    eco_tax_total: number;
    total_tva: number;
    pending_orders: number;
    received_orders: number;
    cancelled_orders: number;
  };
}

export function FournisseursKpiCards({
  filteredStats,
}: FournisseursKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total commandes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{filteredStats.total_orders}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Chiffre d&apos;affaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(filteredStats.total_ttc)}
          </div>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            <div>HT: {formatCurrency(filteredStats.total_ht)}</div>
            {filteredStats.eco_tax_total > 0 && (
              <div className="text-amber-600">
                Éco-taxe HT: {formatCurrency(filteredStats.eco_tax_total)}
              </div>
            )}
            <div>TVA: {formatCurrency(filteredStats.total_tva)}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            En cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-700">
            {filteredStats.pending_orders}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Reçues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {filteredStats.received_orders}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Annulées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {filteredStats.cancelled_orders}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
