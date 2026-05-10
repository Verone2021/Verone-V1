'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useCollections } from '@/hooks/use-collections';

export function CollectionsSection() {
  const { data: collections, isLoading } = useCollections();
  const featured = collections?.slice(0, 3);

  return (
    <section className="bg-verone-white px-6 py-24 md:px-16 md:py-24">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-12">
        <span className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-pearl md:text-xs">
          Nos univers
        </span>

        {isLoading && (
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-verone-pearl-soft" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && featured && featured.length > 0 && (
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(collection => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug ?? collection.id}`}
                className="group relative block aspect-[4/5] overflow-hidden bg-verone-pearl-soft"
              >
                {collection.image_url && (
                  <Image
                    src={collection.image_url}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition-transform duration-[620ms] ease-editorial group-hover:scale-[1.03]"
                  />
                )}

                {/* Overlay charbon bas pour le label */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-verone-charbon/85 via-verone-charbon/40 to-transparent p-6 md:p-8">
                  <h3 className="font-bodoni text-2xl font-black leading-tight text-verone-white md:text-[28px]">
                    {collection.name}
                  </h3>
                  <span className="mt-3 inline-block font-dm-sans text-[11px] font-light uppercase tracking-[0.28em] text-verone-or transition-colors duration-[180ms] ease-editorial group-hover:text-verone-white">
                    Découvrir →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && featured && featured.length > 0 && (
          <Link
            href="/collections"
            className="font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-charbon underline decoration-verone-or decoration-1 underline-offset-[6px] transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
          >
            Toutes nos collections
          </Link>
        )}
      </div>
    </section>
  );
}
