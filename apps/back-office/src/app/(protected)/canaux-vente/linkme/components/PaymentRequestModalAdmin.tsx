/**
 * PaymentRequestModalAdmin
 * Modal pour créer une demande de versement côté back-office (admin)
 *
 * Étapes :
 * 1. Récapitulatif des commissions sélectionnées
 * 2. Aperçu du modèle de facture pré-rempli
 * 3. Confirmation et envoi de la demande
 *
 * @module PaymentRequestModalAdmin
 * @since 2025-12-11
 */

'use client';

import { formatPrice } from '@verone/utils';
import {
  X,
  FileText,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Banknote,
  Eye,
} from 'lucide-react';

import { PaymentRequestStepsContent } from './PaymentRequestStepsContent';
import {
  usePaymentRequest,
  type CommissionForModal,
  type Step,
} from './use-payment-request';

// ============================================================================
// Types
// ============================================================================

interface PaymentRequestModalAdminProps {
  /** Ouvrir/fermer la modal */
  isOpen: boolean;
  /** Callback fermeture */
  onClose: () => void;
  /** Commissions sélectionnées pour la demande */
  selectedCommissions: CommissionForModal[];
  /** ID de l'affilié concerné */
  affiliateId: string;
  /** Nom de l'affilié pour affichage */
  affiliateName: string;
  /** Callback succès (optionnel) */
  onSuccess?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function PaymentRequestModalAdmin({
  isOpen,
  onClose,
  selectedCommissions,
  affiliateId,
  affiliateName,
  onSuccess,
}: PaymentRequestModalAdminProps) {
  const {
    currentStep,
    error,
    copiedField,
    totals,
    createMutation,
    goToStep,
    handleSubmit,
    handleClose,
    handleCopyDestinataire,
    handleCopyDesignation,
    handleCopyMontant,
  } = usePaymentRequest({
    selectedCommissions,
    affiliateId,
    affiliateName,
    onSuccess,
    onClose,
  });

  // Garde-fou : détecter si la sélection mélange plusieurs affiliés distincts.
  // On utilise affiliate_id quand disponible, sinon on se rabat sur l'identité
  // de l'affilié via enseigne_id ou organisation_id.
  const affiliateIds = new Set(
    selectedCommissions.map(c => {
      if (c.affiliate_id) return c.affiliate_id;
      if (c.affiliate?.enseigne_id)
        return `enseigne-${c.affiliate.enseigne_id}`;
      if (c.affiliate?.organisation_id)
        return `org-${c.affiliate.organisation_id}`;
      return 'unknown';
    })
  );
  const hasMixedAffiliates = affiliateIds.size > 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-3xl max-h-screen md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Banknote className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Créer demande de paiement
              </h2>
              <p className="text-sm text-gray-500">
                Pour {affiliateName} • {totals.count} commission
                {totals.count > 1 ? 's' : ''} • {formatPrice(totals.totalTTC)}{' '}
                TTC
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
                      className={`w-8 h-0.5 mx-1 ${isPast || isActive ? 'bg-emerald-400' : 'bg-gray-300'}`}
                    />
                  )}
                  <button
                    onClick={() => goToStep(step.key as Step)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                      transition-all
                      ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md'
                          : isPast
                            ? 'bg-emerald-100 text-emerald-600'
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

        {/* Content — rendu des étapes dans PaymentRequestStepsContent */}
        <PaymentRequestStepsContent
          currentStep={currentStep}
          hasMixedAffiliates={hasMixedAffiliates}
          error={error}
          selectedCommissions={selectedCommissions}
          affiliateName={affiliateName}
          totals={totals}
          copiedField={copiedField}
          onCopyDestinataire={() => {
            void handleCopyDestinataire().catch(err => {
              console.error(
                '[PaymentRequestModalAdmin] handleCopyDestinataire failed:',
                err
              );
            });
          }}
          onCopyDesignation={() => {
            void handleCopyDesignation().catch(err => {
              console.error(
                '[PaymentRequestModalAdmin] handleCopyDesignation failed:',
                err
              );
            });
          }}
          onCopyMontant={() => {
            void handleCopyMontant().catch(err => {
              console.error(
                '[PaymentRequestModalAdmin] handleCopyMontant failed:',
                err
              );
            });
          }}
        />

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
                disabled={hasMixedAffiliates}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  void handleSubmit().catch(error => {
                    console.error(
                      '[PaymentRequestModalAdmin] handleSubmit failed:',
                      error
                    );
                  });
                }}
                disabled={createMutation.isPending || hasMixedAffiliates}
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
                    Créer la demande de paiement
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

export default PaymentRequestModalAdmin;
