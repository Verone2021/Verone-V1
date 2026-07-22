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
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-verone-charbon">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-12">
              <Link
                href="/"
                className="flex items-center"
                aria-label="Vérone — Accueil"
              >
                <Image
                  src="/logo-verone-clean.png"
                  alt="Vérone"
                  width={244}
                  height={37}
                  priority
                  className="h-6 w-auto brightness-0 invert"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden items-center space-x-8 lg:flex">
                <MegaMenu />
                <Link
                  href="/collections"
                  className="font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-white transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
                >
                  Collections
                </Link>
                <Link
                  href="/journal"
                  className="font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-white transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
                >
                  Journal
                </Link>
                <Link
                  href="/a-propos"
                  className="font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-white transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
                >
                  À propos
                </Link>
                <Link
                  href="/contact"
                  className="font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-white transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
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
                className="p-2.5 text-verone-white transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
                aria-label="Rechercher"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/compte/favoris"
                className="relative hidden p-2.5 text-verone-white transition-colors duration-[180ms] ease-editorial hover:text-verone-or md:inline-flex"
                aria-label="Favoris"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-verone-or font-montserrat text-[10px] font-semibold text-verone-charbon">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Account / Login */}
              {user ? (
                <Link
                  href="/compte"
                  className="hidden items-center gap-1.5 px-3 py-2 text-verone-white transition-colors duration-[180ms] ease-editorial hover:text-verone-or md:inline-flex"
                  aria-label="Mon compte"
                >
                  <User className="h-5 w-5" />
                  <span className="max-w-[80px] truncate font-montserrat text-xs font-medium">
                    {user.user_metadata?.first_name ??
                      user.email?.split('@')[0] ??
                      'Compte'}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden items-center gap-1.5 px-3 py-2 text-verone-white transition-colors duration-[180ms] ease-editorial hover:text-verone-or md:inline-flex"
                  aria-label="Se connecter"
                >
                  <LogIn className="h-5 w-5" />
                  <span className="font-montserrat text-xs font-medium">
                    Connexion
                  </span>
                </Link>
              )}

              {/* Cart */}
              <Link
                href="/panier"
                className="relative p-2.5 text-verone-white transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
                aria-label="Panier"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-verone-or font-montserrat text-xs font-semibold text-verone-charbon">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                className="ml-2 p-2.5 text-verone-white transition-colors duration-[180ms] ease-editorial hover:text-verone-or lg:hidden"
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
