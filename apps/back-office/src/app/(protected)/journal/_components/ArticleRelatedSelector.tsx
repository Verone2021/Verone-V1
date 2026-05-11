'use client';

import { useMemo, useState } from 'react';

import { X, Search } from 'lucide-react';

import { useArticles } from '@/hooks/use-articles';
import type { Article } from '@/lib/article-types-bo';

const MAX_SELECTION = 3;

interface ArticleRelatedSelectorProps {
  currentArticleId?: string;
  value: string[];
  onChange: (ids: string[]) => void;
}

export function ArticleRelatedSelector({
  currentArticleId,
  value,
  onChange,
}: ArticleRelatedSelectorProps) {
  const [search, setSearch] = useState('');
  const { articles, isLoading } = useArticles({ status: 'published' });

  const availableArticles = useMemo(
    () => articles.filter(a => a.id !== currentArticleId),
    [articles, currentArticleId]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return availableArticles.filter(a => a.title.toLowerCase().includes(q));
  }, [availableArticles, search]);

  const selectedArticles = useMemo(
    () => availableArticles.filter(a => value.includes(a.id)),
    [availableArticles, value]
  );

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else if (value.length < MAX_SELECTION) {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Sélection courante */}
      {selectedArticles.length > 0 && (
        <div className="flex flex-col gap-2">
          {selectedArticles.map((a: Article) => (
            <div
              key={a.id}
              className="flex items-center justify-between border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <div>
                <p className="text-xs font-medium text-gray-700 line-clamp-1">
                  {a.title}
                </p>
                <p className="text-[10px] text-gray-400">{a.category}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(a.id)}
                className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Retirer ${a.title}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length >= MAX_SELECTION && (
        <p className="text-xs text-amber-600">
          Maximum {MAX_SELECTION} articles liés atteint.
        </p>
      )}

      {value.length < MAX_SELECTION && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un article publié…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>

          {isLoading && <p className="text-xs text-gray-400">Chargement…</p>}

          {!isLoading && search.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 bg-white">
              {filtered.slice(0, 20).map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(a.id)}
                  disabled={value.includes(a.id)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800 line-clamp-1">
                    {a.title}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {a.category}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-xs text-gray-400">
                  Aucun article trouvé.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
