/**
 * Layout pour les pages legales LinkMe
 * Design simple avec logo et retour accueil
 *
 * @module LegalLayout
 * @since 2026-01-23
 */

import Image from 'next/image';
import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/LINKME-logo-820x312px.png"
              alt="LinkMe"
              width={100}
              height={38}
              className="h-7 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">{children}</main>

      {/* Footer simple */}
      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} LinkMe by Verone</p>
          <div className="flex gap-6">
            <Link href="/cgu" className="hover:text-gray-900 transition-colors">
              CGU
            </Link>
            <Link
              href="/privacy"
              className="hover:text-gray-900 transition-colors"
            >
              Confidentialite
            </Link>
            <Link
              href="/cookies"
              className="hover:text-gray-900 transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
