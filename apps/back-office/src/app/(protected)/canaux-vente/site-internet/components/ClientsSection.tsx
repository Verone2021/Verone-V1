/**
 * ClientsSection - TEMPORAIREMENT DESACTIVE
 *
 * Dependait de site_orders (droppee). A migrer vers individual_customers.
 * TODO (session site-internet)
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

export function ClientsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="h-5 w-5 text-amber-500" />
          Clients Site Internet
        </CardTitle>
        <CardDescription>
          Section en maintenance — migration en cours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Les clients sont accessibles via la section Clients principale.
        </p>
      </CardContent>
    </Card>
  );
}
