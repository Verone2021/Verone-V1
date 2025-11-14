'use client';

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-verone-white overflow-hidden">
      {/* Background Gradient Subtle */}
      <div className="absolute inset-0 bg-gradient-to-b from-verone-gray-50 via-verone-white to-verone-white" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32 text-center">
        {/* Heading */}
        <h1 className="font-playfair text-6xl md:text-7xl lg:text-8xl font-bold text-verone-black tracking-tight leading-none mb-8 animate-fade-in-up">
          L'élégance
          <br />
          <span className="italic">à l'état pur</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg md:text-xl text-verone-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          Mobilier et décoration d'intérieur haut de gamme pour sublimer votre
          espace de vie avec raffinement et authenticité.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          {/* Primary CTA */}
          <Link
            href="/catalogue"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-verone-black text-verone-white text-sm font-semibold uppercase tracking-wide rounded-none hover:bg-verone-gray-800 transition-all duration-300 shadow-md hover:shadow-luxury"
          >
            Découvrir le catalogue
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          {/* Secondary CTA */}
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-verone-black text-verone-black text-sm font-semibold uppercase tracking-wide rounded-none hover:bg-verone-black hover:text-verone-white transition-all duration-300"
          >
            Collections
          </Link>
        </div>

        {/* Separator Line */}
        <div
          className="mt-20 flex items-center justify-center gap-4 animate-fade-in"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="h-px w-24 bg-verone-gray-300" />
          <p className="text-xs text-verone-gray-500 uppercase tracking-widest">
            Depuis 2024
          </p>
          <div className="h-px w-24 bg-verone-gray-300" />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in"
        style={{ animationDelay: '0.8s' }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-[1px] bg-verone-gray-400 animate-pulse" />
          <p className="text-xs text-verone-gray-500 uppercase tracking-wider">
            Défiler
          </p>
        </div>
      </div>
    </section>
  );
}
