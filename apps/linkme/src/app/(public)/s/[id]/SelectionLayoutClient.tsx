'use client';

/**
 * SelectionLayoutClient
 *
 * Composant client pour le layout de sélection publique.
 * Gère l'affichage du header, des onglets et du bouton panier flottant.
 *
 * @module SelectionLayoutClient
 * @since 2026-01-12
 */

import type { ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

import { cn } from '@verone/ui';
import { Package, ShoppingCart } from 'lucide-react';

import { usePublicSelection } from '@/contexts/PublicSelectionContext';

// ============================================
// HELPERS
// ============================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

// ============================================
// LOADING COMPONENT
// ============================================

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full" />
        <div className="w-48 h-4 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// ============================================
// NOT FOUND COMPONENT
// ============================================

function NotFoundPage({ error }: { error?: string | null }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Selection introuvable
        </h1>
        <p className="text-gray-600">
          {error ?? "Cette selection n'existe pas ou n'est plus disponible."}
        </p>
      </div>
    </div>
  );
}

// ============================================
// TABS CONFIG
// ============================================

const TABS = [
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
] as const;

// ============================================
// MAIN COMPONENT
// ============================================

interface SelectionLayoutClientProps {
  children: ReactNode;
}

export function SelectionLayoutClient({
  children,
}: SelectionLayoutClientProps) {
  const { selection, branding, cartCount, cartTotal, isLoading, error, items } =
    usePublicSelection();

  const pathname = usePathname();
  const params = useParams();
  const selectionId = params.id as string;

  // Determine active tab
  const activeTab = pathname.includes('/faq')
    ? 'faq'
    : pathname.includes('/contact')
      ? 'contact'
      : 'catalogue';

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Error or not found
  if (error || !selection) {
    return <NotFoundPage error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logo and cart */}
      <header
        className="bg-white border-b sticky top-0 z-30"
        style={{ borderColor: `${branding.primary_color}20` }}
      >
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-4">
              {branding.logo_url ? (
                <Image
                  src={branding.logo_url}
                  alt={selection.name}
                  width={120}
                  height={40}
                  className="object-contain"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${branding.primary_color}20` }}
                >
                  <Package
                    className="h-5 w-5"
                    style={{ color: branding.primary_color }}
                  />
                </div>
              )}
              <h1
                className="text-xl font-bold hidden sm:block"
                style={{ color: branding.text_color }}
              >
                {selection.name}
              </h1>
            </div>

            {/* Cart button */}
            <button
              className="relative p-2 rounded-lg transition-colors hover:bg-gray-100"
              aria-label={`Panier (${cartCount} articles)`}
            >
              <ShoppingCart
                className="h-6 w-6"
                style={{ color: branding.text_color }}
              />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center font-medium"
                  style={{ backgroundColor: branding.primary_color }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="border-t border-gray-100">
          <div className="flex max-w-7xl mx-auto">
            {TABS.map(tab => (
              <Link
                key={tab.id}
                href={`/s/${selectionId}/${tab.id}`}
                className={cn(
                  'px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-linkme-turquoise text-linkme-turquoise'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
                {tab.id === 'catalogue' && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                    {items.length}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Page content */}
      <main>{children}</main>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <button
          className="fixed bottom-6 right-6 z-40 text-white px-6 py-4 rounded-full shadow-lg transition-all flex items-center gap-3 hover:scale-105 hover:shadow-xl"
          style={{ backgroundColor: branding.primary_color }}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">
            {cartCount} article{cartCount > 1 ? 's' : ''}
          </span>
          <span className="font-bold">{formatPrice(cartTotal)}</span>
        </button>
      )}
    </div>
  );
}
