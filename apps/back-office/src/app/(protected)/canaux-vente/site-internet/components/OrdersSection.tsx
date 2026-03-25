/**
 * OrdersSection - TEMPORAIREMENT DESACTIVE
 *
 * La table site_orders a ete droppee (migration 20260321).
 * Migration vers sales_orders prevue dans une session dediee.
 *
 * TODO (session site-internet) :
 * - Migrer vers sales_orders + channel_id filter
 * - Joindre individual_customers pour customer data
 * - Mettre a jour OrderDetailModal et OrderStatusActions
 */

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Construction } from 'lucide-react';

export function OrdersSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="h-5 w-5 text-amber-500" />
          Commandes Site Internet
        </CardTitle>
        <CardDescription>
          Section en maintenance — migration vers le nouveau systeme de
          commandes en cours. Les commandes site-internet sont visibles dans
          l&apos;onglet Commandes Vente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Cette section sera de nouveau disponible prochainement.
        </p>
      </CardContent>
    </Card>
  );
}
