'use client';

import { useRouter } from 'next/navigation';

import { useCreateArticle } from '@/hooks/use-articles';
import type { ArticleFormData } from '@/lib/article-types-bo';

import { ArticleEditor } from '../_components/ArticleEditor';

export default function NouvelArticlePage() {
  const router = useRouter();
  const createArticle = useCreateArticle();

  const handleSave = async (
    data: ArticleFormData,
    _status: 'draft' | 'published'
  ) => {
    const created = await createArticle.mutateAsync(data);
    router.push(`/journal/${created.id}/editer`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Nouvel article</h1>
        <p className="mt-1 text-sm text-gray-500">
          Colle ton markdown depuis Claude.ai, câble les produits, puis publie.
        </p>
      </div>

      <ArticleEditor onSave={handleSave} isSaving={createArticle.isPending} />
    </div>
  );
}
