import Image from 'next/image';
import Link from 'next/link';

import type { Article } from '@/lib/article-types';

interface ArticleRelatedSectionProps {
  articles: Pick<
    Article,
    | 'id'
    | 'slug'
    | 'title'
    | 'cover_image_url'
    | 'cover_image_alt'
    | 'category'
    | 'reading_time_minutes'
  >[];
}

export function ArticleRelatedSection({
  articles,
}: ArticleRelatedSectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="bg-[#1d1d1b] px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-bodoni mb-12 text-center text-3xl text-white md:text-4xl">
          D'autres idées
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map(article => (
            <Link
              key={article.id}
              href={`/journal/${article.slug}`}
              className="group block"
              aria-label={article.title}
            >
              <div className="relative mb-4 aspect-[3/2] overflow-hidden bg-[#2a2a28]">
                {article.cover_image_url ? (
                  <Image
                    src={article.cover_image_url}
                    alt={article.cover_image_alt}
                    fill
                    className="object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 400px"
                  />
                ) : (
                  <div className="h-full w-full bg-[#2a2a28]" />
                )}
              </div>

              <p className="font-dm-sans mb-2 text-[10px] uppercase tracking-[0.2em] text-[#C9A961]">
                {article.category}
              </p>
              <h3 className="font-bodoni text-lg leading-snug text-white transition-colors group-hover:text-[#C9A961]">
                {article.title}
              </h3>
              <p className="font-dm-sans mt-2 text-[10px] uppercase tracking-widest text-[#9B9B98]">
                {article.reading_time_minutes} min
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
