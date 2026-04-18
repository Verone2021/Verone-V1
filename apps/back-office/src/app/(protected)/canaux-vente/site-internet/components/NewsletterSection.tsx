/**
 * NewsletterSection - Liste des abonnes newsletter du site
 *
 * Lit la table newsletter_subscribers (RLS: staff_read_newsletter).
 * Les inscriptions viennent du composant NewsletterSignup du site.
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Mail } from 'lucide-react';

const supabase = createClient();

interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string | null;
  is_active: boolean | null;
  subscribed_at: string | null;
}

function useNewsletterSubscribers() {
  return useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: async (): Promise<NewsletterSubscriber[]> => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('id, email, source, is_active, subscribed_at')
        .eq('is_active', true)
        .order('subscribed_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('[NewsletterSection] Fetch error:', error);
        throw error;
      }

      return data ?? [];
    },
    staleTime: 300_000,
  });
}

export function NewsletterSection() {
  const { data: subscribers, isLoading } = useNewsletterSubscribers();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Abonnes newsletter
        </CardTitle>
        <CardDescription>
          {subscribers?.length ?? 0} abonnes actifs — inscrits via le site
          internet
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !subscribers || subscribers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun abonne pour le moment.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Source</TableHead>
                  <TableHead className="hidden lg:table-cell">Inscrit le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.email}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                      {sub.source ?? 'site-internet'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                      {sub.subscribed_at
                        ? format(new Date(sub.subscribed_at), 'dd MMM yyyy', {
                            locale: fr,
                          })
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
