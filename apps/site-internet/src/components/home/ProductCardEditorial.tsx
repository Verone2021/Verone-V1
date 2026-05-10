import Link from 'next/link';

import { CloudflareImage } from '@verone/ui';

const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const priceFormatterWithDecimals = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export interface ProductCardEditorialProps {
  name: string;
  slug: string;
  priceTtc: number | null;
  imageUrl: string | null;
  cloudflareImageId: string | null;
  priority?: boolean;
  /** Si présent et > 0, affiche le prix initial barré */
  discountRate?: number | null;
  /** Si "out_of_stock", affiche un overlay "Rupture" */
  stockStatus?: string | null;
  /** Affiche les centimes (catalogue) au lieu d'arrondir (home) */
  showCents?: boolean;
}

export function ProductCardEditorial({
  name,
  slug,
  priceTtc,
  imageUrl,
  cloudflareImageId,
  priority = false,
  discountRate,
  stockStatus,
  showCents = false,
}: ProductCardEditorialProps) {
  const isOutOfStock = stockStatus === 'out_of_stock';
  const hasDiscount = discountRate != null && discountRate > 0;
  const originalPrice =
    hasDiscount && priceTtc != null && discountRate != null
      ? priceTtc / (1 - discountRate / 100)
      : null;

  const formatter = showCents ? priceFormatterWithDecimals : priceFormatter;
  const formattedPrice =
    priceTtc != null && priceTtc > 0
      ? formatter.format(priceTtc)
      : 'Sur demande';
  const formattedOriginal =
    originalPrice != null ? formatter.format(originalPrice) : null;

  return (
    <Link
      href={`/produit/${slug}`}
      className="group block transition-shadow duration-[320ms] ease-editorial hover:shadow-[0_12px_40px_-16px_rgba(29,29,27,0.18)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-verone-pearl-soft">
        {imageUrl || cloudflareImageId ? (
          <CloudflareImage
            cloudflareId={cloudflareImageId ?? null}
            fallbackSrc={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className={`object-cover grayscale transition-all duration-[700ms] ease-editorial group-hover:scale-[1.03] group-hover:grayscale-0 ${
              isOutOfStock ? 'opacity-50' : ''
            }`}
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-dm-sans text-[10px] font-light uppercase tracking-[0.32em] text-verone-pearl">
              Image à venir
            </span>
          </div>
        )}

        {isOutOfStock && (
          <span className="absolute left-3 top-3 z-10 bg-verone-charbon px-2.5 py-1 font-dm-sans text-[10px] font-light uppercase tracking-[0.2em] text-verone-white">
            Rupture
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-1">
        <h3 className="font-montserrat text-[15px] font-normal leading-snug text-verone-charbon transition-colors duration-[180ms] ease-editorial group-hover:text-verone-or group-hover:underline group-hover:decoration-verone-or group-hover:decoration-1 group-hover:underline-offset-4">
          {name}
        </h3>
        <div className="flex items-baseline gap-2">
          <p className="font-montserrat text-[15px] font-normal tabular-nums text-verone-charbon">
            {formattedPrice}
          </p>
          {formattedOriginal && (
            <p className="font-montserrat text-[13px] font-normal tabular-nums text-verone-pearl line-through">
              {formattedOriginal}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
