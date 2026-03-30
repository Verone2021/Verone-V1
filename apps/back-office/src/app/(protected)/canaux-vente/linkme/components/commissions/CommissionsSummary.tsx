'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';

interface CommissionsSummaryProps {
  pending: number;
  validated: number;
  paid: number;
}

function formatAmount(amount: number) {
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
}

export function CommissionsSummary({
  pending,
  validated,
  paid,
}: CommissionsSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            En attente de validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatAmount(pending)} €
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Validées (à payer)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatAmount(validated)} €
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total payé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatAmount(paid)} €
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
