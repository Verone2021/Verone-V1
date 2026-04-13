'use client';

import { Suspense, useEffect, useRef } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { CheckCircle, Package } from 'lucide-react';

import { trackPurchase } from '@/components/analytics/GoogleAnalytics';
import { trackMetaPurchase } from '@/components/analytics/MetaPixel';
import { useCart } from '@/contexts/CartContext';

function PurchaseTracker() {
  const searchParams = useSearchParams();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    const sessionId = searchParams.get('session_id');
    const value = parseFloat(searchParams.get('total') ?? '0');
    const itemCount = parseInt(searchParams.get('items') ?? '1', 10);
    const transactionId = sessionId ?? crypto.randomUUID().slice(0, 8);

    trackPurchase({
      transactionId,
      value,
      shipping: parseFloat(searchParams.get('shipping') ?? '0'),
      itemCount,
    });
    trackMetaPurchase({
      transactionId,
      value,
      contentIds: [],
      itemCount,
    });
  }, [searchParams]);

  return null;
}

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    void clearCart().catch(error => {
      console.error('[CheckoutSuccess] Clear cart failed:', error);
    });
  }, [clearCart]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <Suspense fallback={null}>
        <PurchaseTracker />
      </Suspense>
      <div className="text-center max-w-lg">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-playfair font-bold text-verone-black mb-3">
          Commande confirmée
        </h1>
        <p className="text-verone-gray-500 mb-8 leading-relaxed">
          Merci pour votre commande ! Vous recevrez un email de confirmation
          avec les détails de votre commande et le suivi de livraison.
        </p>

        <div className="border border-verone-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 text-verone-gray-600">
            <Package className="h-5 w-5" />
            <p className="text-sm">
              Délai de livraison estimé : 10 à 14 jours ouvrés
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/catalogue"
            className="bg-verone-black text-verone-white px-6 py-3 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm"
          >
            Continuer mes achats
          </Link>
          <Link
            href="/compte"
            className="border border-verone-gray-300 text-verone-black px-6 py-3 rounded-lg font-medium hover:bg-verone-gray-50 transition-colors text-sm"
          >
            Voir mon compte
          </Link>
        </div>
      </div>
    </div>
  );
}
