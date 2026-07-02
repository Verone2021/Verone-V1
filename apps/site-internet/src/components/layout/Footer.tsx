import Image from 'next/image';
import Link from 'next/link';

import { Facebook, Instagram, Twitter } from 'lucide-react';

import { NewsletterSignup } from '@/components/NewsletterSignup';

const footerLinks = {
  navigation: [
    { href: '/catalogue', label: 'Catalogue' },
    { href: '/collections', label: 'Collections' },
    { href: '/a-propos', label: 'À propos' },
    { href: '/contact', label: 'Contact' },
  ],
  legal: [
    { href: '/mentions-legales', label: 'Mentions légales' },
    { href: '/cgv', label: 'CGV' },
    { href: '/confidentialite', label: 'Confidentialité' },
    { href: '/cookies', label: 'Cookies' },
  ],
  help: [
    { href: '/livraison', label: 'Livraison' },
    { href: '/retours', label: 'Retours' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Nous contacter' },
  ],
};

const socialLinks = [
  { href: 'https://facebook.com', icon: Facebook, label: 'Facebook' },
  { href: 'https://instagram.com', icon: Instagram, label: 'Instagram' },
  { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
];

export function Footer() {
  return (
    <footer className="bg-verone-charbon text-verone-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 inline-block">
              <Image
                src="/logo-verone-clean.png"
                alt="Vérone"
                width={244}
                height={37}
                className="h-6 w-auto brightness-0 invert"
              />
            </Link>
            <p className="font-montserrat text-sm font-light leading-relaxed text-verone-pearl">
              Mille pièces vues, cinquante retenues. Pas un catalogue. Un
              regard.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-6 font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-pearl">
              EXPLORER
            </h4>
            <ul className="space-y-3">
              {footerLinks.navigation.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-montserrat text-sm text-verone-pearl transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="mb-6 font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-pearl">
              INFOS
            </h4>
            <ul className="space-y-3">
              {footerLinks.help.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-montserrat text-sm text-verone-pearl transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-6 font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-pearl">
              Légal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-montserrat text-sm text-verone-pearl transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <NewsletterSignup />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            {/* Copyright */}
            <p className="font-montserrat text-sm text-verone-pearl">
              &copy; {new Date().getFullYear()} Vérone. Tous droits réservés.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-6">
              {socialLinks.map(social => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-verone-pearl transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
