'use client';

/**
 * PaymentRequestStepsContent
 * Rendu du contenu des 3 étapes de la modal PaymentRequestModalAdmin.
 * Extrait pour respecter la limite de 400 lignes.
 *
 * @since 2026-05-21
 */

import { formatPrice } from '@verone/utils';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { PaymentRequestInvoiceTemplate } from './payment-request-invoice-template';
import type { CommissionForModal, Step } from './use-payment-request';

interface Totals {
  totalHT: number;
  totalTTC: number;
  count: number;
}

interface PaymentRequestStepsContentProps {
  currentStep: Step;
  hasMixedAffiliates: boolean;
  error: string | null;
  selectedCommissions: CommissionForModal[];
  affiliateName: string;
  totals: Totals;
  copiedField: string | null;
  onCopyDestinataire: () => void;
  onCopyDesignation: () => void;
  onCopyMontant: () => void;
}

export function PaymentRequestStepsContent({
  currentStep,
  hasMixedAffiliates,
  error,
  selectedCommissions,
  affiliateName,
  totals,
  copiedField,
  onCopyDestinataire,
  onCopyDesignation,
  onCopyMontant,
}: PaymentRequestStepsContentProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Garde-fou : mélange d'affiliés */}
      {hasMixedAffiliates && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">Sélection mixte non autorisée</p>
            <p className="mt-0.5">
              Les commissions sélectionnées appartiennent à plusieurs affiliés
              différents. Une demande de paiement ne peut porter que sur un seul
              affilié. Désélectionnez les commissions des autres affiliés avant
              de continuer.
            </p>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Étape 1: Récapitulatif */}
      {currentStep === 'recap' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-emerald-800">
              Commissions à payer pour {affiliateName}
            </h3>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {selectedCommissions.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      #
                      {c.sales_order?.order_number ??
                        c.order_number ??
                        c.id.slice(0, 8)}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
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
            <div className="mt-4 flex items-center justify-between border-t border-emerald-200 pt-3">
              <span className="text-sm font-medium text-emerald-800">
                Total TTC à payer
              </span>
              <span className="text-xl font-bold text-emerald-600">
                {formatPrice(totals.totalTTC)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-blue-800">
              Workflow de paiement
            </h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-blue-700">
              <li>
                La demande est créée avec statut &quot;En attente de
                facture&quot;
              </li>
              <li>
                L&apos;affilié reçoit une notification pour uploader sa facture
              </li>
              <li>
                Une fois la facture reçue, vous validez et effectuez le virement
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
          onCopyDestinataire={onCopyDestinataire}
          onCopyDesignation={onCopyDesignation}
          onCopyMontant={onCopyMontant}
        />
      )}

      {/* Étape 3: Confirmation */}
      {currentStep === 'confirm' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Confirmer la création de la demande
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Cette action va créer une demande de paiement pour{' '}
              <strong>{affiliateName}</strong>. L&apos;affilié sera notifié pour
              uploader sa facture.
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm">
              <span className="text-gray-600">Montant total TTC :</span>
              <span className="text-2xl font-bold text-emerald-600">
                {formatPrice(totals.totalTTC)}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <p className="mb-2 font-medium text-gray-800">
              En confirmant, vous certifiez que :
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                Les commissions listées correspondent à des ventes validées et
                payées par les clients
              </li>
              <li>L&apos;affilié sera notifié pour fournir sa facture</li>
              <li>Le paiement sera effectué après réception de la facture</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
