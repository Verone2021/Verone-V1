/**
 * PaymentRequestModal
 * Modal pour créer une demande de versement des commissions
 *
 * Étapes :
 * 1. Récapitulatif des commissions sélectionnées
 * 2. Aperçu du modèle de facture pré-rempli
 * 3. Upload de la facture PDF (optionnel au moment de la création)
 * 4. Confirmation et envoi de la demande
 *
 * @module PaymentRequestModal
 * @since 2025-12-11
 */

'use client';

import { useState, useMemo, useCallback } from 'react';

import {
  X,
  FileText,
  Upload as _Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Banknote,
  Eye,
} from 'lucide-react';

import { InvoiceTemplate } from './InvoiceTemplate';
import { useCreatePaymentRequest } from '../../lib/hooks/use-payment-requests';
import { useUserAffiliate } from '../../lib/hooks/use-user-selection';
import type {
  CommissionItem,
  AffiliateInvoiceInfo,
} from '../../types/analytics';
import { formatCurrency } from '../../types/analytics';

interface PaymentRequestModalProps {
  /** Ouvrir/fermer la modal */
  isOpen: boolean;
  /** Callback fermeture */
  onClose: () => void;
  /** Commissions sélectionnées pour la demande */
  selectedCommissions: CommissionItem[];
  /** Callback succès (optionnel) */
  onSuccess?: () => void;
}

type Step = 'recap' | 'template' | 'confirm';

export function PaymentRequestModal({
  isOpen,
  onClose,
  selectedCommissions,
  onSuccess,
}: PaymentRequestModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('recap');
  const [error, setError] = useState<string | null>(null);

  // Données affilié
  const { data: affiliate } = useUserAffiliate();

  // Mutation création
  const createMutation = useCreatePaymentRequest();

  // Calculs des totaux
  const totals = useMemo(() => {
    const totalHT = selectedCommissions.reduce(
      (sum, c) => sum + (c.affiliateCommission || 0),
      0
    );
    const totalTTC = selectedCommissions.reduce(
      (sum, c) => sum + (c.affiliateCommissionTTC || 0),
      0
    );
    return { totalHT, totalTTC, count: selectedCommissions.length };
  }, [selectedCommissions]);

  // Info affilié pour le template
  const affiliateInfo: AffiliateInvoiceInfo = useMemo(
    () => ({
      name: affiliate?.display_name ?? 'Affilié',
      email: affiliate?.email ?? '',
      address: undefined, // L'affilié devra compléter
      siret: undefined,
      tvaNumber: undefined,
      iban: undefined,
      bic: undefined,
    }),
    [affiliate]
  );

  // Navigation étapes
  const goToStep = useCallback((step: Step) => {
    setError(null);
    setCurrentStep(step);
  }, []);

  // Soumettre la demande
  const handleSubmit = async () => {
    if (selectedCommissions.length === 0) {
      setError('Aucune commission sélectionnée');
      return;
    }

    try {
      setError(null);
      await createMutation.mutateAsync({
        commissionIds: selectedCommissions.map(c => c.id),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la création'
      );
    }
  };

  // Reset à la fermeture
  const handleClose = () => {
    setCurrentStep('recap');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Banknote className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Demande de versement
              </h2>
              <p className="text-sm text-gray-500">
                {totals.count} commission{totals.count > 1 ? 's' : ''} -{' '}
                {formatCurrency(totals.totalTTC)} TTC
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-center gap-2">
            {[
              { key: 'recap', label: 'Récapitulatif', icon: FileText },
              { key: 'template', label: 'Modèle facture', icon: Eye },
              { key: 'confirm', label: 'Confirmation', icon: CheckCircle2 },
            ].map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.key;
              const isPast =
                (currentStep === 'template' && step.key === 'recap') ||
                (currentStep === 'confirm' &&
                  (step.key === 'recap' || step.key === 'template'));

              return (
                <div key={step.key} className="flex items-center">
                  {idx > 0 && (
                    <div
                      className={`w-8 h-0.5 mx-1 ${isPast || isActive ? 'bg-blue-400' : 'bg-gray-300'}`}
                    />
                  )}
                  <button
                    onClick={() => goToStep(step.key as Step)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                      transition-all
                      ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : isPast
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    <StepIcon className="h-3.5 w-3.5" />
                    {step.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Étape 1: Récapitulatif */}
          {currentStep === 'recap' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <h3 className="text-sm font-semibold text-emerald-800 mb-3">
                  Commissions à verser
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCommissions.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          #{c.orderNumber}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {c.selectionName}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(c.affiliateCommissionTTC)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-emerald-800">
                    Total TTC à percevoir
                  </span>
                  <span className="text-xl font-bold text-emerald-600">
                    {formatCurrency(totals.totalTTC)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">
                  Prochaines étapes
                </h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Consultez le modèle de facture pré-rempli</li>
                  <li>
                    Créez votre facture (PDF) avec vos informations complètes
                  </li>
                  <li>Soumettez votre demande de versement</li>
                  <li>
                    Uploadez votre facture PDF (depuis &quot;Mes demandes&quot;)
                  </li>
                  <li>Recevez le paiement par virement</li>
                </ol>
              </div>
            </div>
          )}

          {/* Étape 2: Modèle de facture */}
          {currentStep === 'template' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Important :</strong> Ce modèle est fourni à titre
                  indicatif. Complétez-le avec vos informations légales
                  (adresse, SIRET si applicable, IBAN) et générez votre propre
                  facture PDF.
                </p>
              </div>

              <InvoiceTemplate
                affiliate={affiliateInfo}
                commissions={selectedCommissions}
                showActions
              />
            </div>
          )}

          {/* Étape 3: Confirmation */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 text-center border border-indigo-200">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmer la demande de versement
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Une fois la demande créée, vous pourrez uploader votre facture
                  PDF depuis la page &quot;Mes demandes&quot;.
                </p>
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <span className="text-gray-600">Montant total TTC :</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(totals.totalTTC)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-800 mb-2">
                  En confirmant, vous certifiez que :
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Les commissions listées correspondent bien à des ventes
                    validées
                  </li>
                  <li>
                    Vous fournirez une facture conforme aux exigences légales
                    françaises
                  </li>
                  <li>
                    Les coordonnées bancaires fournies seront exactes pour le
                    virement
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec navigation */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          {/* Bouton précédent */}
          {currentStep !== 'recap' ? (
            <button
              onClick={() =>
                goToStep(currentStep === 'confirm' ? 'template' : 'recap')
              }
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
          ) : (
            <div />
          )}

          {/* Boutons action */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>

            {currentStep !== 'confirm' ? (
              <button
                onClick={() =>
                  goToStep(currentStep === 'recap' ? 'template' : 'confirm')
                }
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  void handleSubmit().catch(error => {
                    console.error(
                      '[PaymentRequestModal] Submit failed:',
                      error
                    );
                  });
                }}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmer la demande
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentRequestModal;
