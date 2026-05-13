'use client';

/**
 * JournalLinkCard — sous-onglet "Journal" du canal site-internet.
 *
 * Affiche un récap rapide (nombre d'articles publiés) et un lien vers la
 * page de gestion complète des articles `/journal` du back-office.
 */

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { ButtonV2, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { BookOpen, ArrowRight } from 'lucide-react';

import { createClient } from '@verone/utils/supabase/client';

function usePublishedArticlesCount() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['site-journal-article-count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');
      if (error) {
        console.error('[JournalLinkCard] count error:', error);
        return 0;
      }
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}

export function JournalLinkCard() {
  const router = useRouter();
  const { data: count = 0, isLoading } = usePublishedArticlesCount();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Journal &amp; articles de blog
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          {isLoading
            ? 'Chargement…'
            : `${count} article${count > 1 ? 's' : ''} publié${count > 1 ? 's' : ''} sur le site.`}
        </p>
        <ButtonV2
          variant="outline"
          size="sm"
          onClick={() => router.push('/journal')}
        >
          Gérer les articles
          <ArrowRight className="h-4 w-4 ml-2" />
        </ButtonV2>
      </CardContent>
    </Card>
  );
}
