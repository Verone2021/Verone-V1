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

import { useState, useMemo, useCallback } from 'react';

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
  Copy,
} from 'lucide-react';

import { useCreatePaymentRequestAdmin } from '../hooks/use-payment-requests-admin';

// ============================================================================
// Types
// ============================================================================

interface CommissionForModal {
  id: string;
  order_number: string | null;
  order_amount_ht: number;
  affiliate_commission: number;
  affiliate_commission_ttc: number | null;
  affiliate?: {
    display_name: string;
    enseigne_id: string | null;
    organisation_id: string | null;
  } | null;
  sales_order?: {
    order_number: string;
    total_ttc: number | null;
  } | null;
}

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

type Step = 'recap' | 'template' | 'confirm';

// ============================================================================
// Informations légales Vérone
// ============================================================================

const VERONE_LEGAL_INFO = {
  name: 'VERONE SAS',
  address: '229 Rue Saint-Honoré',
  postalCode: '75001',
  city: 'PARIS',
  siret: '914 588 785 00016',
  fullAddress: '229 Rue Saint-Honoré, 75001 PARIS',
};

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
  const [currentStep, setCurrentStep] = useState<Step>('recap');
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Mutation création
  const createMutation = useCreatePaymentRequestAdmin();

  // Calculs des totaux
  const totals = useMemo(() => {
    const totalHT = selectedCommissions.reduce(
      (sum, c) => sum + (c.affiliate_commission ?? 0),
      0
    );
    const totalTTC = selectedCommissions.reduce(
      (sum, c) =>
        sum + (c.affiliate_commission_ttc ?? c.affiliate_commission * 1.2),
      0
    );
    return { totalHT, totalTTC, count: selectedCommissions.length };
  }, [selectedCommissions]);

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
        affiliateId,
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

  // Copier le destinataire (Vérone)
  const handleCopyDestinataire = async () => {
    const lines = [
      VERONE_LEGAL_INFO.name,
      VERONE_LEGAL_INFO.address,
      `${VERONE_LEGAL_INFO.postalCode} ${VERONE_LEGAL_INFO.city}`,
      `SIRET : ${VERONE_LEGAL_INFO.siret}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedField('destinataire');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error('Erreur copie');
    }
  };

  // Copier la désignation
  const handleCopyDesignation = async () => {
    const lines = [
      "Commission sur ventes - Apport d'affaires",
      '',
      ...selectedCommissions.map(
        c =>
          `• Commande #${c.order_number ?? c.sales_order?.order_number ?? c.id.slice(0, 8)} : ${formatPrice(c.affiliate_commission)}`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedField('designation');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error('Erreur copie');
    }
  };

  // Copier le montant TTC
  const handleCopyMontant = async () => {
    try {
      await navigator.clipboard.writeText(formatPrice(totals.totalTTC));
      setCopiedField('montant');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error('Erreur copie');
    }
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
                          {c.order_number ??
                            c.sales_order?.order_number ??
                            c.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatPrice(c.order_amount_ht)} HT
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatPrice(
                          c.affiliate_commission_ttc ??
                            c.affiliate_commission * 1.2
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
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Important :</strong> Ce modèle montre les informations
                  que l&apos;affilié devra inclure dans sa facture. Vous pouvez
                  copier ces informations pour les lui transmettre.
                </p>
              </div>

              {/* Actions de copie */}
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    void handleCopyDestinataire().catch(error => {
                      console.error(
                        '[PaymentRequestModalAdmin] handleCopyDestinataire failed:',
                        error
                      );
                    });
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copiedField === 'destinataire' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedField === 'destinataire'
                    ? 'Copié !'
                    : 'Copier destinataire'}
                </button>
                <button
                  onClick={() => {
                    void handleCopyDesignation().catch(error => {
                      console.error(
                        '[PaymentRequestModalAdmin] handleCopyDesignation failed:',
                        error
                      );
                    });
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copiedField === 'designation' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {copiedField === 'designation'
                    ? 'Copié !'
                    : 'Copier désignation'}
                </button>
                <button
                  onClick={() => {
                    void handleCopyMontant().catch(error => {
                      console.error(
                        '[PaymentRequestModalAdmin] handleCopyMontant failed:',
                        error
                      );
                    });
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors font-medium"
                >
                  {copiedField === 'montant' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedField === 'montant' ? 'Copié !' : 'Copier montant TTC'}
                </button>
              </div>

              {/* Template visuel */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm font-mono text-sm">
                {/* Header */}
                <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 tracking-wide">
                    FACTURE DE COMMISSION
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Apport d&apos;affaires
                  </p>
                </div>

                {/* Deux colonnes */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Émetteur */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Émetteur
                    </p>
                    <p className="font-semibold text-gray-900">
                      {affiliateName}
                    </p>
                    <p className="text-orange-500 text-xs mt-1 italic">
                      [Adresse à compléter par l&apos;affilié]
                    </p>
                    <p className="text-gray-400 text-xs italic">
                      SIRET : [Si applicable]
                    </p>
                  </div>

                  {/* Destinataire */}
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-600 uppercase mb-2">
                      Destinataire
                    </p>
                    <p className="font-semibold text-gray-900">
                      {VERONE_LEGAL_INFO.name}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {VERONE_LEGAL_INFO.address}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {VERONE_LEGAL_INFO.postalCode} {VERONE_LEGAL_INFO.city}
                    </p>
                    <p className="text-gray-600 text-xs">
                      SIRET : {VERONE_LEGAL_INFO.siret}
                    </p>
                  </div>
                </div>

                {/* Tableau des lignes */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                          Désignation
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">
                          Montant HT
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-700"
                        >
                          Commission sur ventes - Apport d&apos;affaires (Compte
                          7082)
                        </td>
                      </tr>
                      {selectedCommissions.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-xs text-gray-600">
                            <span className="text-gray-400">•</span> Commande #
                            {c.order_number ??
                              c.sales_order?.order_number ??
                              c.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-2 text-xs text-right font-medium text-gray-900">
                            {formatPrice(c.affiliate_commission)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totaux */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1">
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="text-xs text-gray-600">Total HT</span>
                      <span className="text-sm font-medium">
                        {formatPrice(totals.totalHT)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="text-xs text-gray-600">TVA 20%</span>
                      <span className="text-sm font-medium">
                        {formatPrice(totals.totalTTC - totals.totalHT)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 bg-emerald-50 px-2 rounded">
                      <span className="text-sm font-bold text-emerald-800">
                        TOTAL TTC
                      </span>
                      <span className="text-lg font-bold text-emerald-600">
                        {formatPrice(totals.totalTTC)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note TVA */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Note :</strong> Si l&apos;affilié est
                    auto-entrepreneur en franchise de TVA, il doit mentionner
                    sur sa facture :{' '}
                    <em>&quot;TVA non applicable, art. 293 B du CGI&quot;</em>{' '}
                    et indiquer 0,00 € pour la TVA.
                  </p>
                </div>
              </div>
            </div>
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
