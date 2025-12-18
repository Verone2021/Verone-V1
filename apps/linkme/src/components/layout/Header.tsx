'use client';

import Link from 'next/link';

import { ShoppingCart, LogIn, Loader2, Package, Star } from 'lucide-react';

import { useAuth, type LinkMeRole } from '../../contexts/AuthContext';
import { UserMenu } from '../auth/UserMenu';
import { useCart } from '../cart/CartProvider';

// Rôles autorisés à voir le catalogue
const CATALOG_ROLES: LinkMeRole[] = [
  'enseigne_admin',
  'org_independante',
  'organisation_admin',
];

// Rôles autorisés à voir "Ma sélection"
const SELECTION_ROLES: LinkMeRole[] = ['enseigne_admin', 'org_independante'];

export function Header() {
  const { itemCount, openCart } = useCart();
  const { user, linkMeRole, loading } = useAuth();

  // Vérifier les droits
  const canSeeCatalog = linkMeRole && CATALOG_ROLES.includes(linkMeRole.role);
  const canSeeSelection =
    linkMeRole && SELECTION_ROLES.includes(linkMeRole.role);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">LINKME</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Accueil
            </Link>
            {linkMeRole && (
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Dashboard
              </Link>
            )}
            {canSeeCatalog && (
              <Link
                href="/catalogue"
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium"
              >
                <Package className="h-4 w-4" />
                Catalogue
              </Link>
            )}
            {canSeeSelection && (
              <Link
                href="/ma-selection"
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium"
              >
                <Star className="h-4 w-4" />
                Ma sélection
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Panier */}
            <button
              onClick={openCart}
              className="relative p-2 text-gray-600 hover:text-gray-900"
              aria-label="Ouvrir le panier"
            >
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Auth */}
            {loading ? (
              <div className="p-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : user ? (
              <UserMenu />
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Connexion</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
