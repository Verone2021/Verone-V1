'use client';

import { useState } from 'react';

import {
  Banknote,
  Download,
  FileText,
  Inbox,
  Loader2,
  Mail,
  User,
} from 'lucide-react';
import Link from 'next/link';

import { Card } from '@verone/ui';

import { formatCurrency, formatDate, generateMailtoLink } from './helpers';
import { StatusBadge } from './StatusBadge';
import { type PaymentRequestAdmin } from './types';

// Bouton téléchargement facture via signed URL (généré à la demande)
function InvoiceDownloadButton({ requestId }: { requestId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = () => {
    setIsLoading(true);
    void fetch(`/api/linkme/invoices/${requestId}/signed-url`)
      .then(async res => {
        if (!res.ok) throw new Error('Lien indisponible');
        const body = (await res.json()) as { signedUrl: string };
        window.open(body.signedUrl, '_blank', 'noopener,noreferrer');
      })
      .catch(() => {
        // Silencieux — l'utilisateur verra que rien ne s'ouvre
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
      title="Télécharger la facture"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </button>
  );
}

interface PaymentRequestsTableProps {
  requests: PaymentRequestAdmin[] | undefined;
  isLoading: boolean;
  onMarkAsPaid: (request: PaymentRequestAdmin) => void;
}

export function PaymentRequestsTable({
  requests,
  isLoading,
  onMarkAsPaid,
}: PaymentRequestsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Inbox className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune demande
        </h3>
        <p className="text-sm text-gray-500">
          Les demandes de versement des affiliés apparaîtront ici.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Demande
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Affilié
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Date
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Montant TTC
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Statut
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {requests.map(request => (
            <tr key={request.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link
                  href={`/canaux-vente/linkme/demandes-paiement/${request.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {request.requestNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-100 rounded-lg">
                    <User className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {request.affiliateName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.affiliateEmail}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatDate(request.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(request.totalAmountTTC)}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={request.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  {request.affiliateEmail && (
                    <a
                      href={generateMailtoLink(request)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors"
                      title={`Envoyer email à ${request.affiliateName}`}
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}

                  {request.invoiceReceived && (
                    <>
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-100 rounded-full"
                        title="Facture déposée"
                      >
                        <FileText className="h-3 w-3" />
                        Facture reçue
                      </span>
                      <InvoiceDownloadButton requestId={request.id} />
                    </>
                  )}

                  {request.invoiceReceived && request.status === 'pending' && (
                    <button
                      onClick={() => onMarkAsPaid(request)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Marquer comme payé"
                    >
                      <Banknote className="h-4 w-4" />
                    </button>
                  )}

                  {request.status === 'paid' && request.paymentReference && (
                    <span className="text-xs text-gray-500">
                      Réf: {request.paymentReference}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
