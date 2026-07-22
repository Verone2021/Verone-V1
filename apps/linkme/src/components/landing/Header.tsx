'use client';

/**
 * Landing Page Header - Navigation publique LinkMe
 *
 * Header responsive avec:
 * - Logo a gauche (lien home implicite)
 * - Navigation principale 4 items (lg+)
 * - Dropdown "Plus" pour items secondaires
 * - CTAs à droite (Se connecter + Demander l'accès)
 * - Menu mobile complet
 *
 * Note: Ce header n'est visible que par les visiteurs NON connectés.
 * Les utilisateurs connectés sont redirigés vers le dashboard par le middleware.
 *
 * @module LandingHeader
 * @since 2026-01-07
 */

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Menu, X, LogIn, ArrowRight, ChevronDown } from 'lucide-react';

const PRIMARY_NAV = [
  { label: 'Pour les enseignes', href: '/pour-les-enseignes' },
  { label: 'Pour les pros', href: '/pour-les-pros' },
  { label: 'Pour les créateurs', href: '/pour-les-createurs' },
  { label: 'Comment ça marche', href: '/comment-ca-marche' },
];

// Blog masqué de la navigation tant qu'aucun article n'est publié (page vide
// = mauvaise impression). Les pages /blog et /blog/[slug] restent en place :
// il suffit de remettre l'entrée ici le jour de la première publication.
const SECONDARY_NAV = [
  { label: 'Pour les fournisseurs', href: '/fournisseurs' },
  { label: 'À propos', href: '/about' },
];

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export function LandingHeader(): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreMenuOpen) return;
    function handleClickOutside(event: MouseEvent): void {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') setMoreMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [moreMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo (lien home implicite) */}
          <Link
            href="/"
            className="flex items-center flex-shrink-0"
            aria-label="LinkMe — Accueil"
          >
            <Image
              src="/LINKME-logo-820x312px.png"
              alt="LinkMe"
              width={210}
              height={80}
              className="h-8 w-auto"
              style={{ width: 'auto', height: '32px' }}
              priority
            />
          </Link>

          {/* Desktop Navigation primaire (lg+) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {PRIMARY_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#183559]/70 hover:text-[#183559] transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}

            {/* Dropdown "Plus" pour items secondaires */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(prev => !prev)}
                className="flex items-center gap-1 text-sm font-medium text-[#183559]/70 hover:text-[#183559] transition-colors whitespace-nowrap"
                aria-expanded={moreMenuOpen}
                aria-haspopup="true"
              >
                Plus
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {moreMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black/5 py-2"
                  role="menu"
                >
                  {SECONDARY_NAV.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-[#183559]/80 hover:bg-gray-50 hover:text-[#183559]"
                      role="menuitem"
                      onClick={() => setMoreMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#183559] border border-[#183559]/20 rounded-lg hover:bg-[#183559]/5 transition-colors whitespace-nowrap"
            >
              <LogIn className="h-4 w-4" />
              Se connecter
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-lg hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
            >
              Demander l&apos;accès
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Button (touch target 44px) */}
          <button
            type="button"
            className="lg:hidden h-11 w-11 flex items-center justify-center text-[#183559] hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
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
          <div className="px-4 py-4 space-y-1">
            {ALL_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-3 text-base font-medium text-[#183559] hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-[#183559] border border-[#183559]/20 rounded-lg hover:bg-[#183559]/5 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                Se connecter
              </Link>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#5DBEBB] to-[#5DBEBB]/80 rounded-lg hover:from-[#4CA9A6] hover:to-[#4CA9A6]/80 transition-all"
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
