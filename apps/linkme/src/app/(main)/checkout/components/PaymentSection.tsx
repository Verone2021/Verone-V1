import { CreditCard, Lock } from 'lucide-react';

import { formatPrice } from '../helpers';

interface PaymentSectionProps {
  isSubmitting: boolean;
  revolutLoaded: boolean;
  finalTotal: number;
}

export function PaymentSection({
  isSubmitting,
  revolutLoaded,
  finalTotal,
}: PaymentSectionProps) {
  return (
    <>
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Paiement sécurisé
        </h2>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900 text-sm">
                Paiement par carte bancaire
              </p>
              <p className="text-xs text-blue-700">
                Visa, Mastercard, American Express - Sécurisé par Revolut
              </p>
            </div>
          </div>
        </div>
        {!revolutLoaded && (
          <div className="mt-3 flex items-center gap-2 text-gray-500">
            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Chargement du module de paiement...</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !revolutLoaded}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Traitement en cours...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Payer {formatPrice(finalTotal)}
          </>
        )}
      </button>

      <p className="text-[10px] text-gray-500 text-center">
        En confirmant votre commande, vous acceptez nos conditions générales de
        vente. Le paiement est sécurisé par Revolut.
      </p>
    </>
  );
}
