'use client';

import { useState } from 'react';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import { formatCurrency } from './helpers';
import { useMarkAsPaid } from './hooks';
import { type PaymentRequestAdmin } from './types';

interface MarkAsPaidModalProps {
  isOpen: boolean;
  request: PaymentRequestAdmin | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function MarkAsPaidModal({
  isOpen,
  request,
  onClose,
  onSuccess,
}: MarkAsPaidModalProps) {
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      console.error('[MarkAsPaidModal] Error:', message);
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md max-h-screen md:max-h-[90vh] overflow-y-auto p-6">
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

        <div className="flex flex-col gap-2 md:flex-row md:justify-end">
          <button
            onClick={handleClose}
            className="w-full md:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              void handleSubmit().catch(err => {
                console.error('[MarkAsPaidModal] handleSubmit failed:', err);
              });
            }}
            disabled={markAsPaid.isPending}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
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
