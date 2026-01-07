'use client';

/**
 * FeaturedCarousel
 * Carousel de produits vedettes avec auto-scroll
 * Design Amazon-style avec navigation et dots
 */

import { useState, useEffect, useCallback } from 'react';

import Image from 'next/image';

import { ChevronLeft, ChevronRight, Star, Package } from 'lucide-react';

import type { LinkMeCatalogProduct } from '@/lib/hooks/use-linkme-catalog';
import { cn } from '@/lib/utils';

interface FeaturedCarouselProps {
  products: LinkMeCatalogProduct[];
  onProductClick?: (product: LinkMeCatalogProduct) => void;
}

/**
 * Formate le prix en euros
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(price);
}

export function FeaturedCarousel({
  products,
  onProductClick,
}: FeaturedCarouselProps): JSX.Element | null {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filtrer les produits vedettes
  const featuredProducts = products.filter(p => p.is_featured);

  // Auto-scroll toutes les 5 secondes
  useEffect(() => {
    if (featuredProducts.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredProducts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredProducts.length, isPaused]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev =>
      prev === 0 ? featuredProducts.length - 1 : prev - 1
    );
  }, [featuredProducts.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % featuredProducts.length);
  }, [featuredProducts.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Ne rien afficher s'il n'y a pas de produits vedettes
  if (featuredProducts.length === 0) {
    return null;
  }

  const currentProduct = featuredProducts[currentIndex];

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-linkme-marine via-linkme-royal to-linkme-marine"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {featuredProducts.map(product => (
          <div
            key={product.id}
            className="min-w-full relative h-48 sm:h-56 md:h-64 cursor-pointer"
            onClick={() => onProductClick?.(product)}
          >
            {/* Background image avec overlay */}
            <div className="absolute inset-0">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover opacity-30"
                  sizes="100vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linkme-marine/50">
                  <Package className="h-16 w-16 text-white/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-linkme-marine/90 via-linkme-marine/70 to-transparent" />
            </div>

            {/* Contenu */}
            <div className="relative h-full flex items-center p-6 md:p-10">
              <div className="flex-1 max-w-lg">
                {/* Badge vedette */}
                <span className="inline-flex items-center gap-1.5 bg-linkme-turquoise text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-3 shadow-lg">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  Produit vedette
                </span>

                {/* Titre */}
                <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-2 line-clamp-2">
                  {product.custom_title || product.name}
                </h2>

                {/* Catégorie */}
                {product.category_name && (
                  <p className="text-white/70 text-sm mb-3">
                    {product.category_name}
                  </p>
                )}

                {/* Prix */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-white text-2xl md:text-3xl font-bold">
                    {formatPrice(product.selling_price_ht)}
                  </span>
                  <span className="text-white/60 text-sm">HT</span>
                </div>

                {/* CTA */}
                <button className="bg-white text-linkme-marine px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
                  Voir le produit
                </button>
              </div>

              {/* Image produit à droite (desktop) */}
              <div className="hidden md:block w-48 h-48 relative flex-shrink-0 ml-8">
                {product.image_url ? (
                  <div className="relative w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-contain p-4"
                      sizes="192px"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-white/10 rounded-xl flex items-center justify-center">
                    <Package className="h-16 w-16 text-white/30" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {featuredProducts.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {featuredProducts.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {featuredProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/40 hover:bg-white/60'
              )}
              aria-label={`Aller au slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {featuredProducts.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            key={currentIndex}
            className="h-full bg-linkme-turquoise animate-progress"
            style={{ animationDuration: '5s' }}
          />
        </div>
      )}
    </div>
  );
}
