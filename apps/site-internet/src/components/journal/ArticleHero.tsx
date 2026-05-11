import Image from 'next/image';

import type { Article } from '@/lib/article-types';

interface ArticleHeroProps {
  article: Pick<
    Article,
    | 'title'
    | 'excerpt'
    | 'cover_image_url'
    | 'cover_image_alt'
    | 'category'
    | 'reading_time_minutes'
    | 'published_at'
    | 'author_name'
  >;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ArticleHero({ article }: ArticleHeroProps) {
  return (
    <header className="relative w-full overflow-hidden bg-[#1d1d1b]">
      {/* Image avec overlay */}
      <div className="relative aspect-[16/9] md:aspect-[21/9]">
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={article.cover_image_alt}
            fill
            priority
            className="object-cover opacity-60"
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-[#1d1d1b]" />
        )}

        {/* Overlay gradient bas */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1d1d1b] via-[#1d1d1b]/40 to-transparent" />

        {/* Contenu overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 md:px-8 md:pb-12 lg:px-16">
          {/* Badge catégorie */}
          <div className="mb-4 inline-block bg-[#C9A961] px-3 py-1">
            <span className="font-dm-sans text-[10px] uppercase tracking-widest text-[#1d1d1b]">
              {article.category}
            </span>
          </div>

          {/* Titre */}
          <h1 className="font-bodoni mb-4 text-3xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            {article.title}
          </h1>

          {/* Excerpt */}
          <p className="font-montserrat mb-6 max-w-2xl text-base leading-relaxed text-[#E6E5E2] md:text-xl">
            {article.excerpt}
          </p>

          {/* Meta */}
          <div className="font-dm-sans flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-widest text-[#9B9B98]">
            <span>{article.author_name}</span>
            {article.published_at && (
              <>
                <span className="text-[#C9A961]">·</span>
                <span>{formatDate(article.published_at)}</span>
              </>
            )}
            <span className="text-[#C9A961]">·</span>
            <span>{article.reading_time_minutes} min de lecture</span>
          </div>
        </div>
      </div>
    </header>
  );
}
