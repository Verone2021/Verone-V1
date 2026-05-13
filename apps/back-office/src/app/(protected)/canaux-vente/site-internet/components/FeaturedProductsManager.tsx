'use client';

/**
 * Featured Products Manager — Vérone Back Office (BO-SITE-CMS-001)
 *
 * Permet à l'admin de choisir les 4 produits affichés dans la section
 * "Ce qui vient d'entrer" sur la home veronecollections.fr.
 *
 * Lecture/écriture directe sur `products.is_featured_home` (table publique,
 * RLS staff). Le hook site-internet `use-featured-home-products` lit ensuite
 * cette colonne et fait fallback sur les 4 plus récents publiés si rien
 * n'est marqué.
 */

import { useCallback, useMemo } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle, Switch } from '@verone/ui';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@verone/utils/supabase/client';

const MAX_FEATURED = 4;

interface ProductRow {
  id: string;
  name: string;
  commercial_name: string | null;
  is_featured_home: boolean;
  publication_date: string | null;
}

function useFeaturedCandidates() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['homepage-featured-candidates'],
    queryFn: async (): Promise<ProductRow[]> => {
      // On charge un volume raisonnable des derniers publiés. Suffisant pour
      // que Roméo retrouve un produit récent ; pour les anciens il peut
      // passer par le modal produit classique.
      const { data, error } = await supabase
        .from('products')
        .select('id, name, commercial_name, is_featured_home, publication_date')
        .eq('is_published_online', true)
        .order('is_featured_home', { ascending: false })
        .order('publication_date', { ascending: false })
        .limit(60);

      if (error) {
        console.error('[FeaturedProductsManager] fetch error:', error);
        return [];
      }
      return (data ?? []) as ProductRow[];
    },
    staleTime: 30_000,
  });
}

function useToggleFeatured() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      value,
    }: {
      productId: string;
      value: boolean;
    }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_featured_home: value })
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['homepage-featured-candidates'],
      });
      toast.success('Mise en avant mise à jour');
    },
    onError: (err: Error) => {
      console.error('[FeaturedProductsManager] toggle error:', err);
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

export function FeaturedProductsManager() {
  const { data: products = [], isLoading } = useFeaturedCandidates();
  const toggle = useToggleFeatured();

  const handleToggle = useCallback(
    (productId: string, current: boolean) => {
      toggle.mutate({ productId, value: !current });
    },
    [toggle]
  );

  const featuredCount = useMemo(
    () => products.filter(p => p.is_featured_home).length,
    [products]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Produits en avant sur la home (max {MAX_FEATURED})
        </CardTitle>
        <p className="text-sm text-gray-500">
          Cochez les produits à afficher dans la section « Ce qui vient
          d&apos;entrer » de la page d&apos;accueil.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {featuredCount > MAX_FEATURED && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>{featuredCount} produits en avant</strong> — seuls les{' '}
              {MAX_FEATURED} premiers sont affichés sur le site. Décochez les
              surnuméraires.
            </div>
          </div>
        )}

        {isLoading && (
          <p className="text-sm text-gray-500">Chargement des produits…</p>
        )}

        {!isLoading && products.length === 0 && (
          <p className="text-sm text-gray-500">
            Aucun produit publié sur le site internet.
          </p>
        )}

        <div className="max-h-[500px] overflow-y-auto divide-y border rounded">
          {products.map(product => (
            <label
              key={product.id}
              className={`flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                product.is_featured_home ? 'bg-amber-50/60' : ''
              }`}
            >
              <span className="truncate">
                {product.commercial_name ?? product.name}
              </span>
              <Switch
                checked={product.is_featured_home}
                onCheckedChange={() =>
                  handleToggle(product.id, product.is_featured_home)
                }
                disabled={toggle.isPending}
              />
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
