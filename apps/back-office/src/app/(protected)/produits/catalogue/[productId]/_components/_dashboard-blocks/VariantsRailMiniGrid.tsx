'use client';

/**
 * VariantsRailMiniGrid — thumbnails des variantes dans le rail si le produit
 * appartient à un variant_group. Sinon affiche un empty state discret.
 */

import Image from 'next/image';
import Link from 'next/link';

interface VariantThumb {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface VariantsRailMiniGridProps {
  variantGroupId: string | null;
  variants: VariantThumb[];
}

export function VariantsRailMiniGrid({
  variantGroupId,
  variants,
}: VariantsRailMiniGridProps) {
  if (!variantGroupId || variants.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Variantes
      </div>
      <div className="grid grid-cols-3 gap-1">
        {variants.slice(0, 5).map(v => (
          <Link
            key={v.id}
            href={`/produits/catalogue/${v.id}`}
            className="relative aspect-square rounded overflow-hidden bg-neutral-100 hover:ring-2 hover:ring-neutral-300 transition"
            title={v.name}
          >
            {v.imageUrl ? (
              <Image
                src={v.imageUrl}
                alt={v.name}
                fill
                sizes="60px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-neutral-200" />
            )}
          </Link>
        ))}
      </div>
      <Link
        href={`/produits/catalogue/variantes/${variantGroupId}`}
        className="block text-xs text-neutral-600 underline hover:text-neutral-900"
      >
        Voir toutes les variantes →
      </Link>
    </div>
  );
}
