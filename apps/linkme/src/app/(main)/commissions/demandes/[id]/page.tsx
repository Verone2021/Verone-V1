'use client';

import { useRef, useState } from 'react';

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Card } from '@tremor/react';

import {
  usePaymentRequestDetail,
  useUploadInvoice,
} from '../../../../../lib/hooks/use-payment-requests';
import type { PaymentRequestStatus } from '../../../../../types/analytics';
import {
  formatCurrency,
  formatDateFR,
  PAYMENT_REQUEST_STATUS_LABELS,
} from '../../../../../types/analytics';

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

  const { icon: Icon, color, bg } = config[status] ?? config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color} ${bg}`}
    >
      <Icon className="h-3 w-3" />
      {PAYMENT_REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

function UploadInvoiceModal({
  isOpen,
  requestId,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  requestId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadMutation = useUploadInvoice();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadError('Seuls les fichiers PDF sont acceptés');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Le fichier ne doit pas dépasser 5 Mo');
      return;
    }
    setUploadError(null);
    setSelectedFile(file);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Uploader ma facture
        </h3>

        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {uploadError}
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
              if (!selectedFile) return;
              void uploadMutation
                .mutateAsync({ requestId, file: selectedFile })
                .then(() => {
                  onSuccess();
                  handleClose();
                })
                .catch(err => {
                  setUploadError(
                    err instanceof Error
                      ? err.message
                      : "Erreur lors de l'upload"
                  );
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

export default function PaymentRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: request, isLoading, refetch } = usePaymentRequestDetail(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-4">
        <Link
          href="/commissions/demandes"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux demandes
        </Link>
        <Card className="p-12 text-center">
          <p className="text-red-600">Demande introuvable.</p>
        </Card>
      </div>
    );
  }

  const totalPayoutTTC = request.commissions.reduce(
    (s, c) => s + c.totalPayoutTTC,
    0
  );

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/commissions/demandes"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">
              {request.requestNumber}
            </h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Créée le{' '}
            {formatDateFR(request.createdAt, {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Cards info */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Montant total TTC</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(request.totalAmountTTC)}
            </p>
            <p className="text-xs text-gray-400">
              HT : {formatCurrency(request.totalAmountHT)}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Commandes incluses</p>
            <p className="text-lg font-bold text-gray-900">
              {request.commissions.length}
            </p>
            <p className="text-xs text-gray-400">
              Total rémunérations : {formatCurrency(totalPayoutTTC)}
            </p>
          </div>
        </Card>
      </div>

      {/* Statut payé */}
      {request.status === 'paid' && (
        <Card className="p-4 border-l-4 border-emerald-400 bg-emerald-50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                Paiement reçu
                {request.paidAt &&
                  ` le ${formatDateFR(request.paidAt, { day: '2-digit', month: 'long', year: 'numeric' })}`}
              </p>
              {request.paymentReference && (
                <p className="text-xs text-emerald-700 mt-0.5">
                  Référence : {request.paymentReference}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Action : upload facture */}
      {request.status === 'pending' && (
        <Card className="p-4 border-l-4 border-orange-400 bg-orange-50">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Facture attendue
                </p>
                <p className="text-xs text-orange-700 mt-0.5">
                  Uploadez votre facture pour déclencher le paiement.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex-shrink-0"
            >
              <Upload className="h-4 w-4" />
              Uploader ma facture
            </button>
          </div>
        </Card>
      )}

      {/* Facture déjà uploadée */}
      {request.invoiceFileUrl && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-blue-800 font-medium">
              {request.invoiceFileName ?? 'Facture PDF'}
            </span>
          </div>
          <a
            href={request.invoiceFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger
          </a>
        </div>
      )}

      {/* Tableau des commissions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-gray-400" />
            Commandes incluses ({request.commissions.length})
          </h2>
        </div>

        {request.commissions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Aucune commande liée à cette demande.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {request.commissions.map(commission => (
              <div key={commission.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {commission.orderNumber}
                    </p>
                    {commission.selectionName && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {commission.selectionName}
                      </p>
                    )}
                    {commission.orderDate && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDateFR(commission.orderDate, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(commission.totalPayoutTTC)}
                    </p>
                    <p className="text-xs text-gray-400">TTC</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        {request.commissions.length > 0 && (
          <div className="px-4 py-3 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Total rémunérations
            </span>
            <span className="text-sm font-bold text-emerald-700">
              {formatCurrency(totalPayoutTTC)} TTC
            </span>
          </div>
        )}
      </div>

      {/* Modal upload */}
      {showUploadModal && (
        <UploadInvoiceModal
          isOpen={showUploadModal}
          requestId={id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            void refetch().catch(err =>
              console.error('[PaymentRequestDetail] refetch failed:', err)
            );
          }}
        />
      )}
    </div>
  );
}
