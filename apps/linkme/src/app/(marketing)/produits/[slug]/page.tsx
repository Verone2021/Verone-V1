/**
 * Fiche produit publique LinkMe — `/produits/[slug]`
 *
 * Page de détail d'un produit du catalogue public : photo, catégorie, nom,
 * description. AUCUN prix (bloc « Prix réservé aux comptes »). Rendu statique
 * (SSG) avec `generateStaticParams` sur les produits cochés en vitrine.
 *
 * @module produits/ProductSheet
 * @since 2026-07-23 - LM-PUB-CATALOG-001
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeft, Lock, ShoppingBag } from 'lucide-react';
import type { Metadata } from 'next';

import { CloudflareImage } from '@verone/ui';
import { buildCloudflareImageUrl } from '@verone/utils';

import { ProductJsonLd } from '@/components/seo/JsonLd';
import {
  getAllLinkmePublicProducts,
  getLinkmePublicProductBySlug,
} from '@/lib/linkme-public-products';

export const dynamic = 'force-static';
export const revalidate = 3600;

interface ProductSheetProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const products = await getAllLinkmePublicProducts();
  return products
    .filter((p): p is typeof p & { slug: string } => Boolean(p.slug))
    .map(p => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: ProductSheetProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getLinkmePublicProductBySlug(slug);

  if (!product) {
    return { title: 'Produit introuvable' };
  }

  const description =
    product.metaDescription ??
    product.description?.slice(0, 160) ??
    `${product.name} — catalogue déco et mobilier LinkMe.`;

  const image = product.cloudflareImageId
    ? safeCloudflareUrl(product.cloudflareImageId)
    : product.imageUrl;

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} — LinkMe`,
      description,
      url: `/produits/${slug}`,
      type: 'website',
      images: image
        ? [{ url: image, alt: product.name }]
        : [
            {
              url: '/og-image.png',
              width: 1200,
              height: 630,
              alt: product.name,
            },
          ],
    },
    alternates: {
      canonical: `/produits/${slug}`,
    },
  };
}

export default async function ProductSheet({
  params,
}: ProductSheetProps): Promise<JSX.Element> {
  const { slug } = await params;
  const product = await getLinkmePublicProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const image = product.cloudflareImageId
    ? safeCloudflareUrl(product.cloudflareImageId)
    : product.imageUrl;

  const paragraphs = (product.description ?? '')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="bg-white">
      <ProductJsonLd
        name={product.name}
        slug={slug}
        description={product.description ?? product.metaDescription}
        category={product.category}
        image={image}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Fil d'Ariane / retour */}
        <Link
          href="/produits"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#183559]/60 transition-colors hover:text-[#183559]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50">
            {product.cloudflareImageId || product.imageUrl ? (
              <CloudflareImage
                cloudflareId={product.cloudflareImageId}
                fallbackSrc={product.imageUrl}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <ShoppingBag className="h-20 w-20 text-gray-300" />
              </div>
            )}
          </div>

          {/* Détails */}
          <div className="flex flex-col">
            {product.category && (
              <div className="mb-2 text-sm font-medium text-[#5DBEBB]">
                {product.category}
              </div>
            )}
            <h1 className="text-3xl font-bold text-[#183559] sm:text-4xl">
              {product.name}
            </h1>

            {/* Description */}
            <div className="mt-6 space-y-4 text-[#183559]/70 leading-relaxed">
              {paragraphs.length > 0 ? (
                paragraphs.map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p className="text-[#183559]/50">
                  La description de ce produit arrive bientôt.
                </p>
              )}
            </div>

            {/* Bloc prix réservé aux comptes */}
            <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="flex items-center gap-2 text-[#183559]">
                <Lock className="h-5 w-5 text-[#5DBEBB]" />
                <span className="font-semibold">Prix réservé aux comptes</span>
              </div>
              <p className="mt-2 text-sm text-[#183559]/60">
                Crée un compte LinkMe pour voir le prix de ce produit, le
                référencer dans tes sélections et fixer ta marge.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl bg-[#183559] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#183559]/90"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-[#183559]/20 px-6 py-3 font-semibold text-[#183559] transition-colors hover:bg-[#183559]/5"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** URL Cloudflare avec repli silencieux si l'ID est invalide. */
function safeCloudflareUrl(cloudflareId: string): string | null {
  try {
    return buildCloudflareImageUrl(cloudflareId, 'public');
  } catch {
    return null;
  }
}
