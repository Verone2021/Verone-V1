/**
 * Page Mes Demandes de Versement - LinkMe
 *
 * Liste des demandes de versement de l'affilié avec :
 * - Statut de chaque demande
 * - Upload de facture si status = pending
 * - Détail des commissions incluses
 *
 * @module PaymentRequestsPage
 * @since 2025-12-11
 */

'use client';

import { useState, useRef } from 'react';

import Link from 'next/link';

import { Card } from '@tremor/react';
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
  Loader2,
  AlertCircle,
  Inbox,
} from 'lucide-react';

import {
  useAffiliatePaymentRequests,
  useUploadInvoice,
} from '../../../../lib/hooks/use-payment-requests';
import type {
  PaymentRequest,
  PaymentRequestStatus,
} from '../../../../types/analytics';
import {
  formatCurrency,
  formatDateFR,
  PAYMENT_REQUEST_STATUS_LABELS,
} from '../../../../types/analytics';

// Badge de statut demande
function StatusBadge({ status }: { status: PaymentRequestStatus }) {
  const config: Record<
    PaymentRequestStatus,
    { icon: typeof Clock; color: string; bg: string }
  > = {
    pending: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    invoice_received: {
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    paid: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    cancelled: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100' },
  };

  const { icon: Icon, color, bg } = config[status] || config.pending;

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full
        text-xs font-medium ${color} ${bg}
      `}
    >
      <Icon className="h-3 w-3" />
      {PAYMENT_REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

// Composant ligne de demande
function PaymentRequestRow({
  request,
  onUploadClick,
}: {
  request: PaymentRequest;
  onUploadClick: (requestId: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        {/* Infos principales */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-semibold text-gray-900">
              {request.requestNumber}
            </span>
            <StatusBadge status={request.status} />
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>
              Créée le{' '}
              {formatDateFR(request.createdAt, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            {request.invoiceReceivedAt && (
              <p>
                Facture reçue le{' '}
                {formatDateFR(request.invoiceReceivedAt, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
            {request.paidAt && (
              <p className="text-emerald-600 font-medium">
                Payée le{' '}
                {formatDateFR(request.paidAt, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
                {request.paymentReference && (
                  <span className="ml-1">
                    (Réf: {request.paymentReference})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Montant */}
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-600">
            {formatCurrency(request.totalAmountTTC)}
          </p>
          <p className="text-xs text-gray-400">TTC</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        {/* Facture uploadée */}
        {request.invoiceFileUrl ? (
          <a
            href={request.invoiceFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700"
          >
            <Download className="h-3.5 w-3.5" />
            Voir la facture
          </a>
        ) : request.status === 'pending' ? (
          <button
            onClick={() => {
              onUploadClick(request.id);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Uploader ma facture
          </button>
        ) : (
          <span className="text-xs text-gray-400">En attente de facture</span>
        )}

        {/* Paiement proof */}
        {request.status === 'paid' && request.paymentProofUrl && (
          <a
            href={request.paymentProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700"
          >
            <Eye className="h-3.5 w-3.5" />
            Justificatif paiement
          </a>
        )}
      </div>
    </div>
  );
}

// Modal upload facture
function UploadInvoiceModal({
  isOpen,
  requestId,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  requestId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadInvoice();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Seuls les fichiers PDF sont acceptés');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 5 Mo');
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !requestId) return;

    try {
      await uploadMutation.mutateAsync({
        requestId,
        file: selectedFile,
      });
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Uploader ma facture
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          {selectedFile ? (
            <div className="space-y-2">
              <FileText className="h-10 w-10 mx-auto text-blue-600" />
              <p className="text-sm font-medium text-gray-900">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-10 w-10 mx-auto text-gray-400" />
              <p className="text-sm text-gray-600">
                Cliquez pour sélectionner votre facture PDF
              </p>
              <p className="text-xs text-gray-400">Max 5 Mo</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              void handleUpload().catch(error => {
                console.error('[UploadInvoiceModal] Upload failed:', error);
                setError("Erreur lors de l'upload");
              });
            }}
            disabled={!selectedFile || uploadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Envoyer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentRequestsPage() {
  const [uploadModalRequestId, setUploadModalRequestId] = useState<
    string | null
  >(null);

  const { data: requests, isLoading, refetch } = useAffiliatePaymentRequests();

  // Grouper par statut pour affichage
  const groupedRequests = {
    active:
      requests?.filter(
        r => r.status === 'pending' || r.status === 'invoice_received'
      ) ?? [],
    paid: requests?.filter(r => r.status === 'paid') ?? [],
    cancelled: requests?.filter(r => r.status === 'cancelled') ?? [],
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/commissions"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Mes demandes de versement
            </h1>
            <p className="text-gray-500 text-sm">
              Suivez l&apos;état de vos demandes de paiement
            </p>
          </div>
        </div>

        <Link
          href="/commissions"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Banknote className="h-4 w-4" />
          Nouvelle demande
        </Link>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : requests?.length === 0 ? (
        /* Empty state */
        <Card className="p-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune demande de versement
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Sélectionnez des commissions validées pour créer votre première
            demande.
          </p>
          <Link
            href="/commissions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Banknote className="h-4 w-4" />
            Aller aux commissions
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Demandes actives */}
          {groupedRequests.active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                En cours ({groupedRequests.active.length})
              </h2>
              <div className="space-y-3">
                {groupedRequests.active.map(request => (
                  <PaymentRequestRow
                    key={request.id}
                    request={request}
                    onUploadClick={setUploadModalRequestId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Demandes payées */}
          {groupedRequests.paid.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Payées ({groupedRequests.paid.length})
              </h2>
              <div className="space-y-3">
                {groupedRequests.paid.map(request => (
                  <PaymentRequestRow
                    key={request.id}
                    request={request}
                    onUploadClick={setUploadModalRequestId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Demandes annulées */}
          {groupedRequests.cancelled.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Annulées ({groupedRequests.cancelled.length})
              </h2>
              <div className="space-y-3 opacity-60">
                {groupedRequests.cancelled.map(request => (
                  <PaymentRequestRow
                    key={request.id}
                    request={request}
                    onUploadClick={setUploadModalRequestId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal upload */}
      <UploadInvoiceModal
        isOpen={!!uploadModalRequestId}
        requestId={uploadModalRequestId}
        onClose={() => setUploadModalRequestId(null)}
        onSuccess={() => {
          void refetch().catch(error => {
            console.error('[PaymentRequests] Refetch failed:', error);
          });
        }}
      />
    </div>
  );
}
