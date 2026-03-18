import Link from 'next/link';

import { XCircle } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <XCircle className="h-16 w-16 text-verone-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-playfair font-bold text-verone-black mb-3">
          Paiement annulé
        </h1>
        <p className="text-verone-gray-500 mb-8 leading-relaxed">
          Le paiement a été annulé. Votre panier a été conservé, vous pouvez
          réessayer à tout moment.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/panier"
            className="bg-verone-black text-verone-white px-6 py-3 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm"
          >
            Retour au panier
          </Link>
          <Link
            href="/catalogue"
            className="border border-verone-gray-300 text-verone-black px-6 py-3 rounded-lg font-medium hover:bg-verone-gray-50 transition-colors text-sm"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}
