'use client';

import { useState } from 'react';

import Link from 'next/link';

import { Eye, Pencil, Archive, Plus } from 'lucide-react';

import { useArchiveArticle, useArticles } from '@/hooks/use-articles';
import type { Article } from '@/lib/article-types-bo';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  scheduled: 'Planifié',
  archived: 'Archivé',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
  archived: 'bg-orange-100 text-orange-700',
};

const ALL_STATUS = ['Tous', 'draft', 'published', 'scheduled', 'archived'];

export function ArticlesManagementTable() {
  const [filterStatus, setFilterStatus] = useState('Tous');
  const archive = useArchiveArticle();

  const { articles, isLoading } = useArticles(
    filterStatus !== 'Tous' ? { status: filterStatus } : undefined
  );

  const handleArchive = (article: Article) => {
    if (!confirm(`Archiver "${article.title}" ?`)) return;
    void archive.mutate(article.id);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filtres status */}
        <div className="flex flex-wrap gap-2">
          {ALL_STATUS.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={[
                'rounded-none border px-3 py-1 text-xs uppercase tracking-wide transition-colors',
                filterStatus === s
                  ? 'border-gray-800 bg-gray-800 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400',
              ].join(' ')}
            >
              {s === 'Tous' ? 'Tous' : (STATUS_LABELS[s] ?? s)}
            </button>
          ))}
        </div>

        {/* Bouton nouveau */}
        <Link
          href="/journal/nouveau"
          className="flex items-center gap-2 bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvel article
        </Link>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Chargement…</p>}

      {/* Mobile : cartes */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {articles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              onArchive={handleArchive}
            />
          ))}
          {articles.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              Aucun article.
            </p>
          )}
        </div>
      )}

      {/* Desktop : tableau */}
      {!isLoading && (
        <div className="hidden w-full overflow-x-auto border border-gray-200 bg-white md:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="min-w-[200px] px-4 py-3 text-left font-medium text-gray-600">
                  Titre
                </th>
                <th className="w-[120px] px-4 py-3 text-left font-medium text-gray-600">
                  Catégorie
                </th>
                <th className="w-[100px] px-4 py-3 text-left font-medium text-gray-600">
                  Statut
                </th>
                <th className="hidden w-[80px] px-4 py-3 text-right font-medium text-gray-600 xl:table-cell">
                  Vues
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-600 lg:table-cell">
                  Publié le
                </th>
                <th className="w-[120px] px-4 py-3 text-right font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr
                  key={article.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="line-clamp-1 font-medium text-gray-900">
                      {article.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {article.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[article.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUS_LABELS[article.status] ?? article.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-gray-500 xl:table-cell">
                    {article.view_count}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-400 lg:table-cell">
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString(
                          'fr-FR'
                        )
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/journal/${article.id}/editer`}
                        className="flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      {article.status === 'published' && (
                        <a
                          href={`/journal/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-colors"
                          title="Voir en ligne"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {article.status !== 'archived' && (
                        <button
                          onClick={() => handleArchive(article)}
                          className="flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-600 transition-colors"
                          title="Archiver"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    Aucun article.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ArticleCard({
  article,
  onArchive,
}: {
  article: Article;
  onArchive: (a: Article) => void;
}) {
  return (
    <div className="border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="font-medium text-gray-900 line-clamp-2">
          {article.title}
        </span>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[article.status] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {STATUS_LABELS[article.status] ?? article.status}
        </span>
      </div>
      <p className="mb-3 text-xs text-gray-400">{article.category}</p>
      <div className="flex items-center gap-2">
        <Link
          href={`/journal/${article.id}/editer`}
          className="flex items-center gap-1 border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-gray-400 transition-colors"
        >
          <Pencil className="h-3 w-3" />
          Modifier
        </Link>
        {article.status !== 'archived' && (
          <button
            onClick={() => onArchive(article)}
            className="flex items-center gap-1 border border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <Archive className="h-3 w-3" />
            Archiver
          </button>
        )}
      </div>
    </div>
  );
}
