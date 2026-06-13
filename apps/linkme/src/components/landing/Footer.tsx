'use client';

/**
 * Landing Page Footer - LinkMe
 *
 * Footer complet avec:
 * - 4 colonnes (A propos, Liens, Contact, Newsletter)
 * - Reseaux sociaux
 * - Copyright
 *
 * @module LandingFooter
 * @since 2026-01-07
 * @updated 2026-01-23 - Liens vers vraies pages, newsletter desactivee
 */

import Image from 'next/image';
import Link from 'next/link';

import { Send, Mail, MapPin } from 'lucide-react';

// Footer links — 3 colonnes
const LINKS = {
  navigation: [
    { label: 'Accueil', href: '/' },
    { label: 'Pour les enseignes', href: '/pour-les-enseignes' },
    { label: 'Pour les pros', href: '/pour-les-pros' },
    { label: 'Pour les créateurs', href: '/pour-les-createurs' },
    { label: 'Comment ça marche', href: '/comment-ca-marche' },
    { label: 'Blog', href: '/blog' },
  ],
  partners: [
    { label: 'Pour les fournisseurs', href: '/fournisseurs' },
    { label: 'À propos', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Mentions légales', href: '/cgu' },
    { label: 'CGU', href: '/cgu' },
    { label: 'Politique de confidentialité', href: '/privacy' },
  ],
};

// Réseaux sociaux masqués tant que les vrais comptes LinkMe n'existent pas
// (consigne sprint 2026-06-03 : pas de liens vers des comptes génériques).

export function LandingFooter(): JSX.Element {
  return (
    <footer id="contact" className="bg-[#183559] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/LINKME-logo-820x312px.png"
                alt="LinkMe"
                width={120}
                height={46}
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed">
              Plateforme d&apos;affiliation multi-marques pour les enseignes,
              les professionnels prescripteurs et les créateurs de contenu.
            </p>
          </div>

          {/* Links - Navigation */}
          <div>
            <h3 className="font-semibold text-base mb-4">Navigation</h3>
            <ul className="space-y-3">
              {LINKS.navigation.map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links - Partenaires & À propos */}
          <div>
            <h3 className="font-semibold text-base mb-4">Partenaires</h3>
            <ul className="space-y-3">
              {LINKS.partners.map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="font-semibold text-base mb-4 mt-6">Légal</h3>
            <ul className="space-y-3">
              {LINKS.legal.map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div>
            <h3 className="font-semibold text-base mb-4">Newsletter</h3>
            <p className="text-white/60 text-sm mb-4">
              Bientôt disponible — inscrivez-vous pour recevoir nos actualités.
            </p>
            {/* Newsletter desactivee pour l'instant */}
            <div className="relative mb-6 opacity-50 pointer-events-none">
              <input
                type="email"
                disabled
                placeholder="Votre email"
                className="w-full px-4 py-2.5 pr-12 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/40"
              />
              <button
                type="button"
                disabled
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md bg-[#5DBEBB]/50 text-white"
                aria-label="S'inscrire"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Contact — renvoie vers le formulaire unifié (pas d'email exposé) */}
            <div className="space-y-2 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  Nous écrire
                </Link>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>France</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} LinkMe. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/cgu" className="hover:text-white transition-colors">
              CGU
            </Link>
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Confidentialité
            </Link>
            <Link
              href="/cookies"
              className="hover:text-white transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
