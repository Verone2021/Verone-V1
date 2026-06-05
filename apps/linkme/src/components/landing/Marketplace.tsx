'use client';

/**
 * Landing Page Marketplace Section - LinkMe
 *
 * Section présentant une sélection de produits réels du catalogue :
 * - Produits hardcodés (pas de fetch dynamique)
 * - Images depuis Supabase Storage
 * - CTA vers le catalogue complet
 *
 * Note : les produits affiliés (ex : Pokawa) ne sont pas affichés ici
 * car cette fonctionnalité n'est pas encore publique.
 *
 * @module LandingMarketplace
 * @since 2026-01-23
 * @updated 2026-05-13 - LM-MKT-001 : accents.
 * @updated 2026-05-13 - LM-MKT-002 : catégories et produits showcase
 *                       multi-catégories (déco, éclairage, végétal,
 *                       électronique, mobilier).
 */

import Link from 'next/link';

import { ShoppingBag, ArrowRight, Star, Sparkles } from 'lucide-react';

/**
 * Produits showcase hardcodes
 *
 * A METTRE A JOUR: Ces produits sont des placeholders.
 * L'utilisateur doit choisir 2-3 vrais produits a afficher.
 */
const SHOWCASE_PRODUCTS = [
  {
    id: 'showcase-1',
    name: 'Table basse design',
    category: 'Mobilier',
    image: '/placeholder-product-1.jpg',
    basePrice: 280,
    badge: null,
  },
  {
    id: 'showcase-2',
    name: "Lampe d'ambiance LED",
    category: 'Éclairage',
    image: '/placeholder-product-2.jpg',
    basePrice: 145,
    badge: 'Populaire',
  },
  {
    id: 'showcase-3',
    name: "Plante d'intérieur grand format",
    category: 'Végétal',
    image: '/placeholder-product-3.jpg',
    basePrice: 89,
    badge: null,
  },
  {
    id: 'showcase-4',
    name: 'Enceinte connectée',
    category: 'Électronique',
    image: '/placeholder-product-4.jpg',
    basePrice: 195,
    badge: 'Nouveau',
  },
];

// Catégories pour le filtre visuel (multi-catégories)
const CATEGORIES = [
  'Tous',
  'Déco',
  'Éclairage',
  'Végétal',
  'Électronique',
  'Mobilier',
];

export function LandingMarketplace(): JSX.Element {
  return (
    <section id="marketplace" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-[#3976BB]/10 rounded-full text-sm font-medium text-[#3976BB] mb-4">
            Notre catalogue
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#183559]">
            Des produits{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
              de qualité
            </span>{' '}
            à vendre
          </h2>
          <p className="mt-4 text-lg text-[#183559]/60 max-w-2xl mx-auto">
            Produits sourcés avec soin dans plusieurs catégories — déco,
            éclairage, végétal, électronique et plus. Tu fixes ta marge sur
            chaque produit.
          </p>
        </div>

        {/* Category filter (visual only) */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((category, index) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                index === 0
                  ? 'bg-[#183559] text-white'
                  : 'bg-gray-100 text-[#183559]/70 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SHOWCASE_PRODUCTS.map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              {/* Image container */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {/* Placeholder image - remplacer par vraies images */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <ShoppingBag className="h-16 w-16 text-gray-300" />
                </div>

                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-[#5DBEBB] text-white text-xs font-medium rounded-full">
                    <Sparkles className="h-3 w-3" />
                    {product.badge}
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#183559]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-4 py-2 bg-white rounded-lg text-[#183559] font-medium text-sm">
                    Voir le produit
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="text-xs text-[#5DBEBB] font-medium mb-1">
                  {product.category}
                </div>
                <h3 className="font-bold text-[#183559] mb-2 line-clamp-1">
                  {product.name}
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-[#183559]">
                      {product.basePrice} EUR
                    </div>
                    <div className="text-xs text-[#183559]/50">
                      Prix base HT
                    </div>
                  </div>
                  <span className="rounded-full bg-[#5DBEBB]/10 px-3 py-1 text-xs font-medium text-[#5DBEBB]">
                    Marge configurable
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#183559] text-white font-semibold rounded-xl hover:bg-[#183559]/90 transition-colors"
          >
            Découvrir tout le catalogue
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-[#183559]/50">
            Plus de 500 produits disponibles dans notre catalogue
          </p>
        </div>

        {/* Affiliate products teaser */}
        <div className="mt-16 bg-gradient-to-r from-[#7E84C0]/10 via-[#5DBEBB]/10 to-[#3976BB]/10 rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-5 w-5 text-[#7E84C0]" />
            <span className="text-sm font-medium text-[#7E84C0]">
              Bientôt disponible
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#183559] mb-2">
            Vous avez vos propres produits ?
          </h3>
          <p className="text-[#183559]/60 max-w-xl mx-auto mb-6">
            Nous acceptons les produits de nos affiliés partenaires. Stockage
            dans nos entrepôts ou expédition par vos soins — nous gérons la
            logistique pour vous.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-[#7E84C0] font-medium hover:text-[#7E84C0]/80 transition-colors"
          >
            Contactez-nous pour en savoir plus
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
