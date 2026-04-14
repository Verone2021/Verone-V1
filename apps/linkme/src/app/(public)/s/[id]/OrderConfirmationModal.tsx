'use client';

/**
 * OrderConfirmationModal - Modal de confirmation après soumission commande
 *
 * @module OrderConfirmationModal
 * @since 2026-04-14
 */

import { CheckCircle, Clock, Mail, Truck } from 'lucide-react';

import type { SubmittedOrderData } from './use-selection-layout';
import type { IBranding } from './selection-context';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

interface OrderConfirmationModalProps {
  orderNumber: string;
  submittedOrderData: SubmittedOrderData | null;
  branding: IBranding;
  onClose: () => void;
}

export function OrderConfirmationModal({
  orderNumber,
  submittedOrderData,
  branding,
  onClose,
}: OrderConfirmationModalProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b bg-gradient-to-b from-green-50 to-white text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          Commande envoyee !
        </h3>
        <p className="text-gray-600">
          Votre commande <strong>{orderNumber}</strong> a ete enregistree.
        </p>
      </div>

      {/* Body */}
      <div className="px-8 py-6 space-y-4 flex-1">
        {submittedOrderData && (
          <>
            {/* Résumé compact */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {submittedOrderData.items.length} produit
                  {submittedOrderData.items.length > 1 ? 's' : ''}
                </span>
                <span className="font-medium text-gray-900">
                  {formatPrice(submittedOrderData.totalHT)} HT
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total TTC</span>
                <span className="font-bold text-gray-900">
                  {formatPrice(submittedOrderData.totalTTC)} TTC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Livraison</span>
                <span className="text-gray-500 italic">a definir</span>
              </div>
            </div>

            {/* Transport notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Truck className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">
                    Frais de transport non inclus.
                  </span>{' '}
                  Les frais seront calcules et communiques dans le devis
                  detaille.
                </p>
              </div>
            </div>

            {/* Prochaines etapes */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-900 mb-3">
                Prochaines etapes
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Commande recue
                    </p>
                    <p className="text-xs text-green-700">
                      Votre commande a ete enregistree avec succes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Validation sous 24h
                    </p>
                    <p className="text-xs text-green-700">
                      Notre equipe verifie et valide votre commande sous 24h
                      ouvrees
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Devis detaille par email
                    </p>
                    <p className="text-xs text-green-700">
                      Vous recevrez un devis incluant les frais de transport a{' '}
                      <span className="font-semibold">
                        {submittedOrderData.requesterEmail}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  Un email de confirmation sera envoye a{' '}
                  <span className="font-semibold">
                    {submittedOrderData.requesterEmail}
                  </span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-5 border-t bg-gray-50">
        <button
          onClick={onClose}
          className="w-full px-6 py-3 text-white rounded-lg hover:opacity-90 font-semibold"
          style={{ backgroundColor: branding.primary_color }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
