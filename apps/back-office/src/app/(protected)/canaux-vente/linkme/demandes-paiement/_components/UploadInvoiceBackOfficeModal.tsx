'use client';

import { useRef, useState } from 'react';

import { AlertCircle, FileText, Loader2, Upload } from 'lucide-react';

import { useUploadInvoiceAdmin } from './hooks';
import { type PaymentRequestAdmin } from './types';

interface UploadInvoiceBackOfficeModalProps {
  isOpen: boolean;
  request: PaymentRequestAdmin | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_SIZE_MB = 10;

export function UploadInvoiceBackOfficeModal({
  isOpen,
  request,
  onClose,
  onSuccess,
}: UploadInvoiceBackOfficeModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInvoice = useUploadInvoiceAdmin();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Le fichier ne doit pas dépasser ${MAX_SIZE_MB} Mo.`);
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async () => {
    if (!request || !file) return;
    setError(null);
    try {
      await uploadInvoice.mutateAsync({ requestId: request.id, file });
      onSuccess();
      handleClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur lors du dépôt de la facture.';
      setError(message);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    onClose();
  };

  if (!isOpen || !request) return null;

  const isReplacing = request.invoiceReceived;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative max-h-screen w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl md:max-h-[90vh] md:max-w-md md:rounded-2xl">
        <h3 className="mb-1 text-lg font-semibold text-gray-900">
          {isReplacing
            ? 'Remplacer la facture'
            : 'Déposer la facture (cas email)'}
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Utilise ce dépôt quand l&apos;affilié t&apos;a envoyé sa facture par
          email au lieu de la déposer lui-même.
        </p>

        <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm">
          <p className="text-gray-600">
            Demande : <strong>{request.requestNumber}</strong>
          </p>
          <p className="text-gray-600">
            Affilié : <strong>{request.affiliateName}</strong>
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Fichier PDF
          </label>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-4 text-left hover:border-blue-400 hover:bg-blue-50"
          >
            <FileText className="h-6 w-6 flex-shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {file ? file.name : 'Sélectionner un fichier PDF'}
              </p>
              <p className="text-xs text-gray-500">Maximum {MAX_SIZE_MB} Mo</p>
            </div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-lg px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 md:w-auto md:py-2"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSubmit().catch(err => {
                console.error('[UploadInvoiceBackOfficeModal]', err);
              });
            }}
            disabled={!file || uploadInvoice.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 md:w-auto md:py-2"
          >
            {uploadInvoice.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isReplacing ? 'Remplacer' : 'Déposer la facture'}
          </button>
        </div>
      </div>
    </div>
  );
}
