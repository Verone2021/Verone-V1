'use client';

import Link from 'next/link';

import { CloudflareImage } from '@verone/ui';

import { ArrowRight } from 'lucide-react';

import { useHeroContent } from '@/hooks/use-site-content';
import { useCatalogueProducts } from '@/hooks/use-catalogue-products';

export function HeroSection() {
  const { data: heroContent } = useHeroContent();
  const { data: products } = useCatalogueProducts({
    sortBy: 'newest',
    limit: 1,
    offset: 0,
  });

  const title = heroContent?.title ?? 'Des trouvailles qui changent tout';
  const subtitle =
    heroContent?.subtitle ??
    'Concept store en ligne — produits originaux, sourcés avec soin, au juste prix';
  const ctaText = heroContent?.cta_text ?? 'Découvrir la sélection';
  const ctaLink = heroContent?.cta_link ?? '/catalogue';

  const heroCloudflareId = products?.[0]?.primary_cloudflare_image_id ?? null;

  return (
    <section className="relative min-h-[90vh] flex items-center bg-verone-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-verone-gray-50 via-verone-white to-verone-gray-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="py-16 lg:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 mb-6 animate-fade-in-up">
              Concept Store
            </p>

            <h1
              className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold text-verone-black tracking-tight leading-[1.05] mb-8 animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              {title}
            </h1>

            <p
              className="text-lg text-verone-gray-600 max-w-lg mb-10 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              {subtitle}
            </p>

            <div
              className="flex flex-col sm:flex-row items-start gap-4 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <Link
                href={ctaLink}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-verone-black text-verone-white text-sm font-semibold uppercase tracking-wide hover:bg-verone-gray-800 transition-all duration-300 shadow-md hover:shadow-luxury"
              >
                {ctaText}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/collections"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-verone-black text-verone-black text-sm font-semibold uppercase tracking-wide hover:bg-verone-black hover:text-verone-white transition-all duration-300"
              >
                Collections
              </Link>
            </div>
          </div>

          {/* Right: Product Image */}
          <div
            className="relative hidden lg:block animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            {heroCloudflareId ? (
              <div className="relative aspect-[4/5] overflow-hidden bg-verone-gray-50">
                <CloudflareImage
                  cloudflareId={heroCloudflareId}
                  alt="Produit vedette Vérone"
                  fill
                  sizes="50vw"
                  className="object-contain p-8"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-[4/5] bg-verone-gray-100 flex items-center justify-center">
                <p className="text-verone-gray-400 text-sm uppercase tracking-wider">
                  Concept Store
                </p>
              </div>
            )}
          </div>
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
