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
 */

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  Send,
  Mail,
  MapPin,
  Phone,
  Instagram,
  Linkedin,
  Facebook,
} from 'lucide-react';

// Footer links
const LINKS = {
  about: [
    { label: 'Notre histoire', href: '#about' },
    { label: 'Equipe', href: '#team' },
    { label: 'Carrieres', href: '#careers' },
  ],
  useful: [
    { label: 'Comment ca marche', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Conditions generales', href: '/cgu' },
    { label: 'Politique de confidentialite', href: '/privacy' },
  ],
};

// Social links
const SOCIALS = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Facebook, href: '#', label: 'Facebook' },
];

export function LandingFooter(): JSX.Element {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent): void => {
    e.preventDefault();
    if (email) {
      // TODO: Implement newsletter subscription
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

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
              Plateforme d&apos;affiliation B2B pour les professionnels de la
              decoration et du mobilier d&apos;interieur.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 mt-6">
              {SOCIALS.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links - A propos */}
          <div>
            <h3 className="font-semibold text-base mb-4">A propos</h3>
            <ul className="space-y-3">
              {LINKS.about.map(link => (
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

          {/* Links - Utiles */}
          <div>
            <h3 className="font-semibold text-base mb-4">Liens utiles</h3>
            <ul className="space-y-3">
              {LINKS.useful.map(link => (
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
              Recevez nos actualites et offres exclusives.
            </p>
            <form onSubmit={handleSubscribe} className="relative mb-6">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Votre email"
                className="w-full px-4 py-2.5 pr-12 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#5DBEBB] transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md bg-[#5DBEBB] text-white hover:bg-[#4CA9A6] transition-colors"
                aria-label="S'inscrire"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            {subscribed && (
              <p className="text-[#5DBEBB] text-sm mb-4">
                Merci pour votre inscription !
              </p>
            )}

            {/* Contact info */}
            <div className="space-y-2 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a
                  href="mailto:contact@linkme.fr"
                  className="hover:text-white transition-colors"
                >
                  contact@linkme.fr
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Paris, France</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} LinkMe by Verone. Tous droits
            reserves.
          </p>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/cgu" className="hover:text-white transition-colors">
              CGU
            </Link>
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Confidentialite
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
