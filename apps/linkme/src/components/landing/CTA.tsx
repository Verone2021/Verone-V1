'use client';

/**
 * Landing Page CTA Section - LinkMe
 *
 * Section call-to-action avec:
 * - Titre accrocheur
 * - Bouton CTA principal avec gradient
 * - Effet glow subtil
 *
 * @module LandingCTA
 * @since 2026-01-07
 */

import Link from 'next/link';

import { ArrowRight, Sparkles } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#183559] via-[#183559] to-[#3976BB]" />

      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
        <div className="absolute inset-0 bg-[#5DBEBB]/20 rounded-full blur-[100px] animate-pulse" />
      </div>
      <div className="absolute top-0 right-0 w-[400px] h-[400px]">
        <div className="absolute inset-0 bg-[#7E84C0]/20 rounded-full blur-[80px]" />
      </div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px]">
        <div className="absolute inset-0 bg-[#3976BB]/30 rounded-full blur-[60px]" />
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-8">
          <Sparkles className="h-8 w-8 text-[#5DBEBB]" />
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
          Pret a rejoindre notre{' '}
          <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
            reseau
          </span>{' '}
          ?
        </h2>

        {/* Subtitle */}
        <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
          Commencez des aujourd&apos;hui a monetiser votre audience. Inscription
          gratuite, sans engagement.
        </p>

        {/* CTA Button */}
        <div className="mt-10">
          <Link
            href="#contact"
            className="group inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-[#183559] bg-white rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            Devenir partenaire
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex items-center justify-center gap-6 text-white/50 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Inscription gratuite
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Sans engagement
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Support dedie
          </span>
        </div>
      </div>
    </section>
  );
}
