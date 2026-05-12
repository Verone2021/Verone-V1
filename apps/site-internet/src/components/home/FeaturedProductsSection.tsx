'use client';

import Link from 'next/link';

import { useFeaturedHomeProducts } from '@/hooks/use-featured-home-products';

import { ProductCardEditorial } from './ProductCardEditorial';

export function FeaturedProductsSection() {
  const { data: products, isLoading } = useFeaturedHomeProducts();

  // Filtrer les produits sans slug (ne peuvent pas être liés)
  const displayProducts = (products ?? []).filter(
    (p): p is typeof p & { slug: string } => p.slug !== null && p.slug !== ''
  );

  return (
    <section className="bg-verone-white px-6 py-24 md:px-16 md:py-24">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-12">
        <span className="font-dm-sans text-[12px] font-medium uppercase tracking-[0.32em] text-verone-pearl">
          CE QUI VIENT D&apos;ENTRER
        </span>

        {isLoading && (
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-verone-pearl-soft" />
                <div className="mt-5 space-y-2">
                  <div className="h-4 w-3/4 bg-verone-pearl-soft" />
                  <div className="h-4 w-1/3 bg-verone-pearl-soft" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && displayProducts.length > 0 && (
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayProducts.slice(0, 4).map((product, index) => (
              <ProductCardEditorial
                key={product.id}
                name={product.commercial_name ?? product.name}
                slug={product.slug}
                priceTtc={product.price_ttc}
                imageUrl={product.primary_image_url}
                cloudflareImageId={product.primary_cloudflare_image_id}
                priority={index < 2}
              />
            ))}
          </div>
        )}

        {!isLoading && displayProducts.length > 0 && (
          <Link
            href="/catalogue"
            className="font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-charbon underline decoration-verone-or decoration-1 underline-offset-[6px] transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
          >
            VOIR TOUTE LA SÉLECTION
          </Link>
        )}
      </div>
    </section>
  );
}
