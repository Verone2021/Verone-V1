/**
 * Section "Produits de cet article" — affichée si featured_product_ids non vide.
 * Charge les produits côté client via Supabase (join product_images).
 */
'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { createClient } from '@/lib/supabase/client';

interface FeaturedProduct {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  imageCfId: string | null;
}

interface ArticleProductsSectionProps {
  productIds: string[];
}

interface RawProduct {
  id: string;
  slug: string;
  name: string;
  product_images: {
    public_url: string | null;
    cloudflare_image_id: string | null;
  }[];
}

export function ArticleProductsSection({
  productIds,
}: ArticleProductsSectionProps) {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (productIds.length === 0) {
      setLoaded(true);
      return;
    }

    const supabase = createClient();
    void supabase
      .from('products')
      .select(
        'id, slug, name, product_images!inner(public_url, cloudflare_image_id)'
      )
      .in('id', productIds.slice(0, 4))
      .eq('product_images.is_primary', true)
      .then(({ data, error }) => {
        if (!error && data) {
          const mapped: FeaturedProduct[] = (
            data as unknown as RawProduct[]
          ).map(p => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            imageUrl: p.product_images[0]?.public_url ?? null,
            imageCfId: p.product_images[0]?.cloudflare_image_id ?? null,
          }));
          setProducts(mapped);
        }
        setLoaded(true);
      });
  }, [productIds]);

  if (!loaded || products.length === 0) return null;

  return (
    <section className="border-t border-[#E6E5E2] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-bodoni mb-10 text-3xl text-[#1d1d1b] md:text-4xl">
          Produits de cet article
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map(product => (
            <Link
              key={product.id}
              href={`/produit/${product.slug}`}
              className="group block"
              aria-label={product.name}
            >
              <div className="relative mb-3 aspect-[3/4] overflow-hidden bg-[#E6E5E2]">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="h-full w-full bg-[#E6E5E2]" />
                )}
              </div>
              <h3 className="font-bodoni line-clamp-2 text-sm text-[#1d1d1b] transition-colors group-hover:text-[#C9A961]">
                {product.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
