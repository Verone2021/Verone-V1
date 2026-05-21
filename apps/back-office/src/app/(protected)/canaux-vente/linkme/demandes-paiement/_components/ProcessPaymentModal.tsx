'use client';

import { useRef, useState } from 'react';

import { AlertCircle, Banknote, Loader2, Paperclip, X } from 'lucide-react';

import { useAddPayment } from '../hooks/use-linkme-payments';
import { formatCurrency } from './helpers';
import type { PaymentRequestAdmin } from './types';

interface ProcessPaymentModalProps {
  isOpen: boolean;
  request: PaymentRequestAdmin | null;
  /** Somme déjà versée sur cette demande (issue de usePaymentHistory) */
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
    () => new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setProofFile(null);
    setError(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Le justificatif ne doit pas dépasser 10 Mo');
      return;
    }
    setError(null);
    setProofFile(file);
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

    await addPayment.mutateAsync({
      payment_request_id: request.id,
      amount_ttc: effectiveAmount,
      payment_reference: reference.trim(),
      payment_date: paymentDate,
      notes: notes.trim() || undefined,
      proofFile: proofFile ?? undefined,
      requestMeta: {
        totalAmountTTC: request.totalAmountTTC,
        requestNumber: request.requestNumber,
        affiliateName: request.affiliateName,
        affiliateEmail: request.affiliateEmail,
      },
    });
    onSuccess();
    handleClose();
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
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Banknote className="h-5 w-5 text-emerald-600" />
          Traiter le paiement
        </h3>

        {/* Récapitulatif */}
        <div className="mb-5 space-y-1.5 rounded-xl bg-gray-50 p-4">
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
          <div className="grid grid-cols-3 gap-2 border-t border-gray-200 pt-2 text-center">
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
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Formulaire */}
        <div className="space-y-4">
          {/* Paiement total / partiel */}
          <div>
            <label className="flex cursor-pointer items-center gap-3">
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
                <span className="font-semibold text-amber-600">
                  {formatCurrency(remainingTTC)}
                </span>
                )
              </span>
            </label>
          </div>

          {/* Montant (si partiel) */}
          {!isFullPayment && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-8 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  €
                </span>
              </div>
            </div>
          )}

          {/* Référence */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Référence de paiement / virement{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Ex: VIR-2026-05-001"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date du paiement */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date du paiement
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notes (optionnel) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
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
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {/* Justificatif PDF (optionnel) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Justificatif de paiement{' '}
              <span className="text-xs font-normal text-gray-400">
                (PDF, optionnel, max 10 Mo)
              </span>
            </label>
            {proofFile ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <Paperclip className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span className="flex-1 truncate text-sm text-emerald-800">
                  {proofFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setProofFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="flex-shrink-0 rounded p-0.5 text-emerald-600 hover:bg-emerald-100"
                  aria-label="Supprimer le justificatif"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-500 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
              >
                <Paperclip className="h-4 w-4" />
                Joindre un justificatif PDF
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col gap-2 md:flex-row md:justify-end">
          <button
            onClick={handleClose}
            className="h-11 w-full rounded-lg px-4 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 md:h-9 md:w-auto"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              void handleSubmit().catch(err => {
                const message =
                  err instanceof Error ? err.message : 'Erreur inattendue';
                console.error(
                  '[ProcessPaymentModal] handleSubmit failed:',
                  err
                );
                setError(message);
              });
            }}
            disabled={addPayment.isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 md:h-9 md:w-auto"
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
