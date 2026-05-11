'use client';

import { use } from 'react';

import { useRouter } from 'next/navigation';

import { useArticleById, useUpdateArticle } from '@/hooks/use-articles';
import type { ArticleFormData } from '@/lib/article-types-bo';

import { ArticleEditor } from '../../_components/ArticleEditor';

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { article, isLoading } = useArticleById(id);
  const updateArticle = useUpdateArticle(id);

  const handleSave = async (
    data: ArticleFormData,
    _status: 'draft' | 'published'
  ) => {
    await updateArticle.mutateAsync(data);
    router.push('/journal');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-8">
        <p className="text-red-500">Article introuvable.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Modifier l'article
        </h1>
        <p className="mt-1 max-w-xl truncate text-sm text-gray-500">
          {article.title}
        </p>
      </div>

      <ArticleEditor
        article={article}
        onSave={handleSave}
        isSaving={updateArticle.isPending}
      />
    </div>
  );
}
