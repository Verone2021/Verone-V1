'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useCollections } from '@/hooks/use-collections';

export function CollectionsSection() {
  const { data: collections, isLoading } = useCollections();
  const featured = collections?.slice(0, 3);

  return (
    <section className="bg-verone-white px-6 py-24 md:px-16 md:py-24">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-16">
        <span className="font-dm-sans text-[12px] font-medium uppercase tracking-[0.32em] text-verone-pearl">
          Nos collections
        </span>

        {isLoading && (
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-verone-pearl-soft md:aspect-[3/2]" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && featured && featured.length > 0 && (
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
            {featured.map(collection => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug ?? collection.id}`}
                className="group relative block aspect-square overflow-hidden bg-verone-pearl-soft md:aspect-[3/2]"
              >
                {collection.image_url && (
                  <Image
                    src={collection.image_url}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-[700ms] ease-editorial group-hover:scale-[1.05]"
                  />
                )}

                {/* Gradient overlay charbon bas + label centré */}
                <div className="absolute inset-x-0 bottom-0 flex h-1/3 items-end justify-center bg-gradient-to-t from-verone-charbon/85 to-transparent pb-8">
                  <h3 className="font-bodoni text-[28px] font-black leading-tight text-verone-white md:text-[32px]">
                    {collection.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
