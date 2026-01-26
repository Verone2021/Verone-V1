'use client';

/**
 * Landing Page Header - Navigation publique LinkMe
 *
 * Header responsive avec:
 * - Logo a gauche
 * - Navigation centrale (desktop)
 * - CTAs a droite (Se connecter + Devenir partenaire)
 * - Menu mobile avec Sheet
 *
 * @module LandingHeader
 * @since 2026-01-07
 */

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Menu, X, LogIn, ArrowRight, LayoutDashboard } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

// Navigation items
const NAV_ITEMS = [
  { label: 'Accueil', href: '/' },
  { label: 'Comment ca marche', href: '#how-it-works' },
  { label: 'A propos', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export function LandingHeader(): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/LINKME-logo-820x312px.png"
              alt="LinkMe"
              width={120}
              height={46}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#183559]/70 hover:text-[#183559] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-lg hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all shadow-sm hover:shadow-md"
              >
                <LayoutDashboard className="h-4 w-4" />
                Mon Espace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#183559] border border-[#183559]/20 rounded-lg hover:bg-[#183559]/5 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Se connecter
                </Link>
                <Link
                  href="#contact"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-lg hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all shadow-sm hover:shadow-md"
                >
                  Devenir partenaire
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-[#183559] hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-4 space-y-3">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-base font-medium text-[#183559] hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-lg hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Mon Espace
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-[#183559] border border-[#183559]/20 rounded-lg hover:bg-[#183559]/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn className="h-4 w-4" />
                    Se connecter
                  </Link>
                  <Link
                    href="#contact"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-lg hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Devenir partenaire
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
