'use client';

import { Button } from '@verone/ui';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileEdit,
  Send,
} from 'lucide-react';

import type { ICreatedQuote } from './types';
import { formatAmount } from './quote-utils';

interface IQuoteSuccessViewProps {
  createdQuote: ICreatedQuote;
  onDownloadPdf: () => void;
  onFinalize: () => void;
  onConvertToInvoice: () => void;
}

export function QuoteSuccessView({
  createdQuote,
  onDownloadPdf,
  onFinalize,
  onConvertToInvoice,
}: IQuoteSuccessViewProps): React.ReactNode {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
        <CheckCircle2 className="h-6 w-6 text-green-600" />
        <div>
          <p className="font-medium text-green-800">Devis créé en brouillon</p>
          <p className="text-sm text-green-600">
            N° {createdQuote.quote_number} -{' '}
            {formatAmount(createdQuote.total_amount)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={onDownloadPdf}
          disabled={!createdQuote.pdf_url}
        >
          <Download className="mr-2 h-4 w-4" />
          Télécharger PDF
        </Button>

        {createdQuote.status === 'draft' && (
          <Button variant="default" onClick={onFinalize}>
            <Send className="mr-2 h-4 w-4" />
            Finaliser le devis
          </Button>
        )}

        {createdQuote.status === 'finalized' && (
          <Button variant="default" onClick={onConvertToInvoice}>
            <FileEdit className="mr-2 h-4 w-4" />
            Convertir en facture
          </Button>
        )}

        {createdQuote.public_url && (
          <Button variant="outline" asChild>
            <a
              href={createdQuote.public_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir sur Qonto
            </a>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-1 border-t pt-3 text-sm">
        <a
          href={`/factures/devis/${createdQuote.id}`}
          className="text-blue-600 hover:underline"
        >
          Voir le détail du devis
        </a>
        <a href="/factures?tab=devis" className="text-blue-600 hover:underline">
          Voir tous les devis
        </a>
      </div>
    </div>
  );
}
