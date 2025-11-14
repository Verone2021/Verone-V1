'use client';

import Link from 'next/link';

import { Check } from 'lucide-react';

export default function ConfirmationPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-8 py-24 text-center">
      {/* Icône succès */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-8">
        <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
      </div>

      {/* Titre */}
      <h1 className="font-playfair text-4xl font-bold text-verone-black mb-4">
        Commande confirmée !
      </h1>

      <p className="text-lg text-verone-gray-700 mb-2">
        Merci pour votre commande. Vous allez recevoir un email de confirmation
        dans quelques instants.
      </p>

      <p className="text-verone-gray-600 mb-12">
        Votre commande sera traitée dans les plus brefs délais.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/catalogue"
          className="inline-block px-8 py-4 bg-verone-black text-white font-semibold uppercase tracking-wider hover:bg-verone-gray-800 transition-colors duration-300"
        >
          Continuer mes achats
        </Link>

        <Link
          href="/"
          className="inline-block px-8 py-4 border-2 border-verone-gray-300 text-verone-black font-semibold uppercase tracking-wider hover:border-verone-black transition-colors duration-300"
        >
          Retour à l'accueil
        </Link>
      </div>

      {/* Note */}
      <div className="mt-16 p-6 bg-verone-gray-50 border border-verone-gray-200">
        <p className="text-sm text-verone-gray-700">
          <strong>Besoin d'aide ?</strong> Contactez notre service client au{' '}
          <a
            href="tel:+33123456789"
            className="text-verone-black underline hover:no-underline"
          >
            01 23 45 67 89
          </a>{' '}
          ou par email à{' '}
          <a
            href="mailto:contact@verone.com"
            className="text-verone-black underline hover:no-underline"
          >
            contact@verone.com
          </a>
        </p>
      </div>
    </div>
  );
}
