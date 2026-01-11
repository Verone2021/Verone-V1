/**
 * PaymentRequestsPanel
 * Panel compact des demandes de versement pour intégration dans la page commissions
 *
 * @module PaymentRequestsPanel
 * @since 2026-01-10
 */

'use client';

import { useState, useRef } from 'react';

import { Card } from '@tremor/react';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Inbox,
  ChevronRight,
} from 'lucide-react';

import {
  useAffiliatePaymentRequests,
  useUploadInvoice,
} from '../../lib/hooks/use-payment-requests';
import type {
  PaymentRequest,
  PaymentRequestStatus,
} from '../../types/analytics';
import {
  formatCurrency,
  formatDateFR,
  PAYMENT_REQUEST_STATUS_LABELS,
} from '../../types/analytics';

// Badge de statut compact
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
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
        text-[10px] font-medium ${color} ${bg}
      `}
    >
      <Icon className="h-2.5 w-2.5" />
      {PAYMENT_REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

// Ligne de demande compacte
function CompactRequestRow({
  request,
  onUploadClick,
}: {
  request: PaymentRequest;
  onUploadClick: (requestId: string) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-900">
          {request.requestNumber}
        </span>
        <StatusBadge status={request.status} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500">
          {formatDateFR(request.createdAt, {
            day: '2-digit',
            month: 'short',
          })}
        </span>
        <span className="text-sm font-bold text-emerald-600">
          {formatCurrency(request.totalAmountTTC)}
        </span>
      </div>

      {/* Action upload si pending */}
      {request.status === 'pending' && !request.invoiceFileUrl && (
        <button
          onClick={() => onUploadClick(request.id)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          <Upload className="h-3 w-3" />
          Uploader facture
        </button>
      )}

      {/* Lien facture si existe */}
      {request.invoiceFileUrl && (
        <a
          href={request.invoiceFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
        >
          <Download className="h-3 w-3" />
          Voir facture
        </a>
      )}

      {/* Lien preuve paiement si payé */}
      {request.status === 'paid' && request.paymentProofUrl && (
        <a
          href={request.paymentProofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
        >
          <Eye className="h-3 w-3" />
          Justificatif
        </a>
      )}
    </div>
  );
}

// Modal upload facture (même que dans demandes/page.tsx)
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
            onClick={handleUpload}
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

interface PaymentRequestsPanelProps {
  className?: string;
}

export function PaymentRequestsPanel({ className }: PaymentRequestsPanelProps) {
  const [uploadModalRequestId, setUploadModalRequestId] = useState<
    string | null
  >(null);
  const [showAll, setShowAll] = useState(false);

  const { data: requests, isLoading, refetch } = useAffiliatePaymentRequests();

  // Trier par date et limiter l'affichage
  const sortedRequests = [...(requests || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const displayedRequests = showAll
    ? sortedRequests
    : sortedRequests.slice(0, 3);
  const hasMore = sortedRequests.length > 3;

  // Stats rapides
  const activeCount =
    requests?.filter(
      r => r.status === 'pending' || r.status === 'invoice_received'
    ).length || 0;
  const totalPending =
    requests
      ?.filter(r => r.status === 'pending' || r.status === 'invoice_received')
      .reduce((sum, r) => sum + r.totalAmountTTC, 0) || 0;

  return (
    <Card className={`p-0 overflow-hidden ${className || ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Mes Demandes</h3>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-medium text-indigo-700 bg-indigo-100 rounded-full">
              {activeCount} en cours
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            En attente :{' '}
            <span className="font-semibold text-emerald-600">
              {formatCurrency(totalPending)}
            </span>
          </p>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
        ) : sortedRequests.length === 0 ? (
          <div className="text-center py-6">
            <Inbox className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-500">Aucune demande de versement</p>
            <p className="text-[10px] text-gray-400 mt-1">
              Sélectionnez des commissions payables pour créer une demande
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedRequests.map(request => (
              <CompactRequestRow
                key={request.id}
                request={request}
                onUploadClick={setUploadModalRequestId}
              />
            ))}

            {/* Voir plus/moins */}
            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full flex items-center justify-center gap-1 py-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {showAll
                  ? 'Voir moins'
                  : `Voir tout (${sortedRequests.length})`}
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${showAll ? 'rotate-90' : ''}`}
                />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal upload */}
      <UploadInvoiceModal
        isOpen={!!uploadModalRequestId}
        requestId={uploadModalRequestId}
        onClose={() => setUploadModalRequestId(null)}
        onSuccess={() => refetch()}
      />
    </Card>
  );
}

export default PaymentRequestsPanel;
