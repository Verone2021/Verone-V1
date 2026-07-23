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
import { getAllLinkmePublicProducts } from '@/lib/linkme-public-products';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://linkme.network';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
      url: `${SITE_URL}/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
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
  ];

  // Catalogue public : la page /produits + une entrée par fiche produit cochée
  // en vitrine. L'index n'est référencé que s'il y a au moins un produit
  // (proposer un catalogue vide à Google dessert le référencement).
  const products = await getAllLinkmePublicProducts();
  const catalogPages: MetadataRoute.Sitemap =
    products.length === 0
      ? []
      : [
          {
            url: `${SITE_URL}/produits`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.9,
          },
          ...products
            .filter((p): p is typeof p & { slug: string } => Boolean(p.slug))
            .map(p => ({
              url: `${SITE_URL}/produits/${p.slug}`,
              lastModified: now,
              changeFrequency: 'weekly' as const,
              priority: 0.7,
            })),
        ];

  // Articles blog publiés. L'index /blog n'est référencé que s'il a du contenu :
  // proposer une page vide à Google dessert le référencement du site.
  const articles = getPublishedArticles();
  const blogPages: MetadataRoute.Sitemap =
    articles.length === 0
      ? []
      : [
          {
            url: `${SITE_URL}/blog`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.7,
          },
          ...articles.map(article => ({
            url: `${SITE_URL}/blog/${article.slug}`,
            lastModified: new Date(article.date),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
          })),
        ];

  return [...staticPages, ...catalogPages, ...blogPages];
}
