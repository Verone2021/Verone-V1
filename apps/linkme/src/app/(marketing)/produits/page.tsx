/**
 * Catalogue public LinkMe — `/produits`
 *
 * Vitrine publique de TOUS les produits cochés « Vitrine publique » dans le
 * back-office (drapeau `channel_pricing.is_public_showcase`), classés par
 * catégorie, produits phares en tête. Accessible sans compte, AUCUN prix.
 *
 * Rendu statique (SSG/ISR) : lecture anonyme sans cookies via la vue
 * `linkme_public_products`. Se met à jour tout seul quand Roméo coche/décoche
 * un produit (revalidation ISR).
 *
 * @module produits/CataloguePage
 * @since 2026-07-23 - LM-PUB-CATALOG-001
 */

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

import { getAllLinkmePublicProducts } from '@/lib/linkme-public-products';

import { ProductsCatalogView } from './components/ProductsCatalogView';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Catalogue',
  description:
    'Découvre le catalogue de produits déco et mobilier LinkMe : mobilier, éclairage, linge de maison, objets décoratifs. Crée un compte pour voir les prix et fixer ta marge.',
  openGraph: {
    title: 'Catalogue LinkMe',
    description:
      'Le catalogue de produits déco et mobilier à référencer dans tes sélections LinkMe.',
    url: '/produits',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Catalogue LinkMe',
      },
    ],
  },
  alternates: {
    canonical: '/produits',
  },
};

export default async function CataloguePage(): Promise<JSX.Element> {
  const products = await getAllLinkmePublicProducts();

  return (
    <div className="bg-white">
      {/* En-tête */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-[#5DBEBB]/5 to-white">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 lg:px-8 lg:py-20">
          <span className="mb-4 inline-block rounded-full bg-[#3976BB]/10 px-4 py-1.5 text-sm font-medium text-[#3976BB]">
            Notre catalogue
          </span>
          <h1 className="text-3xl font-bold text-[#183559] sm:text-4xl lg:text-5xl">
            Des produits{' '}
            <span className="bg-gradient-to-r from-[#5DBEBB] to-[#7E84C0] bg-clip-text text-transparent">
              à mettre en avant
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#183559]/60">
            Parcours notre sélection déco et mobilier. Crée un compte pour voir
            les prix et fixer ta marge sur chaque produit.
          </p>
        </div>
      </section>

      {/* Grille catalogue */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <ProductsCatalogView products={products} />
      </section>

      {/* CTA bas de page */}
      {products.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#183559]">
              Envie de voir les prix et de te lancer ?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[#183559]/60">
              Crée ton compte LinkMe pour accéder aux tarifs, composer tes
              sélections et fixer ta marge sur chaque produit.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-[#183559] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#183559]/90"
              >
                Créer un compte
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#183559]/20 px-6 py-3 font-semibold text-[#183559] transition-colors hover:bg-[#183559]/5"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
