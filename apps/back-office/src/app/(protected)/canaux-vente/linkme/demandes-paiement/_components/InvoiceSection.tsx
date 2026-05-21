'use client';

import { useState } from 'react';

import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';

import { Card } from '@verone/ui';

import { formatDate } from './helpers';
import type { PaymentRequestStatus } from './types';

interface InvoiceSectionProps {
  requestId: string;
  invoiceReceived: boolean;
  invoiceFileName: string | null;
  invoiceReceivedAt: string | null;
  financialDocumentId: string | null;
  status: PaymentRequestStatus;
  onUploadClick: () => void;
}

export function InvoiceSection({
  requestId,
  invoiceReceived,
  invoiceFileName,
  invoiceReceivedAt,
  financialDocumentId,
  status,
  onUploadClick,
}: InvoiceSectionProps) {
  const [invoiceUrlLoading, setInvoiceUrlLoading] = useState(false);

  return (
    <Card className="p-4 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-5 w-5 text-gray-500" />
        <h2 className="text-base font-semibold text-gray-900">
          Facture de l&apos;affilié
        </h2>
      </div>

      {invoiceReceived ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Reçue
            </span>
            <span className="text-gray-700">
              {invoiceFileName ?? 'facture.pdf'}
            </span>
            {invoiceReceivedAt && (
              <span className="text-xs text-gray-500">
                le {formatDate(invoiceReceivedAt)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={invoiceUrlLoading}
              onClick={() => {
                setInvoiceUrlLoading(true);
                fetch(`/api/linkme/invoices/${requestId}/signed-url`)
                  .then(r => r.json() as Promise<{ signedUrl?: string }>)
                  .then(body => {
                    if (body.signedUrl) {
                      window.open(body.signedUrl, '_blank', 'noopener');
                    }
                  })
                  .catch(err => {
                    console.error('[InvoiceSection] signed url:', err);
                  })
                  .finally(() => setInvoiceUrlLoading(false));
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {invoiceUrlLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Télécharger
            </button>
            {status !== 'paid' && (
              <button
                type="button"
                onClick={onUploadClick}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                Remplacer
              </button>
            )}
          </div>
          {financialDocumentId && (
            <p className="text-xs text-gray-500">
              Cette facture a généré{' '}
              <Link
                href={`/finance/depenses/${financialDocumentId}`}
                className="text-blue-600 hover:underline"
              >
                une dépense en compta
              </Link>
              .
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Aucune facture déposée pour le moment. Si l&apos;affilié t&apos;a
            envoyé sa facture par email, dépose-la manuellement ici.
          </p>
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Déposer la facture (cas email)
          </button>
        </div>
      )}
    </Card>
  );
}
