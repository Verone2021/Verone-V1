import Image from 'next/image';
import Link from 'next/link';

import type { Article } from '@/lib/article-types';

interface JournalFeaturedArticleProps {
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
    | 'author_name'
  >;
}

export function JournalFeaturedArticle({
  article,
}: JournalFeaturedArticleProps) {
  return (
    <Link
      href={`/journal/${article.slug}`}
      className="group mb-12 block md:mb-16"
      aria-label={`Article à la une : ${article.title}`}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Image 16:9 — 8 colonnes */}
        <div className="relative aspect-video overflow-hidden bg-[#E6E5E2] md:col-span-8">
          {article.cover_image_url ? (
            <Image
              src={article.cover_image_url}
              alt={article.cover_image_alt}
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 66vw"
            />
          ) : (
            <div className="h-full w-full bg-[#E6E5E2]" />
          )}
          {/* Badge À la une */}
          <div className="absolute left-0 top-0 bg-[#C9A961] px-3 py-1">
            <span className="font-dm-sans text-[10px] uppercase tracking-widest text-[#1d1d1b]">
              À la une
            </span>
          </div>
        </div>

        {/* Infos — 4 colonnes */}
        <div className="flex flex-col justify-center md:col-span-4">
          <p className="font-dm-sans mb-3 text-[10px] uppercase tracking-[0.2em] text-[#C9A961]">
            {article.category}
          </p>
          <h2 className="font-bodoni mb-4 text-2xl leading-snug text-[#1d1d1b] transition-colors group-hover:text-[#C9A961] md:text-3xl">
            {article.title}
          </h2>
          <p className="font-montserrat mb-6 line-clamp-4 text-sm leading-relaxed text-[#9B9B98]">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-4">
            <span className="font-dm-sans text-[10px] uppercase tracking-widest text-[#9B9B98]">
              {article.author_name}
            </span>
            <span className="h-px flex-1 bg-[#E6E5E2]" />
            <span className="font-dm-sans text-[10px] uppercase tracking-widest text-[#9B9B98]">
              {article.reading_time_minutes} min
            </span>
          </div>
          <p className="font-dm-sans mt-6 text-xs uppercase tracking-widest text-[#1d1d1b] underline underline-offset-4 transition-colors group-hover:text-[#C9A961]">
            Lire l'article →
          </p>
        </div>
      </div>
    </Link>
  );
}
