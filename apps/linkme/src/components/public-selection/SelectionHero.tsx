'use client';

import Image from 'next/image';

import { Package } from 'lucide-react';

interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

interface ISelectionHeroProps {
  name: string;
  description: string | null;
  imageUrl: string | null;
  branding: IBranding;
  productCount: number;
}

export function SelectionHero({
  name,
  description,
  imageUrl,
  branding,
  productCount,
}: ISelectionHeroProps): React.JSX.Element {
  return (
    <div className="relative h-40 md:h-48 overflow-hidden">
      {/* Background */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color})`,
          }}
        />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

      {/* Content */}
      <div className="relative h-full max-w-6xl mx-auto px-4 flex flex-col justify-end pb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {name}
            </h1>
            {description && (
              <p className="text-white/80 text-sm md:text-base max-w-2xl line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Product Count Badge */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
            <Package className="h-4 w-4 text-white" />
            <span className="text-white font-medium text-sm">
              {productCount} produit{productCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
