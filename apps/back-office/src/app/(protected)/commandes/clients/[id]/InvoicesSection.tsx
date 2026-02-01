'use client';

import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InvoiceDetailModal } from '@verone/finance';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@verone/ui';
import {
  FileText,
  Download,
  Check,
  Send,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface InvoiceLinked {
  id: string;
  document_number: string;
  workflow_status:
    | 'synchronized'
    | 'draft_validated'
    | 'finalized'
    | 'sent'
    | 'paid';
  status: string;
  total_ttc: number;
  amount_paid: number;
  document_date: string;
  due_date: string | null;
  qonto_pdf_url: string | null;
  finalized_at: string | null;
}

interface InvoicesByOrderResponse {
  success: boolean;
  invoices?: InvoiceLinked[];
  count?: number;
  error?: string;
}

const WORKFLOW_STATUS_LABELS: Record<
  InvoiceLinked['workflow_status'],
  { label: string; color: string }
> = {
  synchronized: { label: 'Synchronisé', color: 'bg-blue-100 text-blue-700' },
  draft_validated: {
    label: 'Brouillon',
    color: 'bg-yellow-100 text-yellow-700',
  },
  finalized: { label: 'Définitif', color: 'bg-green-100 text-green-700' },
  sent: { label: 'Envoyé', color: 'bg-purple-100 text-purple-700' },
  paid: { label: 'Payé', color: 'bg-emerald-100 text-emerald-700' },
};

export function InvoicesSection({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch factures liées
  const { data, isLoading } = useQuery<InvoicesByOrderResponse>({
    queryKey: ['invoices-by-order', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/qonto/invoices/by-order/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json();
    },
  });

  // Mutation validation synchronized → draft_validated
  const validateToDraft = useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await fetch(
        `/api/qonto/invoices/${invoiceId}/validate-to-draft`,
        {
          method: 'POST',
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error ?? 'Validation failed');
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['invoices-by-order', orderId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['invoice-details', selectedInvoiceId],
      });
      setActionLoading(null);
    },
    onError: (error: Error) => {
      alert(`Erreur: ${error.message}`);
      setActionLoading(null);
    },
  });

  // Mutation finalisation draft_validated → finalized
  const finalizeWorkflow = useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await fetch(
        `/api/qonto/invoices/${invoiceId}/finalize-workflow`,
        {
          method: 'POST',
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error ?? 'Finalization failed');
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['invoices-by-order', orderId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['invoice-details', selectedInvoiceId],
      });
      setActionLoading(null);
    },
    onError: (error: Error) => {
      alert(`Erreur: ${error.message}`);
      setActionLoading(null);
    },
  });

  const invoices: InvoiceLinked[] = data?.invoices ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factures liées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Factures liées ({invoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucune facture créée pour cette commande</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map(invoice => (
              <div
                key={invoice.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {invoice.document_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(invoice.document_date).toLocaleDateString(
                        'fr-FR'
                      )}
                    </p>
                  </div>
                  <Badge
                    className={
                      WORKFLOW_STATUS_LABELS[invoice.workflow_status].color
                    }
                  >
                    {WORKFLOW_STATUS_LABELS[invoice.workflow_status].label}
                  </Badge>
                </div>

                {/* Montants */}
                <div className="flex items-center gap-4 mb-3 text-sm">
                  <span className="text-gray-600">
                    Total:{' '}
                    <span className="font-semibold">
                      {invoice.total_ttc.toFixed(2)} €
                    </span>
                  </span>
                  <span className="text-gray-600">
                    Payé:{' '}
                    <span className="font-semibold">
                      {invoice.amount_paid.toFixed(2)} €
                    </span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Bouton "Valider brouillon" si synchronized */}
                  {invoice.workflow_status === 'synchronized' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setActionLoading(invoice.id);
                        validateToDraft.mutate(invoice.id);
                      }}
                      disabled={actionLoading === invoice.id}
                    >
                      {actionLoading === invoice.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Valider brouillon
                    </Button>
                  )}

                  {/* Bouton "Finaliser" si draft_validated */}
                  {invoice.workflow_status === 'draft_validated' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setActionLoading(invoice.id);
                        finalizeWorkflow.mutate(invoice.id);
                      }}
                      disabled={actionLoading === invoice.id}
                    >
                      {actionLoading === invoice.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Finaliser (PDF)
                    </Button>
                  )}

                  {/* Bouton "Download PDF" si finalized */}
                  {invoice.workflow_status === 'finalized' &&
                    invoice.qonto_pdf_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open(
                            `/api/qonto/invoices/${invoice.id}/pdf`,
                            '_blank'
                          );
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </Button>
                    )}

                  {/* Bouton "Voir détails" - toujours visible */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedInvoiceId(invoice.id);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir détails
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de détail de facture */}
      <InvoiceDetailModal
        invoiceId={selectedInvoiceId}
        open={isDetailModalOpen}
        onOpenChange={open => {
          setIsDetailModalOpen(open);
          if (!open) setSelectedInvoiceId(null);
        }}
        onValidateToDraft={invoiceId => {
          setActionLoading(invoiceId);
          validateToDraft.mutate(invoiceId);
        }}
        onFinalize={invoiceId => {
          setActionLoading(invoiceId);
          finalizeWorkflow.mutate(invoiceId);
        }}
        isActionLoading={actionLoading === selectedInvoiceId}
      />
    </Card>
  );
}
