'use client';

import { useState } from 'react';

import { AlertCircle, Banknote, Loader2 } from 'lucide-react';

import { useAddPayment } from '../../hooks/use-payment-requests-admin';
import { formatCurrency } from './helpers';
import type { PaymentRequestAdmin } from './types';

interface ProcessPaymentModalProps {
  isOpen: boolean;
  request: PaymentRequestAdmin | null;
  alreadyPaidTTC: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProcessPaymentModal({
  isOpen,
  request,
  alreadyPaidTTC,
  onClose,
  onSuccess,
}: ProcessPaymentModalProps) {
  const remainingTTC = request
    ? Math.max(0, request.totalAmountTTC - alreadyPaidTTC)
    : 0;

  const [isFullPayment, setIsFullPayment] = useState(true);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addPayment = useAddPayment();

  const effectiveAmount = isFullPayment
    ? remainingTTC
    : parseFloat(amount.replace(',', '.'));

  const handleClose = () => {
    setIsFullPayment(true);
    setAmount('');
    setReference('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!request) return;

    setError(null);

    if (!reference.trim()) {
      setError('Veuillez saisir une référence de paiement');
      return;
    }
    if (!paymentDate) {
      setError('Veuillez saisir une date de paiement');
      return;
    }
    if (!isFullPayment) {
      const parsed = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsed) || parsed <= 0) {
        setError('Le montant doit être supérieur à 0');
        return;
      }
      if (parsed > remainingTTC + 0.005) {
        setError(
          `Le montant ne peut pas dépasser le restant dû (${formatCurrency(remainingTTC)})`
        );
        return;
      }
    }

    try {
      await addPayment.mutateAsync({
        payment_request_id: request.id,
        amount_ttc: effectiveAmount,
        payment_reference: reference.trim(),
        payment_date: paymentDate,
        notes: notes.trim() || undefined,
        // TODO Phase 5: notifier l'affilié si la demande est soldée (trigger recalcule statut → paid)
      });
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      console.error('[ProcessPaymentModal] submit error:', message);
      setError(message);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md max-h-screen md:max-h-[90vh] overflow-y-auto p-6">
        {/* Titre */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Banknote className="h-5 w-5 text-emerald-600" />
          Traiter le paiement
        </h3>

        {/* Récapitulatif demande */}
        <div className="mb-5 p-4 bg-gray-50 rounded-xl space-y-1.5">
          <p className="text-sm text-gray-600">
            Demande :{' '}
            <span className="font-semibold text-gray-900">
              {request.requestNumber}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Affilié :{' '}
            <span className="font-medium text-gray-800">
              {request.affiliateName}
            </span>
          </p>
          <div className="pt-2 border-t border-gray-200 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-400">Total TTC</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(request.totalAmountTTC)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Déjà payé</p>
              <p className="text-sm font-semibold text-emerald-600">
                {formatCurrency(alreadyPaidTTC)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Restant</p>
              <p className="text-sm font-bold text-amber-600">
                {formatCurrency(remainingTTC)}
              </p>
            </div>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Formulaire */}
        <div className="space-y-4">
          {/* Paiement total / partiel */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFullPayment}
                onChange={e => {
                  setIsFullPayment(e.target.checked);
                  setAmount('');
                }}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Paiement de la totalité (
                <span className="text-amber-600 font-semibold">
                  {formatCurrency(remainingTTC)}
                </span>
                )
              </span>
            </label>
          </div>

          {/* Montant (si partiel) */}
          {!isFullPayment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant TTC à verser
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  max={remainingTTC}
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={`Max ${formatCurrency(remainingTTC)}`}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  €
                </span>
              </div>
            </div>
          )}

          {/* Référence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence de paiement / virement{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Ex: VIR-2026-05-001"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Date du paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date du paiement
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Notes (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes{' '}
              <span className="text-xs font-normal text-gray-400">
                (optionnel)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Observations..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
            />
          </div>
          {/* Note: pas de champ URL justificatif ni d'upload dans cette version.
              L'upload de preuve sera ajouté en Phase suivante. */}
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col gap-2 md:flex-row md:justify-end">
          <button
            onClick={handleClose}
            className="w-full md:w-auto h-11 md:h-9 px-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              void handleSubmit().catch(err => {
                console.error(
                  '[ProcessPaymentModal] handleSubmit failed:',
                  err
                );
              });
            }}
            disabled={addPayment.isPending}
            className="w-full md:w-auto h-11 md:h-9 flex items-center justify-center gap-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {addPayment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <Banknote className="h-4 w-4" />
                Enregistrer le paiement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
