'use client';

import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InvoiceDetailModal } from '@verone/finance';
import { Badge, Button, Card, CardContent } from '@verone/ui';
import { FileText, Download, Check, Send, Loader2, Eye } from 'lucide-react';

interface InvoiceLinked {
  id: string;
  document_number: string;
  workflow_status:
    | 'synchronized'
    | 'draft_validated'
    | 'finalized'
    | 'sent'
    | 'paid'
    | null;
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

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

interface ApiSuccessResponse {
  success: boolean;
  message?: string;
}

const WORKFLOW_STATUS_LABELS: Record<
  NonNullable<InvoiceLinked['workflow_status']>,
  { label: string; color: string }
> = {
  synchronized: { label: 'Sync', color: 'bg-blue-100 text-blue-700' },
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

  const { data, isLoading } = useQuery<InvoicesByOrderResponse>({
    queryKey: ['invoices-by-order', orderId],
    queryFn: async (): Promise<InvoicesByOrderResponse> => {
      const res = await fetch(`/api/qonto/invoices/by-order/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json() as Promise<InvoicesByOrderResponse>;
    },
  });

  const validateToDraft = useMutation({
    mutationFn: async (invoiceId: string): Promise<ApiSuccessResponse> => {
      const res = await fetch(
        `/api/qonto/invoices/${invoiceId}/validate-to-draft`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error ?? 'Validation failed');
      }
      return res.json() as Promise<ApiSuccessResponse>;
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

  const finalizeWorkflow = useMutation({
    mutationFn: async (invoiceId: string): Promise<ApiSuccessResponse> => {
      const res = await fetch(
        `/api/qonto/invoices/${invoiceId}/finalize-workflow`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error ?? 'Finalization failed');
      }
      return res.json() as Promise<ApiSuccessResponse>;
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
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">Factures...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-gray-300" />
            <span className="text-xs text-gray-400">Aucune facture</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Factures ({invoices.length})
          </span>
        </div>

        {invoices.map(invoice => {
          const wsLabel = invoice.workflow_status
            ? WORKFLOW_STATUS_LABELS[invoice.workflow_status]
            : null;

          return (
            <div
              key={invoice.id}
              className="border rounded p-2 space-y-1.5 bg-gray-50/50"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">
                    {invoice.document_number}
                  </span>
                  {wsLabel && (
                    <Badge className={`${wsLabel.color} text-[10px] px-1 py-0`}>
                      {wsLabel.label}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-semibold">
                  {invoice.total_ttc.toFixed(2)} €
                </span>
              </div>

              {/* Amounts + date */}
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span>
                  {new Date(invoice.document_date).toLocaleDateString('fr-FR')}
                </span>
                <span>Payé : {invoice.amount_paid.toFixed(2)} €</span>
              </div>

              {/* Actions — compact row */}
              <div className="flex items-center gap-1">
                {invoice.workflow_status === 'synchronized' && (
                  <Button
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => {
                      setActionLoading(invoice.id);
                      validateToDraft.mutate(invoice.id);
                    }}
                    disabled={actionLoading === invoice.id}
                  >
                    {actionLoading === invoice.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-0.5" />
                        Valider
                      </>
                    )}
                  </Button>
                )}

                {invoice.workflow_status === 'draft_validated' && (
                  <Button
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => {
                      setActionLoading(invoice.id);
                      finalizeWorkflow.mutate(invoice.id);
                    }}
                    disabled={actionLoading === invoice.id}
                  >
                    {actionLoading === invoice.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-0.5" />
                        Finaliser
                      </>
                    )}
                  </Button>
                )}

                {invoice.workflow_status === 'finalized' &&
                  invoice.qonto_pdf_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      onClick={() => {
                        window.open(
                          `/api/qonto/invoices/${invoice.id}/pdf`,
                          '_blank'
                        );
                      }}
                    >
                      <Download className="h-3 w-3 mr-0.5" />
                      PDF
                    </Button>
                  )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] px-2 ml-auto"
                  onClick={() => {
                    setSelectedInvoiceId(invoice.id);
                    setIsDetailModalOpen(true);
                  }}
                >
                  <Eye className="h-3 w-3 mr-0.5" />
                  Détails
                </Button>
              </div>
            </div>
          );
        })}
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
