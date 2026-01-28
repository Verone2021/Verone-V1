'use client';

import { Suspense } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { CheckCircle, Package, ArrowRight, Mail, Phone } from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') ?? 'N/A';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Merci pour votre commande !
          </h1>
          <p className="text-gray-600 mb-6">
            Votre commande a été enregistrée avec succès.
          </p>

          {/* Order Number */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Numéro de commande</p>
            <p className="text-xl font-bold text-gray-900 font-mono">
              {orderNumber}
            </p>
          </div>

          {/* What's Next */}
          <div className="text-left bg-blue-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Et maintenant ?
            </h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </span>
                <span>
                  Vous allez recevoir un email de confirmation avec les détails
                  de votre commande.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </span>
                <span>Notre équipe prépare votre commande avec soin.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </span>
                <span>
                  Vous recevrez un email avec le suivi de livraison dès
                  l'expédition.
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="border-t pt-6 mb-6">
            <p className="text-sm text-gray-600 mb-3">
              Des questions ? Contactez-nous :
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a
                href="mailto:support@verone.fr"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <Mail className="h-4 w-4" />
                support@verone.fr
              </a>
              <a
                href="tel:+33123456789"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <Phone className="h-4 w-4" />
                01 23 45 67 89
              </a>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continuer mes achats
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Un email de confirmation a été envoyé à votre adresse email.
          <br />
          Pensez à vérifier vos spams si vous ne le recevez pas.
        </p>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
