'use client';

/**
 * Widget: Factures impayées
 * Affiche les factures en attente de paiement
 *
 * @created 2026-01-12
 * @todo Intégrer avec hook useInvoices quand disponible
 */

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { FileText } from 'lucide-react';

import { WIDGET_CATALOG } from '../../lib/widget-catalog';

const widget = WIDGET_CATALOG.unpaid_invoices;

interface UnpaidInvoicesWidgetProps {
  onRemove?: () => void;
}

export function UnpaidInvoicesWidget({ onRemove }: UnpaidInvoicesWidgetProps) {
  // TODO: Intégrer avec useInvoices quand disponible
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">{widget.label}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Widget en cours de développement
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Hook useInvoices requis
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
