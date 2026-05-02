'use client';

import Image, { type ImageProps } from 'next/image';

import { buildCloudflareImageUrl } from '@verone/utils';
import type { CloudflareImageVariant } from '@verone/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface CloudflareImageProps
  extends Omit<ImageProps, 'src' | 'placeholder' | 'blurDataURL'> {
  /** ID Cloudflare Images (préféré si présent) */
  cloudflareId?: string | null;
  /** URL de fallback Supabase ou autre (utilisée si cloudflareId absent) */
  fallbackSrc?: string | null;
  /** Variante Cloudflare Images (défaut: 'public') */
  variant?: CloudflareImageVariant;
}

// Placeholder blur générique 1x1 px transparent
const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Composant Image intelligent qui utilise Cloudflare Images si disponible,
 * sinon le fallback Supabase, sinon un placeholder blur.
 *
 * Usage:
 * ```tsx
 * <CloudflareImage
 *   cloudflareId={product.cloudflare_image_id}
 *   fallbackSrc={product.public_url}
 *   alt={product.name}
 *   width={400}
 *   height={300}
 * />
 * ```
 *
 * Ne remplace PAS les usages existants dans cette PR — Phase 5.2 post-validation.
 */
export function CloudflareImage({
  cloudflareId,
  fallbackSrc,
  variant = 'public',
  alt,
  ...rest
}: CloudflareImageProps) {
  let src: string;

  if (cloudflareId) {
    try {
      src = buildCloudflareImageUrl(cloudflareId, variant);
    } catch {
      src = fallbackSrc ?? BLUR_PLACEHOLDER;
    }
  } else if (fallbackSrc) {
    src = fallbackSrc;
  } else {
    src = BLUR_PLACEHOLDER;
  }

  const isPlaceholder = src === BLUR_PLACEHOLDER;
  const isCloudflareSrc =
    src.includes('imagedelivery.net') ||
    src.includes('images.veronecollections.fr');

  return (
    <Image
      src={src}
      alt={alt}
      placeholder={isPlaceholder ? 'blur' : 'empty'}
      blurDataURL={isPlaceholder ? BLUR_PLACEHOLDER : undefined}
      unoptimized={isCloudflareSrc || isPlaceholder}
      {...rest}
    />
  );
}
