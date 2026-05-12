import type { Article } from '@/lib/article-types';

import { JournalArticleCard } from './JournalArticleCard';

interface JournalGridProps {
  articles: Pick<
    Article,
    | 'id'
    | 'slug'
    | 'title'
    | 'excerpt'
    | 'cover_image_url'
    | 'cover_image_alt'
    | 'category'
    | 'reading_time_minutes'
    | 'published_at'
  >[];
}

export function JournalGrid({ articles }: JournalGridProps) {
  if (articles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map(article => (
        <JournalArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
