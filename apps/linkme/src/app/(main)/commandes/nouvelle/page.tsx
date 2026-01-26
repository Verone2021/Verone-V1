'use client';

/**
 * Page: Nouvelle Commande
 *
 * Formulaire de création de commande en 7 étapes avec sidebar stepper.
 * Remplace le modal CreateOrderModal par une page pleine.
 *
 * @module NouvelleCommandePage
 * @since 2026-01-20
 */

import Link from 'next/link';

import { ChevronRight, ArrowLeft } from 'lucide-react';

import { NewOrderForm } from '../../../../components/orders/NewOrderForm';

export default function NouvelleCommandePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec breadcrumb */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link
                href="/commandes"
                className="hover:text-linkme-turquoise transition-colors"
              >
                Commandes
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">
                Nouvelle commande
              </span>
            </nav>

            <h1 className="text-2xl font-bold text-gray-900">
              Créer une nouvelle commande
            </h1>
            <p className="text-gray-500 mt-1">
              Suivez les étapes pour créer votre commande
            </p>
          </div>

          {/* Bouton retour */}
          <Link
            href="/commandes"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux commandes
          </Link>
        </div>
      </div>

      {/* Contenu principal */}
      <NewOrderForm />
    </div>
  );
}
