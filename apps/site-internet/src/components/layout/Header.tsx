'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ShoppingCart, Menu, Search, User, Heart, LogIn } from 'lucide-react';

import { useCart } from '@/contexts/CartContext';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useWishlist } from '@/hooks/use-wishlist';
import { SearchOverlay } from '@/components/SearchOverlay';

import { MobileNav } from './MobileNav';
import { MegaMenu } from './MegaMenu';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { itemCount: cartItemsCount } = useCart();
  const { user } = useAuthUser();
  const { itemCount: wishlistCount } = useWishlist(user?.id);

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
                <MegaMenu />
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
                onClick={() => setSearchOpen(true)}
                className="p-2.5 text-verone-gray-600 hover:text-verone-black hover:bg-verone-gray-50 rounded-full transition-all duration-300"
                aria-label="Rechercher"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/compte/favoris"
                className="hidden md:inline-flex relative p-2.5 text-verone-gray-600 hover:text-verone-black hover:bg-verone-gray-50 rounded-full transition-all duration-300"
                aria-label="Favoris"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-red-500 text-verone-white text-[10px] font-semibold rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Account / Login */}
              {user ? (
                <Link
                  href="/compte"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-verone-gray-600 hover:text-verone-black hover:bg-verone-gray-50 rounded-full transition-all duration-300"
                  aria-label="Mon compte"
                >
                  <User className="h-5 w-5" />
                  <span className="text-xs font-medium max-w-[80px] truncate">
                    {user.user_metadata?.first_name ??
                      user.email?.split('@')[0] ??
                      'Compte'}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-verone-gray-600 hover:text-verone-black hover:bg-verone-gray-50 rounded-full transition-all duration-300"
                  aria-label="Se connecter"
                >
                  <LogIn className="h-5 w-5" />
                  <span className="text-xs font-medium">Connexion</span>
                </Link>
              )}

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

      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
