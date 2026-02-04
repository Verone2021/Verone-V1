'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

import type {
  SelectionWithAffiliate,
  SelectionWithProducts,
  AffiliateWithSelections,
  LinkMeAffiliate,
} from '../../types';

/**
 * Hook: Récupère les sélections vedettes pour la page d'accueil
 */
export function useFeaturedSelections() {
  return useQuery({
    queryKey: ['linkme-featured-selections'],
    queryFn: async (): Promise<SelectionWithAffiliate[]> => {
      const { data, error } = await supabase
        .from('linkme_selections')
        .select(
          `
          *,
          affiliate:linkme_affiliates!inner(
            display_name,
            slug,
            logo_url
          )
        `
        )
        .eq('status', 'active')
        .not('published_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        console.error('Erreur fetch featured selections:', error);
        throw error;
      }

      return (data as unknown as SelectionWithAffiliate[]) ?? [];
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook: Récupère les affiliés actifs pour la page d'accueil
 */
export function useActiveAffiliates() {
  return useQuery({
    queryKey: ['linkme-active-affiliates'],
    queryFn: async (): Promise<LinkMeAffiliate[]> => {
      const { data, error } = await supabase
        .from('linkme_affiliates')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) {
        console.error('Erreur fetch active affiliates:', error);
        throw error;
      }

      return (data as unknown as LinkMeAffiliate[]) ?? [];
    },
    staleTime: 60000,
  });
}

/**
 * Hook: Récupère un affilié par son slug avec ses sélections
 */
export function useAffiliateBySlug(slug: string) {
  return useQuery({
    queryKey: ['linkme-affiliate', slug],
    queryFn: async (): Promise<AffiliateWithSelections | null> => {
      // Récupérer l'affilié
      const { data: affiliate, error: affiliateError } = await supabase
        .from('linkme_affiliates')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (affiliateError) {
        if (affiliateError.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Erreur fetch affiliate:', affiliateError);
        throw affiliateError;
      }

      // Récupérer ses sélections publiques (published_at NOT NULL)
      const { data: selections, error: selectionsError } = await supabase
        .from('linkme_selections')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .eq('status', 'active')
        .not('published_at', 'is', null)
        .order('created_at', { ascending: false });

      if (selectionsError) {
        console.error('Erreur fetch selections:', selectionsError);
        throw selectionsError;
      }

      return {
        ...(affiliate as unknown as LinkMeAffiliate),
        selections: (selections ||
          []) as unknown as AffiliateWithSelections['selections'],
        selections_count: selections?.length ?? 0,
      };
    },
    enabled: !!slug,
    staleTime: 30000,
  });
}

/**
 * Hook: Récupère une sélection par son slug avec tous ses produits
 */
export function useSelectionWithProducts(
  affiliateSlug: string,
  selectionSlug: string
) {
  return useQuery({
    queryKey: ['linkme-selection', affiliateSlug, selectionSlug],
    queryFn: async (): Promise<SelectionWithProducts | null> => {
      // D'abord récupérer l'affilié pour avoir son ID
      const { data: affiliate, error: affiliateError } = await supabase
        .from('linkme_affiliates')
        .select('id, display_name, slug, logo_url, bio')
        .eq('slug', affiliateSlug)
        .eq('status', 'active')
        .single();

      if (affiliateError) {
        if (affiliateError.code === 'PGRST116') {
          return null;
        }
        console.error('Erreur fetch affiliate:', affiliateError);
        throw affiliateError;
      }

      // Récupérer la sélection
      const { data: selection, error: selectionError } = await supabase
        .from('linkme_selections')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .eq('slug', selectionSlug)
        .eq('status', 'active')
        .single();

      if (selectionError) {
        if (selectionError.code === 'PGRST116') {
          return null;
        }
        console.error('Erreur fetch selection:', selectionError);
        throw selectionError;
      }

      // Récupérer les items de la sélection avec les produits
      const { data: items, error: itemsError } = await supabase
        .from('linkme_selection_items')
        .select(
          `
          *,
          product:products(
            id,
            name,
            sku,
            description,
            stock_real
          )
        `
        )
        .eq('selection_id', selection.id)
        .order('display_order', { ascending: true });

      if (itemsError) {
        console.error('Erreur fetch selection items:', itemsError);
        throw itemsError;
      }

      // Récupérer les images primaires des produits
      const productIds = (items ?? []).map(
        item => (item as { product_id: string }).product_id
      );
      const { data: images } = await supabase
        .from('product_images')
        .select('product_id, public_url')
        .in('product_id', productIds)
        .eq('is_primary', true);

      const imageMap = new Map(
        (images ?? []).map(img => [
          (img as { product_id: string }).product_id,
          (img as { public_url: string }).public_url,
        ])
      );

      // Enrichir les items avec les images
      const enrichedItems = (items ?? []).map(item => {
        const typedItem = item as {
          product_id: string;
          product: Record<string, unknown>;
        };
        return {
          ...item,
          product: {
            ...typedItem.product,
            primary_image_url: imageMap.get(typedItem.product_id) ?? null,
          },
        };
      });

      return {
        ...selection,
        affiliate: {
          display_name: affiliate.display_name,
          slug: affiliate.slug,
          logo_url: affiliate.logo_url,
          bio: affiliate.bio,
        },
        items: enrichedItems,
      } as unknown as SelectionWithProducts;
    },
    enabled: !!affiliateSlug && !!selectionSlug,
    staleTime: 30000,
  });
}

/**
 * Hook: Incrémenter le compteur de vues d'une sélection
 */
export function useIncrementSelectionViews() {
  return async (selectionId: string) => {
    const { error } = await supabase.rpc('track_selection_view', {
      p_selection_id: selectionId,
    });

    if (error) {
      console.error('Erreur increment views:', error);
    }
  };
}

/**
 * Interface pour les fournisseurs visibles
 */
export interface VisibleSupplier {
  id: string;
  name: string;
  logo_url: string | null;
}

/**
 * Construit l'URL publique complète pour un logo stocké dans Supabase Storage
 */
function getLogoPublicUrl(logoPath: string | null): string | null {
  if (!logoPath) return null;

  // Si c'est déjà une URL complète, la retourner telle quelle
  if (logoPath.startsWith('http://') ?? logoPath.startsWith('https://')) {
    return logoPath;
  }

  // Construire l'URL publique Supabase Storage
  const { data } = supabase.storage.from('logos').getPublicUrl(logoPath);
  return data?.publicUrl ?? null;
}

// ID du canal LinkMe dans channel_pricing
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/**
 * Hook: Récupère les fournisseurs Vérone visibles dans la section "Nos partenaires"
 * Ce sont les fournisseurs dont au moins un produit est activé dans le catalogue LinkMe (channel_pricing)
 */
export function useVisibleSuppliers() {
  return useQuery({
    queryKey: ['linkme-visible-suppliers'],
    queryFn: async (): Promise<VisibleSupplier[]> => {
      // Récupérer les produits du catalogue LinkMe (channel_pricing)
      const { data: catalogProducts, error: catalogError } = await supabase
        .from('channel_pricing')
        .select('product_id')
        .eq('channel_id', LINKME_CHANNEL_ID)
        .eq('is_active', true);

      if (catalogError) {
        console.error('Erreur fetch channel_pricing:', catalogError);
        throw catalogError;
      }

      if (!catalogProducts || catalogProducts.length === 0) {
        return [];
      }

      // Récupérer les supplier_id des produits correspondants
      const productIds = catalogProducts.map(cp => cp.product_id);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('supplier_id')
        .in('id', productIds)
        .not('supplier_id', 'is', null);

      if (productsError) {
        console.error('Erreur fetch products:', productsError);
        throw productsError;
      }

      if (!products || products.length === 0) {
        return [];
      }

      // Récupérer les supplier_id uniques (filtrer les nulls)
      const supplierIds = [
        ...new Set(
          products
            .map(p => p.supplier_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      if (supplierIds.length === 0) {
        return [];
      }

      // Récupérer les organisations (fournisseurs)
      const { data: suppliers, error: suppliersError } = await supabase
        .from('organisations')
        .select('id, legal_name, trade_name, logo_url')
        .in('id', supplierIds)
        .eq('is_active', true);

      if (suppliersError) {
        console.error('Erreur fetch suppliers:', suppliersError);
        throw suppliersError;
      }

      // Transformer en format VisibleSupplier avec URL logo complète
      return (suppliers ?? []).map(s => ({
        id: s.id,
        name: s.trade_name ?? s.legal_name ?? 'Fournisseur',
        logo_url: getLogoPublicUrl(s.logo_url),
      }));
    },
    staleTime: 60000, // 1 minute
  });
}
