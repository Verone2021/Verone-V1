'use client';

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

export function InspirationBanner() {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-start overflow-hidden bg-verone-gray-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-verone-black via-verone-gray-900 to-verone-gray-800" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 w-full">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 mb-4">
            Inspiration
          </p>
          <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-bold text-verone-white leading-tight mb-6">
            Trouvez l&apos;inspiration pour votre intérieur
          </h2>
          <p className="text-verone-gray-400 leading-relaxed mb-8">
            Explorez nos collections pour trouver les associations parfaites
            pour votre espace. Des pièces originales, sourcées avec soin.
          </p>
          <Link
            href="/collections"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-amber-700 text-verone-white text-sm font-semibold uppercase tracking-wide hover:bg-amber-600 transition-all duration-300"
          >
            Explorer les collections
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
