'use client';

import type { ConsultationQuote } from '@verone/consultations';
import { Badge } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { FileText, ExternalLink, Trash2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-700',
  converted: 'bg-purple-100 text-purple-700',
  superseded: 'bg-orange-100 text-orange-700',
};

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoye',
  accepted: 'Accepte',
  declined: 'Refuse',
  expired: 'Expire',
  converted: 'Converti',
  superseded: 'Remplace',
};

interface ConsultationLinkedQuotesProps {
  linkedQuotes: ConsultationQuote[];
  quotesLoading: boolean;
  onDeleteQuote: (quote: {
    id: string;
    qonto_invoice_id: string | null;
    document_number: string;
  }) => void;
}

export function ConsultationLinkedQuotes({
  linkedQuotes,
  quotesLoading,
  onDeleteQuote,
}: ConsultationLinkedQuotesProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold">Devis lies</span>
          <span className="text-xs text-gray-400">({linkedQuotes.length})</span>
        </div>

        {quotesLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
          </div>
        ) : linkedQuotes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucun devis lie a cette consultation
          </p>
        ) : (
          <div className="space-y-2">
            {linkedQuotes.map(quote => (
              <div
                key={quote.id}
                className="flex items-center justify-between p-2 rounded border border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">
                      {quote.document_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(quote.document_date).toLocaleDateString(
                        'fr-FR'
                      )}{' '}
                      —{' '}
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(quote.total_ht)}{' '}
                      HT
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      statusColors[quote.quote_status] ??
                      'bg-gray-100 text-gray-700'
                    }
                  >
                    {statusLabels[quote.quote_status] ?? quote.quote_status}
                  </Badge>
                  <ButtonUnified
                    variant="ghost"
                    size="sm"
                    title="Voir le devis (nouvel onglet)"
                    onClick={() => {
                      const targetId = quote.qonto_invoice_id ?? quote.id;
                      window.open(`/factures/devis/${targetId}`, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </ButtonUnified>
                  <ButtonUnified
                    variant="ghost"
                    size="sm"
                    title="Supprimer le devis"
                    onClick={() => onDeleteQuote(quote)}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </ButtonUnified>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
