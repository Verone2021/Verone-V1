'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

import { useCart } from '../cart/CartProvider';

export function Header() {
  const { itemCount, openCart } = useCart();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">LINKME</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Accueil
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </div>
    </header>
  );
}
