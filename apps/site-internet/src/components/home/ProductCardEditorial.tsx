import Link from 'next/link';

import { CloudflareImage } from '@verone/ui';

const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export interface ProductCardEditorialProps {
  name: string;
  slug: string;
  priceTtc: number | null;
  imageUrl: string | null;
  cloudflareImageId: string | null;
  priority?: boolean;
}

export function ProductCardEditorial({
  name,
  slug,
  priceTtc,
  imageUrl,
  cloudflareImageId,
  priority = false,
}: ProductCardEditorialProps) {
  const formattedPrice =
    priceTtc != null && priceTtc > 0
      ? priceFormatter.format(priceTtc)
      : 'Sur demande';

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
            className="object-cover transition-transform duration-[620ms] ease-editorial group-hover:scale-[1.03]"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-dm-sans text-[10px] font-light uppercase tracking-[0.32em] text-verone-pearl">
              Image à venir
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-1">
        <h3 className="font-montserrat text-[15px] font-normal leading-snug text-verone-charbon transition-colors duration-[180ms] ease-editorial group-hover:text-verone-or group-hover:underline group-hover:decoration-verone-or group-hover:decoration-1 group-hover:underline-offset-4">
          {name}
        </h3>
        <p className="font-montserrat text-[15px] font-normal tabular-nums text-verone-charbon">
          {formattedPrice}
        </p>
      </div>
    </Link>
  );
}
