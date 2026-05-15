/**
 * Robots.txt dynamique LinkMe
 *
 * Configure les regles de crawl pour les moteurs de recherche
 *
 * @module Robots
 * @since 2026-01-23
 */

import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://linkme.verone.io';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/dashboard/',
          '/ma-selection',
          '/ma-selection/',
          '/mes-produits/',
          '/mes-selections/',
          '/commandes',
          '/commandes/',
          '/commissions/',
          '/profil',
          '/profil/',
          '/parametres/',
          '/checkout',
          '/confirmation',
          '/aide',
          '/contacts',
          '/statistiques',
          '/stockage',
          '/_next/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
