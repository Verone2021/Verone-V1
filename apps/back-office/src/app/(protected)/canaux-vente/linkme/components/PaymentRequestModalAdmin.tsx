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
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Banknote,
  Eye,
} from 'lucide-react';

import { PaymentRequestInvoiceTemplate } from './payment-request-invoice-template';
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
                  Commissions à payer pour {affiliateName}
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCommissions.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          #
                          {c.sales_order?.order_number ??
                            c.order_number ??
                            c.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatPrice(
                            c.sales_order?.total_ht ?? c.order_amount_ht
                          )}{' '}
                          HT
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatPrice(
                          c.total_payout_ttc ?? c.affiliate_commission_ttc ?? 0
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-emerald-800">
                    Total TTC à payer
                  </span>
                  <span className="text-xl font-bold text-emerald-600">
                    {formatPrice(totals.totalTTC)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">
                  Workflow de paiement
                </h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>
                    La demande est créée avec statut &quot;En attente de
                    facture&quot;
                  </li>
                  <li>
                    L&apos;affilié reçoit une notification pour uploader sa
                    facture
                  </li>
                  <li>
                    Une fois la facture reçue, vous validez et effectuez le
                    virement
                  </li>
                  <li>Marquez la demande comme payée avec la référence</li>
                </ol>
              </div>
            </div>
          )}

          {/* Étape 2: Modèle de facture */}
          {currentStep === 'template' && (
            <PaymentRequestInvoiceTemplate
              selectedCommissions={selectedCommissions}
              affiliateName={affiliateName}
              totals={totals}
              copiedField={copiedField}
              onCopyDestinataire={() => {
                void handleCopyDestinataire().catch(error => {
                  console.error(
                    '[PaymentRequestModalAdmin] handleCopyDestinataire failed:',
                    error
                  );
                });
              }}
              onCopyDesignation={() => {
                void handleCopyDesignation().catch(error => {
                  console.error(
                    '[PaymentRequestModalAdmin] handleCopyDesignation failed:',
                    error
                  );
                });
              }}
              onCopyMontant={() => {
                void handleCopyMontant().catch(error => {
                  console.error(
                    '[PaymentRequestModalAdmin] handleCopyMontant failed:',
                    error
                  );
                });
              }}
            />
          )}

          {/* Étape 3: Confirmation */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 text-center border border-emerald-200">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmer la création de la demande
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Cette action va créer une demande de paiement pour{' '}
                  <strong>{affiliateName}</strong>. L&apos;affilié sera notifié
                  pour uploader sa facture.
                </p>
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <span className="text-gray-600">Montant total TTC :</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatPrice(totals.totalTTC)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-800 mb-2">
                  En confirmant, vous certifiez que :
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Les commissions listées correspondent à des ventes validées
                    et payées par les clients
                  </li>
                  <li>L&apos;affilié sera notifié pour fournir sa facture</li>
                  <li>
                    Le paiement sera effectué après réception de la facture
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
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
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
