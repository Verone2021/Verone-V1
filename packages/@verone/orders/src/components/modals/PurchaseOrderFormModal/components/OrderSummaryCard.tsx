'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatCurrency } from '@verone/utils';

interface OrderSummaryCardProps {
  totalHT: number;
  totalCharges: number;
  totalTTC: number;
}

export function OrderSummaryCard({
  totalHT,
  totalCharges,
  totalTTC,
}: OrderSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Récapitulatif</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total HT produits</p>
            <p className="text-lg font-semibold">{formatCurrency(totalHT)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Frais additionnels</p>
            <p className="text-lg font-semibold">
              {formatCurrency(totalCharges)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">TVA (20%)</p>
            <p className="text-lg font-semibold">
              {formatCurrency(totalTTC - totalHT - totalCharges)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total TTC</p>
            <p className="text-xl font-bold">{formatCurrency(totalTTC)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
