import { buildCloudflareImageUrl } from '@verone/utils';

interface JsonLdProductProps {
  name: string;
  description: string | null;
  slug: string;
  price: number | null;
  imageUrl: string | null;
  cloudflareImageId?: string | null;
  manufacturer: string | null;
  sku: string | null;
  inStock?: boolean;
  reviewCount?: number;
  averageRating?: number;
}

function resolveSeoImage(
  cloudflareImageId: string | null | undefined,
  fallback: string | null
): string | null {
  if (cloudflareImageId) {
    try {
      return buildCloudflareImageUrl(cloudflareImageId, 'public');
    } catch {
      // Cloudflare non configuré côté serveur → fallback
    }
  }
  return fallback;
}

export function JsonLdProduct({
  name,
  description,
  slug,
  price,
  imageUrl,
  cloudflareImageId,
  manufacturer,
  sku,
  inStock = true,
  reviewCount,
  averageRating,
}: JsonLdProductProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr';
  const seoImage = resolveSeoImage(cloudflareImageId, imageUrl);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description:
      description ?? `${name} — Vérone, concept store déco & mobilier`,
    url: `${siteUrl}/produit/${slug}`,
    ...(seoImage ? { image: seoImage } : {}),
    ...(sku ? { sku } : {}),
    // Schema.org standard property name 'brand' (kept), value comes from product manufacturer
    ...(manufacturer
      ? {
          brand: {
            '@type': 'Brand',
            name: manufacturer,
          },
        }
      : {}),
    ...(reviewCount && reviewCount > 0 && averageRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: averageRating.toFixed(1),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/produit/${slug}`,
      priceCurrency: 'EUR',
      ...(price ? { price: price.toFixed(2) } : {}),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Vérone',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'EUR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'FR',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 5,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 8,
            unitCode: 'WK',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'FR',
        returnPolicyCategory:
          'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
