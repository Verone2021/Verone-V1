'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ShoppingCart, Menu, Search, User } from 'lucide-react';

import { MobileNav } from './MobileNav';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItemsCount = 0; // TODO: Connect to cart state

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-verone-gray-200 bg-verone-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-12">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo-verone.png"
                  alt="Vérone"
                  width={120}
                  height={40}
                  priority
                  className="h-10 w-auto"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-8">
                <Link
                  href="/catalogue"
                  className="text-sm font-medium text-verone-gray-600 hover:text-verone-black uppercase tracking-wide transition-colors duration-300"
                >
                  Catalogue
                </Link>
                <Link
                  href="/collections"
                  className="text-sm font-medium text-verone-gray-600 hover:text-verone-black uppercase tracking-wide transition-colors duration-300"
                >
                  Collections
                </Link>
                <Link
                  href="/a-propos"
                  className="text-sm font-medium text-verone-gray-600 hover:text-verone-black uppercase tracking-wide transition-colors duration-300"
                >
                  À propos
                </Link>
                <Link
                  href="/contact"
                  className="text-sm font-medium text-verone-gray-600 hover:text-verone-black uppercase tracking-wide transition-colors duration-300"
                >
                  Contact
                </Link>
              </nav>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search Icon */}
              <button
                type="button"
                className="p-2.5 text-verone-gray-600 hover:text-verone-black hover:bg-verone-gray-50 rounded-full transition-all duration-300"
                aria-label="Rechercher"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Account */}
              <Link
                href="/compte"
                className="hidden md:inline-flex p-2.5 text-verone-gray-600 hover:text-verone-black hover:bg-verone-gray-50 rounded-full transition-all duration-300"
                aria-label="Mon compte"
              >
                <User className="h-5 w-5" />
              </Link>

              {/* Cart */}
              <Link
                href="/panier"
                className="relative p-2.5 text-verone-gray-600 hover:text-verone-black hover:bg-verone-gray-50 rounded-full transition-all duration-300"
                aria-label="Panier"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-verone-black text-verone-white text-xs font-semibold rounded-full">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                className="lg:hidden p-2.5 text-verone-gray-600 hover:text-verone-black hover:bg-verone-gray-50 rounded-full transition-all duration-300 ml-2"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
