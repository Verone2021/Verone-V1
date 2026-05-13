'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useCollections } from '@/hooks/use-collections';

export function CollectionsListGrid() {
  const { data: collections, isLoading } = useCollections();

  // Grid : 2 colonnes par défaut, 3 colonnes quand on a au moins 3 collections.
  // Évite les énormes tuiles à 50 % d'écran chacune quand le catalogue n'a que
  // 2 collections (cas constaté en prod 2026-05-13).
  const colsClass =
    (collections?.length ?? 0) >= 3
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2';

  if (isLoading) {
    return (
      <section className="w-full bg-verone-white px-1">
        <div className={`grid gap-[6px] ${colsClass}`}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="relative aspect-[3/4] animate-pulse bg-verone-pearl-soft"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <section className="w-full bg-verone-white px-5 py-24 text-center md:px-16">
        <p className="font-bodoni text-[24px] italic text-verone-pearl">
          Les univers arrivent bientôt.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full bg-verone-white px-1">
      <div className={`grid gap-[6px] ${colsClass}`}>
        {collections.map(collection => (
          <Link
            key={collection.id}
            href={`/collections/${collection.slug ?? collection.id}`}
            className="group relative aspect-[3/4] cursor-pointer overflow-hidden bg-verone-pearl-soft"
          >
            {collection.image_url ? (
              <Image
                src={collection.image_url}
                alt={collection.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-dm-sans text-[11px] font-light uppercase tracking-[0.32em] text-verone-pearl">
                  Image à venir
                </span>
              </div>
            )}

            {/* Overlay gradient charbon */}
            <div className="absolute inset-0 bg-gradient-to-t from-verone-charbon/80 via-verone-charbon/20 to-transparent" />

            {/* Contenu en bas */}
            <div className="absolute inset-x-0 bottom-0 px-6 pb-10 md:px-10">
              <span className="mb-2 block font-dm-sans text-[13px] font-light uppercase tracking-[0.4em] text-verone-white">
                {collection.name}
              </span>
              {collection.description && (
                <p className="mb-6 max-w-[280px] font-montserrat text-[14px] leading-[1.5] text-verone-white/80">
                  {collection.description}
                </p>
              )}
              <span className="inline-block border-b border-verone-or pb-1 font-dm-sans text-[12px] font-light uppercase tracking-[0.2em] text-verone-or">
                Découvrir →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
