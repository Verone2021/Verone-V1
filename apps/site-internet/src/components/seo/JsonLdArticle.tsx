import type { Article } from '@/lib/article-types';

interface JsonLdArticleProps {
  article: Pick<
    Article,
    | 'title'
    | 'excerpt'
    | 'slug'
    | 'cover_image_url'
    | 'og_image_url'
    | 'published_at'
    | 'updated_at'
    | 'author_name'
    | 'category'
    | 'tags'
  >;
}

export function JsonLdArticle({ article }: JsonLdArticleProps) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://veronecollections.fr';
  const articleUrl = `${siteUrl}/journal/${article.slug}`;
  const imageUrl = article.og_image_url ?? article.cover_image_url;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    url: articleUrl,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(article.published_at ? { datePublished: article.published_at } : {}),
    dateModified: article.updated_at,
    author: {
      '@type': 'Person',
      name: article.author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Vérone',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon.png`,
      },
    },
    articleSection: article.category,
    keywords: article.tags.join(', '),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
