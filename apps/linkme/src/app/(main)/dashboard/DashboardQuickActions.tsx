'use client';

import Link from 'next/link';

import { Package, ShoppingBag, ShoppingCart, Star } from 'lucide-react';

type DashboardQuickActionsProps = {
  canManageSelections: boolean;
};

/**
 * Grille d'actions rapides du dashboard LinkMe
 */
export function DashboardQuickActions({
  canManageSelections,
}: DashboardQuickActionsProps): JSX.Element {
  return (
    <section className="mb-8" data-tour="quick-actions">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Actions rapides
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {canManageSelections && (
          <Link
            href="/ma-selection"
            className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-lg hover:bg-amber-50 hover:border-amber-200 transition-colors group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">
              Mes sélections
            </span>
          </Link>
        )}
        <Link
          href="/catalogue"
          className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-lg hover:bg-violet-50 hover:border-violet-200 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 group-hover:bg-violet-200 transition-colors">
            <Package className="h-5 w-5 text-violet-600" />
          </div>
          <span className="text-sm font-medium text-gray-700 text-center">
            Catalogue
          </span>
        </Link>
        <Link
          href="/commandes"
          className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
            <ShoppingCart className="h-5 w-5 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-700 text-center">
            Nouvelle commande
          </span>
        </Link>
        <Link
          href="/commandes"
          className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700 text-center">
            Mes commandes
          </span>
        </Link>
      </div>
    </section>
  );
}
