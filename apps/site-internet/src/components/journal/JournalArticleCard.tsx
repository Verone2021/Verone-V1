import Image from 'next/image';
import Link from 'next/link';

import type { Article } from '@/lib/article-types';

interface JournalArticleCardProps {
  article: Pick<
    Article,
    | 'slug'
    | 'title'
    | 'excerpt'
    | 'cover_image_url'
    | 'cover_image_alt'
    | 'category'
    | 'reading_time_minutes'
    | 'published_at'
  >;
}

export function JournalArticleCard({ article }: JournalArticleCardProps) {
  return (
    <Link
      href={`/journal/${article.slug}`}
      className="group block"
      aria-label={article.title}
    >
      {/* Image 3:2 */}
      <div className="relative mb-4 aspect-[3/2] overflow-hidden bg-[#E6E5E2]">
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={article.cover_image_alt}
            fill
            className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 400px"
          />
        ) : (
          <div className="h-full w-full bg-[#E6E5E2]" />
        )}
      </div>

      {/* Eyebrow catégorie */}
      <p className="font-dm-sans mb-2 text-[10px] uppercase tracking-[0.2em] text-[#C9A961]">
        {article.category}
      </p>

      {/* Titre */}
      <h3 className="font-bodoni mb-2 line-clamp-2 text-xl leading-snug text-[#1d1d1b] transition-colors group-hover:text-[#C9A961]">
        {article.title}
      </h3>

      {/* Excerpt */}
      <p className="font-montserrat mb-3 line-clamp-3 text-sm leading-relaxed text-[#9B9B98]">
        {article.excerpt}
      </p>

      {/* Temps de lecture */}
      <p className="font-dm-sans text-[10px] uppercase tracking-widest text-[#9B9B98]">
        {article.reading_time_minutes} min de lecture
      </p>
    </Link>
  );
}
