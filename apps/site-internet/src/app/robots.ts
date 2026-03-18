import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/callback',
          '/checkout/success',
          '/checkout/cancel',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
