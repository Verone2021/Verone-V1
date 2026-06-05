'use client';

/**
 * Landing Page Marketplace Section - LinkMe
 *
 * Vitrine catalogue public :
 * - Vrais produits du catalogue (vue linkme_public_products) si disponibles,
 *   sinon exemples par défaut.
 * - Visiteur NON connecté → prix masqués (« Prix sur accès »), conformément
 *   au catalogue public LinkMe.
 * - Deux CTA : devenir ambassadeur / référencer son catalogue.
 *
 * @module LandingMarketplace
 * @since 2026-01-23
 * @updated 2026-06-05 - LINKME-DB-001 / LINKME-CATALOGUE-001 : vrais produits,
 *                       prix masqués, CTA ambassadeur + fournisseur.
 */

import Image from 'next/image';
import Link from 'next/link';

import { ShoppingBag, ArrowRight, Star, Sparkles } from 'lucide-react';

import type { PublicProduct } from '@/lib/linkme-public-products';

interface ICardProduct {
  id: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  badge: string | null;
}

// Exemples de repli si aucun produit réel n'est disponible
const FALLBACK_PRODUCTS: ICardProduct[] = [
  {
    id: 'showcase-1',
    name: 'Table basse design',
    category: 'Mobilier',
    imageUrl: null,
    badge: null,
  },
  {
    id: 'showcase-2',
    name: "Lampe d'ambiance LED",
    category: 'Éclairage',
    imageUrl: null,
    badge: 'Populaire',
  },
  {
    id: 'showcase-3',
    name: "Plante d'intérieur grand format",
    category: 'Végétal',
    imageUrl: null,
    badge: null,
  },
  {
    id: 'showcase-4',
    name: 'Enceinte connectée',
    category: 'Électronique',
    imageUrl: null,
    badge: null,
  },
];

interface ILandingMarketplaceProps {
  products?: PublicProduct[];
}

export function LandingMarketplace({
  products,
}: ILandingMarketplaceProps): JSX.Element {
  const realProducts: ICardProduct[] = (products ?? []).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    imageUrl: p.imageUrl,
    badge: p.isFeatured ? 'Mis en avant' : null,
  }));

  const cards = realProducts.length > 0 ? realProducts : FALLBACK_PRODUCTS;

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
            Découvre une sélection de notre catalogue. Connecte-toi pour voir
            les prix et fixer ta marge sur chaque produit.
          </p>
        </div>

        {/* Products grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(product => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              {/* Image container */}
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <ShoppingBag className="h-16 w-16 text-gray-300" />
                  </div>
                )}

                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-[#5DBEBB] text-white text-xs font-medium rounded-full">
                    <Sparkles className="h-3 w-3" />
                    {product.badge}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {product.category && (
                  <div className="text-xs text-[#5DBEBB] font-medium mb-1">
                    {product.category}
                  </div>
                )}
                <h3 className="font-bold text-[#183559] mb-3 line-clamp-1">
                  {product.name}
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#183559]/50">
                    Prix sur accès
                  </span>
                  <span className="rounded-full bg-[#5DBEBB]/10 px-3 py-1 text-xs font-medium text-[#5DBEBB]">
                    Marge configurable
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA — devenir ambassadeur / référencer son catalogue */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact?type=createur"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#183559] text-white font-semibold rounded-xl hover:bg-[#183559]/90 transition-colors"
          >
            Devenir ambassadeur
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/contact?type=fournisseur"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#183559]/20 text-[#183559] font-semibold rounded-xl hover:bg-[#183559]/5 transition-colors"
          >
            Référencer mon catalogue
            <ArrowRight className="h-5 w-5" />
          </Link>
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
            Nous référençons les produits de nos partenaires. Stockage dans nos
            entrepôts ou expédition par vos soins — nous gérons la logistique
            pour vous.
          </p>
          <Link
            href="/contact?type=fournisseur"
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
