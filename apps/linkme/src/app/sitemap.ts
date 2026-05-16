/**
 * Sitemap dynamique LinkMe
 *
 * Genere automatiquement le sitemap.xml pour le SEO
 * Pages marketing publiques incluses : about, contact, comment-ca-marche,
 * pour-les-createurs, pour-les-pros, pour-les-enseignes.
 *
 * @module Sitemap
 * @since 2026-01-23
 * @updated 2026-05-14 - LM-PUB-002 release reconciliation
 * @updated 2026-05-15 - LM-SEO-NAV-BLOG-001 ajout /fournisseurs + articles blog
 */

import type { MetadataRoute } from 'next';

import { getPublishedArticles } from '@/lib/blog/articles';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://linkme.verone.io';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/cgu`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cookies`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/pour-les-createurs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/pour-les-pros`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/comment-ca-marche`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/pour-les-enseignes`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/fournisseurs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Articles blog publiés
  const articles = getPublishedArticles();
  const articlePages: MetadataRoute.Sitemap = articles.map(article => ({
    url: `${SITE_URL}/blog/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...articlePages];
}
