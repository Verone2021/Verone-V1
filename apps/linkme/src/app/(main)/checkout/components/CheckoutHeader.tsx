import Link from 'next/link';
import { ArrowLeft, Lock, User, Truck, CreditCard } from 'lucide-react';

export function CheckoutHeader() {
  return (
    <>
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au panier
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lock className="h-4 w-4" />
              Paiement sécurisé
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Informations</span>
            </div>
            <div className="w-8 h-px bg-blue-600" />
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Livraison</span>
            </div>
            <div className="w-8 h-px bg-blue-600" />
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Paiement</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
