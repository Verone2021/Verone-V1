'use client';

import { CheckCircle, Clock, Package, XCircle } from 'lucide-react';

import { useMetaCommerceStats } from '@verone/channels';
import { Card, CardContent } from '@verone/ui';

export function MetaStatsCards() {
  const { data: stats } = useMetaCommerceStats();

  const cards = [
    {
      label: 'Produits Meta',
      value: stats?.total_products ?? 0,
      icon: Package,
    },
    {
      label: 'Actifs',
      value: stats?.active_products ?? 0,
      icon: CheckCircle,
    },
    { label: 'En attente', value: stats?.pending_products ?? 0, icon: Clock },
    {
      label: 'Rejetes',
      value: stats?.rejected_products ?? 0,
      icon: XCircle,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <c.icon className="h-4 w-4" />
              {c.label}
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
