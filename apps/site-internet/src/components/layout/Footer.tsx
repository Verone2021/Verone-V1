import Link from 'next/link';

import { Facebook, Instagram, Twitter } from 'lucide-react';

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
    <footer className="bg-verone-black text-verone-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand */}
          <div>
            <h3 className="font-playfair text-2xl font-bold text-verone-white mb-4 tracking-tight">
              Vérone
            </h3>
            <p className="text-sm text-verone-gray-400 leading-relaxed">
              Mobilier et décoration d&apos;intérieur haut de gamme pour
              sublimer votre espace de vie.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-verone-white text-xs font-semibold mb-6 uppercase tracking-widest">
              Navigation
            </h4>
            <ul className="space-y-3">
              {footerLinks.navigation.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-verone-gray-400 hover:text-verone-white transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-verone-white text-xs font-semibold mb-6 uppercase tracking-widest">
              Aide
            </h4>
            <ul className="space-y-3">
              {footerLinks.help.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-verone-gray-400 hover:text-verone-white transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-verone-white text-xs font-semibold mb-6 uppercase tracking-widest">
              Légal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-verone-gray-400 hover:text-verone-white transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-verone-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <p className="text-sm text-verone-gray-500">
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
                    className="text-verone-gray-500 hover:text-verone-white transition-colors duration-300"
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
