'use client';

import { Button } from '@verone/ui';
import { CheckCircle2, ExternalLink, Info } from 'lucide-react';

interface ICreatedInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  public_url?: string;
}

interface IInvoiceServiceSuccessViewProps {
  createdInvoice: ICreatedInvoice;
  formatAmount: (amount: number) => string;
}

export function InvoiceServiceSuccessView({
  createdInvoice,
  formatAmount,
}: IInvoiceServiceSuccessViewProps): React.ReactNode {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
        <CheckCircle2 className="h-6 w-6 text-green-600" />
        <div>
          <p className="font-medium text-green-800">
            Facture créée avec succès
          </p>
          <p className="text-sm text-green-600">
            N° {createdInvoice.invoice_number} -{' '}
            {formatAmount(createdInvoice.total_amount)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
        <Info className="h-4 w-4 shrink-0" />
        <span>
          Facture créée en brouillon. Finalisez-la sur Qonto pour générer le
          PDF.
        </span>
      </div>

      {createdInvoice.public_url && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a
              href={createdInvoice.public_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir sur Qonto
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
