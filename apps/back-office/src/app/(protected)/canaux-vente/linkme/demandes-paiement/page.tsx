/**
 * Page Admin - Demandes de Paiement LinkMe
 *
 * Gestion des demandes de versement des affiliés :
 * - Liste de toutes les demandes
 * - Filtres par statut
 * - Actions : voir facture, marquer payé, annuler
 *
 * @module PaymentRequestsAdminPage
 * @since 2025-12-11
 */

'use client';

import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  Loader2,
  AlertCircle,
  Inbox,
  Filter,
  User,
  Mail,
} from 'lucide-react';

// Types
type PaymentRequestStatus =
  | 'pending'
  | 'invoice_received'
  | 'paid'
  | 'cancelled';

interface PaymentRequestAdmin {
  id: string;
  requestNumber: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  totalAmountHT: number;
  totalAmountTTC: number;
  status: PaymentRequestStatus;
  invoiceFileUrl: string | null;
  invoiceFileName: string | null;
  invoiceReceivedAt: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<PaymentRequestStatus, string> = {
  pending: 'En attente de facture',
  invoice_received: 'Facture reçue',
  paid: 'Payée',
  cancelled: 'Annulée',
};

const STATUS_CONFIG: Record<
  PaymentRequestStatus,
  { icon: typeof Clock; color: string; bg: string }
> = {
  pending: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
  invoice_received: {
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  paid: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  cancelled: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100' },
};

// Helper format
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Génère un lien mailto avec sujet et corps pré-remplis
 * pour contacter un affilié au sujet de sa demande de versement
 */
function generateMailtoLink(request: PaymentRequestAdmin): string {
  const subject = `Demande de versement ${request.requestNumber} - LinkMe Vérone`;

  let body = `Bonjour ${request.affiliateName},\n\n`;

  if (request.status === 'pending') {
    body += `Votre demande de versement ${request.requestNumber} est en attente de votre facture.\n\n`;
    body += `Montant de la commission : ${formatCurrency(request.totalAmountTTC)} TTC\n\n`;
    body += `Merci de nous faire parvenir votre facture pour que nous puissions procéder au règlement.\n\n`;
  } else if (request.status === 'invoice_received') {
    body += `Nous avons bien reçu votre facture pour la demande ${request.requestNumber}.\n\n`;
    body += `Montant : ${formatCurrency(request.totalAmountTTC)} TTC\n\n`;
    body += `Le paiement sera effectué dans les meilleurs délais.\n\n`;
  } else if (request.status === 'paid') {
    body += `Votre demande de versement ${request.requestNumber} a été réglée.\n\n`;
    body += `Montant versé : ${formatCurrency(request.totalAmountTTC)} TTC\n`;
    if (request.paymentReference) {
      body += `Référence de paiement : ${request.paymentReference}\n`;
    }
    body += '\n';
  }

  body += `Cordialement,\nL'équipe LinkMe Vérone`;

  return `mailto:${request.affiliateEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Type interne pour les données brutes de la requête
interface PaymentRequestRaw {
  id: string;
  request_number: string;
  affiliate_id: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  status: string;
  invoice_file_url: string | null;
  invoice_file_name: string | null;
  invoice_received_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
  linkme_affiliates: {
    display_name: string;
    email: string | null;
  } | null;
}

// Hook fetch demandes
function usePaymentRequestsAdmin(statusFilter: PaymentRequestStatus | 'all') {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin-payment-requests', statusFilter],
    queryFn: async (): Promise<PaymentRequestAdmin[]> => {
      // Note: Table linkme_payment_requests créée par migration 20251211_001
      // Les types Supabase seront mis à jour après `supabase gen types`
      const baseQuery = supabase
        .from('linkme_payment_requests' as 'linkme_affiliates') // Cast temporaire
        .select(
          `
          id,
          request_number,
          affiliate_id,
          total_amount_ht,
          total_amount_ttc,
          status,
          invoice_file_url,
          invoice_file_name,
          invoice_received_at,
          paid_at,
          payment_reference,
          created_at,
          linkme_affiliates (
            display_name,
            email
          )
        `
        )
        .order('created_at', { ascending: false });

      const query =
        statusFilter !== 'all'
          ? baseQuery.eq('status', statusFilter)
          : baseQuery;

      const { data, error } = await query;

      if (error) {
        console.error('Erreur fetch payment requests admin:', error);
        throw error;
      }

      // Cast des données avec le type attendu
      const typedData = data as unknown as PaymentRequestRaw[];

      return (typedData ?? []).map(item => {
        const affiliate = item.linkme_affiliates;
        return {
          id: item.id,
          requestNumber: item.request_number,
          affiliateId: item.affiliate_id,
          affiliateName: affiliate?.display_name || 'Affilié',
          affiliateEmail: affiliate?.email ?? '',
          totalAmountHT: item.total_amount_ht ?? 0,
          totalAmountTTC: item.total_amount_ttc ?? 0,
          status: item.status as PaymentRequestStatus,
          invoiceFileUrl: item.invoice_file_url,
          invoiceFileName: item.invoice_file_name,
          invoiceReceivedAt: item.invoice_received_at,
          paidAt: item.paid_at,
          paymentReference: item.payment_reference,
          createdAt: item.created_at,
        };
      });
    },
    staleTime: 30000,
  });
}

// Mutation marquer payé
function useMarkAsPaid() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      paymentReference,
    }: {
      requestId: string;
      paymentReference: string;
    }) => {
      // Cast temporaire en attendant supabase gen types
      const { error } = await supabase
        .from('linkme_payment_requests' as 'linkme_affiliates')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_reference: paymentReference,
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin-payment-requests'],
      });
    },
  });
}

// Badge statut
function StatusBadge({ status }: { status: PaymentRequestStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}
    >
      <Icon className="h-3 w-3" />
      {STATUS_LABELS[status]}
    </span>
  );
}

// Modal marquer payé
function MarkAsPaidModal({
  isOpen,
  request,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  request: PaymentRequestAdmin | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  const markAsPaid = useMarkAsPaid();

  const handleSubmit = async () => {
    if (!request) return;
    if (!reference.trim()) {
      setError('Veuillez saisir une référence de paiement');
      return;
    }

    try {
      await markAsPaid.mutateAsync({
        requestId: request.id,
        paymentReference: reference.trim(),
      });
      onSuccess();
      handleClose();
    } catch {
      setError('Erreur lors de la mise à jour');
    }
  };

  const handleClose = () => {
    setReference('');
    setError(null);
    onClose();
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Marquer comme payé
        </h3>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Demande : <strong>{request.requestNumber}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Affilié : <strong>{request.affiliateName}</strong>
          </p>
          <p className="text-lg font-bold text-emerald-600 mt-2">
            {formatCurrency(request.totalAmountTTC)}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Référence de paiement / virement
          </label>
          <input
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="Ex: VIR-2025-12-001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              void handleSubmit().catch(error => {
                console.error('[MarkAsPaidModal] handleSubmit failed:', error);
              });
            }}
            disabled={markAsPaid.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {markAsPaid.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirmer le paiement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentRequestsAdminPage() {
  const [statusFilter, setStatusFilter] = useState<
    PaymentRequestStatus | 'all'
  >('all');
  const [selectedRequest, setSelectedRequest] =
    useState<PaymentRequestAdmin | null>(null);

  const {
    data: requests,
    isLoading,
    refetch,
  } = usePaymentRequestsAdmin(statusFilter);

  // Stats rapides
  const stats = {
    total: requests?.length ?? 0,
    pending: requests?.filter(r => r.status === 'pending').length ?? 0,
    invoiceReceived:
      requests?.filter(r => r.status === 'invoice_received').length ?? 0,
    paid: requests?.filter(r => r.status === 'paid').length ?? 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Demandes de paiement LinkMe
          </h1>
          <p className="text-gray-500 text-sm">
            Gérez les demandes de versement des affiliés
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500 uppercase">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-orange-500 uppercase">
            En attente facture
          </p>
          <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-blue-500 uppercase">Facture reçue</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.invoiceReceived}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-emerald-500 uppercase">Payées</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={statusFilter}
          onChange={e =>
            setStatusFilter(e.target.value as PaymentRequestStatus | 'all')
          }
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente de facture</option>
          <option value="invoice_received">Facture reçue</option>
          <option value="paid">Payées</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : requests?.length === 0 ? (
        <Card className="p-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune demande
          </h3>
          <p className="text-sm text-gray-500">
            Les demandes de versement des affiliés apparaîtront ici.
          </p>
        </Card>
      ) : (
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
              {requests?.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">
                      {request.requestNumber}
                    </span>
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
                      {/* Email affilié */}
                      {request.affiliateEmail && (
                        <a
                          href={generateMailtoLink(request)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors"
                          title={`Envoyer email à ${request.affiliateName}`}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      )}

                      {/* Voir facture */}
                      {request.invoiceFileUrl && (
                        <a
                          href={request.invoiceFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir la facture"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}

                      {/* Marquer payé */}
                      {request.status === 'invoice_received' && (
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Marquer comme payé"
                        >
                          <Banknote className="h-4 w-4" />
                        </button>
                      )}

                      {/* Payé - afficher référence */}
                      {request.status === 'paid' &&
                        request.paymentReference && (
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
      )}

      {/* Modal marquer payé */}
      <MarkAsPaidModal
        isOpen={!!selectedRequest}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onSuccess={() => {
          void refetch().catch(error => {
            console.error('[DemandesPaiement] refetch failed:', error);
          });
        }}
      />
    </div>
  );
}
