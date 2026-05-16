/**
 * JSON-LD helpers (Schema.org)
 *
 * Composants serveur qui injectent du JSON-LD pour aider les moteurs
 * de recherche à comprendre le contenu (Organization, FAQPage, Article).
 *
 * @module JsonLd
 * @since 2026-05-15 - LM-SEO-NAV-BLOG-001
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://linkme.verone.io';

interface IFaqItem {
  q: string;
  a: string;
}

export function OrganizationJsonLd(): JSX.Element {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LinkMe',
    url: SITE_URL,
    logo: `${SITE_URL}/LINKME-logo-820x312px.png`,
    description:
      "Plateforme d'affiliation multi-marques — enseignes, professionnels et créateurs.",
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface IFaqJsonLdProps {
  items: IFaqItem[];
}

export function FaqJsonLd({ items }: IFaqJsonLdProps): JSX.Element {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface IArticleJsonLdProps {
  title: string;
  description: string;
  slug: string;
  date: string;
  image?: string;
}

export function ArticleJsonLd({
  title,
  description,
  slug,
  date,
  image,
}: IArticleJsonLdProps): JSX.Element {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: `${SITE_URL}/blog/${slug}`,
    datePublished: date,
    dateModified: date,
    image: image ?? `${SITE_URL}/og-image.png`,
    author: {
      '@type': 'Organization',
      name: 'LinkMe',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'LinkMe',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/LINKME-logo-820x312px.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
