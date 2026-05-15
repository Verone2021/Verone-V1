'use client';

/**
 * Landing Page Header - Navigation publique LinkMe
 *
 * Header responsive avec:
 * - Logo a gauche
 * - Navigation centrale (desktop)
 * - CTAs à droite (Se connecter + Demander l'accès)
 * - Menu mobile avec Sheet
 *
 * Note: Ce header n'est visible que par les visiteurs NON connectés.
 * Les utilisateurs connectés sont redirigés vers le dashboard par le middleware.
 *
 * @module LandingHeader
 * @since 2026-01-07
 * @updated 2026-01-23 - Simplifié (plus de détection session côté client)
 */

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Menu, X, LogIn, ArrowRight } from 'lucide-react';

// Navigation items
const NAV_ITEMS = [
  { label: 'Accueil', href: '/' },
  { label: 'Pour les enseignes', href: '/pour-les-enseignes' },
  { label: 'Pour les pros', href: '/pour-les-pros' },
  { label: 'Pour les créateurs', href: '/pour-les-createurs' },
  { label: 'Comment ça marche', href: '/comment-ca-marche' },
  { label: 'Pour les fournisseurs', href: '/fournisseurs' },
  { label: 'Blog', href: '/blog' },
  { label: 'À propos', href: '/about' },
];

export function LandingHeader(): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Desktop Navigation (lg+ — 6 items, trop dense en md) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#183559]/70 hover:text-[#183559] transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#183559] border border-[#183559]/20 rounded-lg hover:bg-[#183559]/5 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Se connecter
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-lg hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all shadow-sm hover:shadow-md"
            >
              Demander l&apos;accès
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Button (md inclus — nav desktop seulement à partir de lg) */}
          <button
            type="button"
            className="lg:hidden p-2 text-[#183559] hover:bg-gray-100 rounded-lg transition-colors"
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
        <div className="lg:hidden bg-white border-t border-gray-100">
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
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-[#183559] border border-[#183559]/20 rounded-lg hover:bg-[#183559]/5 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                Se connecter
              </Link>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-lg hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Demander l&apos;accès
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
