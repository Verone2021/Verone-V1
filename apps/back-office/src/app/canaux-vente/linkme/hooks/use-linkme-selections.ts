'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// ID du canal LinkMe
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

// Types
export interface SelectionItem {
  id: string;
  selection_id: string;
  product_id: string;
  base_price_ht: number;
  margin_rate: number;
  selling_price_ht: number | null;
  display_order: number | null;
  custom_description: string | null;
  is_featured: boolean | null;
  created_at: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    cost_price: number | null;
    product_status: string;
  };
  product_image_url?: string | null;
  /** Commission NITMI/LinkMe en décimal (0.05 = 5%) - depuis channel_pricing */
  commission_rate?: number | null;
}

export interface SelectionDetail {
  id: string;
  affiliate_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_public: boolean | null;
  share_token: string | null;
  products_count: number | null;
  views_count: number | null;
  orders_count: number | null;
  total_revenue: number | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  affiliate?: {
    id: string;
    display_name: string;
    slug: string;
    enseigne_id: string | null;
    /** Organisation liée (pour récupérer enseigne_id via organisation) */
    organisation?: {
      enseigne_id: string | null;
    } | null;
  };
  items?: SelectionItem[];
}

// Type pour les produits sourcés par une enseigne
export interface SourcedProduct {
  id: string;
  name: string;
  sku: string;
  /** Prix de vente HT (depuis channel_pricing ou calculé avec marge 30%) */
  selling_price_ht: number;
  primary_image_url: string | null;
  supplier_reference: string | null;
}

export interface UpdateSelectionData {
  name?: string;
  description?: string | null;
  status?: 'draft' | 'active' | 'archived';
  is_public?: boolean;
}

export interface AddProductData {
  product_id: string;
  margin_rate: number;
  base_price_ht: number;
}

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Récupère une sélection par ID avec ses produits
 */
async function fetchSelectionById(
  selectionId: string
): Promise<SelectionDetail | null> {
  // 1. Récupérer la sélection avec l'enseigne_id de l'affilié (direct ou via organisation)
  const { data: selection, error: selectionError } = await supabase
    .from('linkme_selections')
    .select(
      `
      *,
      affiliate:linkme_affiliates(
        id,
        display_name,
        slug,
        enseigne_id,
        organisation:organisations(enseigne_id)
      )
    `
    )
    .eq('id', selectionId)
    .single();

  if (selectionError) {
    console.error('Error fetching selection:', selectionError);
    throw selectionError;
  }

  if (!selection) return null;

  // 2. Récupérer les items de la sélection avec les produits
  const { data: items, error: itemsError } = await supabase
    .from('linkme_selection_items')
    .select(
      `
      *,
      product:products(id, name, sku, cost_price, product_status)
    `
    )
    .eq('selection_id', selectionId)
    .order('display_order', { ascending: true });

  if (itemsError) {
    console.error('Error fetching selection items:', itemsError);
    throw itemsError;
  }

  // 3. Récupérer les images des produits
  const productIds = items?.map((item: SelectionItem) => item.product_id) || [];
  let imagesByProductId: Record<string, string> = {};
  const commissionByProductId: Record<string, number | null> = {};

  if (productIds.length > 0) {
    // Récupérer les images primaires
    const { data: images } = await supabase
      .from('product_images')
      .select('product_id, public_url')
      .in('product_id', productIds)
      .eq('is_primary', true);

    if (images) {
      imagesByProductId = images.reduce(
        (acc: Record<string, string>, img) => {
          if (img.public_url) {
            acc[img.product_id] = img.public_url;
          }
          return acc;
        },
        {} as Record<string, string>
      );
    }

    // 4. Récupérer les commissions depuis channel_pricing (canal LinkMe)
    const { data: channelPrices } = await supabase
      .from('channel_pricing')
      .select('product_id, channel_commission_rate')
      .eq('channel_id', LINKME_CHANNEL_ID)
      .in('product_id', productIds);

    if (channelPrices) {
      channelPrices.forEach(cp => {
        commissionByProductId[cp.product_id] = cp.channel_commission_rate;
      });
    }
  }

  // 5. Combiner les données
  const itemsWithImages = (items || []).map(item => ({
    ...item,
    product_image_url: imagesByProductId[item.product_id] || null,
    commission_rate: commissionByProductId[item.product_id] ?? null,
  })) as SelectionItem[];

  return {
    ...selection,
    items: itemsWithImages,
  } as SelectionDetail;
}

/**
 * Récupère les produits du catalogue LinkMe éligibles pour ajout
 */
async function fetchCatalogProducts() {
  const { data, error } = await supabase.rpc(
    'get_linkme_catalog_products_for_affiliate'
  );

  if (error) {
    console.error('Error fetching catalog products:', error);
    throw error;
  }

  return data || [];
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook: Récupérer une sélection par ID
 */
export function useLinkMeSelection(selectionId: string | null) {
  return useQuery({
    queryKey: ['linkme-selection', selectionId],
    queryFn: () => (selectionId ? fetchSelectionById(selectionId) : null),
    enabled: !!selectionId,
    staleTime: 30000, // 30 secondes
  });
}

/**
 * Hook: Récupérer les produits du catalogue LinkMe
 */
export function useLinkMeCatalogProducts() {
  return useQuery({
    queryKey: ['linkme-catalog-products'],
    queryFn: fetchCatalogProducts,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook: Mettre à jour une sélection
 */
export function useUpdateSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      selectionId,
      data,
    }: {
      selectionId: string;
      data: UpdateSelectionData;
    }) => {
      const { error } = await supabase
        .from('linkme_selections')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectionId);

      if (error) throw error;
    },
    onSuccess: (_, { selectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-selection', selectionId],
      });
      queryClient.invalidateQueries({ queryKey: ['linkme-selections'] });
      toast({
        title: 'Sélection mise à jour',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: error => {
      console.error('Error updating selection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la sélection.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Ajouter un produit à la sélection
 * Utilise la fonction RPC SECURITY DEFINER pour contourner les problèmes RLS
 */
export function useAddProductToSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      selectionId,
      productData,
    }: {
      selectionId: string;
      productData: AddProductData;
    }) => {
      // Utiliser la fonction RPC SECURITY DEFINER qui gère tout:
      // - Vérification permissions (staff ou affiliate owner)
      // - Calcul display_order
      // - Insert dans linkme_selection_items
      // - Mise à jour products_count
      // Note: RPC function exists in DB but not in TypeScript types - use any cast
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc(
        'add_product_to_selection',
        {
          p_selection_id: selectionId,
          p_product_id: productData.product_id,
          p_base_price_ht: productData.base_price_ht,
          p_margin_rate: productData.margin_rate,
        }
      );

      if (error) throw error;

      return data; // Retourne l'ID du nouvel item
    },
    onSuccess: (_, { selectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-selection', selectionId],
      });
      queryClient.invalidateQueries({ queryKey: ['linkme-selections'] });
      toast({
        title: 'Produit ajouté',
        description: 'Le produit a été ajouté à la sélection.',
      });
    },
    onError: error => {
      console.error('Error adding product:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter le produit.",
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Retirer un produit de la sélection
 */
export function useRemoveProductFromSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      selectionId,
      itemId,
    }: {
      selectionId: string;
      itemId: string;
    }) => {
      const { error } = await supabase
        .from('linkme_selection_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Mettre à jour le compteur de produits
      await supabase.rpc('decrement_selection_products_count' as any, {
        p_selection_id: selectionId,
      });
    },
    onSuccess: (_, { selectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-selection', selectionId],
      });
      queryClient.invalidateQueries({ queryKey: ['linkme-selections'] });
      toast({
        title: 'Produit retiré',
        description: 'Le produit a été retiré de la sélection.',
      });
    },
    onError: error => {
      console.error('Error removing product:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le produit.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Mettre à jour le taux de marque d'un produit
 */
export function useUpdateProductMargin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
      marginRate,
    }: {
      itemId: string;
      marginRate: number;
      selectionId: string; // Pour invalidation
    }) => {
      const { error } = await supabase
        .from('linkme_selection_items')
        .update({
          margin_rate: marginRate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: (_, { selectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-selection', selectionId],
      });
      toast({
        title: 'Marge mise à jour',
        description: 'Le taux de marque a été enregistré.',
      });
    },
    onError: error => {
      console.error('Error updating margin:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la marge.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Données pour mise à jour d'un item de sélection
 */
export interface UpdateSelectionItemData {
  base_price_ht?: number;
  margin_rate?: number;
  custom_description?: string | null;
  is_featured?: boolean;
}

/**
 * Hook: Mettre à jour un item de sélection (prix, marge, description, vedette)
 */
export function useUpdateSelectionItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
      selectionId,
      data,
    }: {
      itemId: string;
      selectionId: string;
      data: UpdateSelectionItemData;
    }) => {
      const { error } = await supabase
        .from('linkme_selection_items')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: (_, { selectionId }) => {
      queryClient.invalidateQueries({
        queryKey: ['linkme-selection', selectionId],
      });
      queryClient.invalidateQueries({ queryKey: ['linkme-selections'] });
      toast({
        title: 'Produit mis à jour',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: error => {
      console.error('Error updating selection item:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le produit.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Supprimer une sélection
 */
export function useDeleteSelection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (selectionId: string) => {
      // Les items sont supprimés en cascade (ON DELETE CASCADE)
      const { error } = await supabase
        .from('linkme_selections')
        .delete()
        .eq('id', selectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-selections'] });
      toast({
        title: 'Sélection supprimée',
        description: 'La sélection a été supprimée définitivement.',
      });
    },
    onError: error => {
      console.error('Error deleting selection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la sélection.',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// Produits Sourcés (par enseigne)
// ============================================================================

/**
 * Récupère les produits sourcés pour une enseigne (produits avec enseigne_id correspondant)
 * Le prix de vente est récupéré depuis channel_pricing (custom_price_ht ou public_price_ht)
 * ou calculé avec une marge de 30% si non disponible.
 *
 * IMPORTANT: cost_price est CONFIDENTIEL et ne doit JAMAIS être exposé.
 */
async function fetchEnseigneSourcedProducts(
  enseigneId: string
): Promise<SourcedProduct[]> {
  // Récupérer les produits avec cette enseigne_id (cost_price pour calcul interne seulement)
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, cost_price, supplier_reference')
    .eq('enseigne_id', enseigneId)
    .is('archived_at', null)
    .eq('product_status', 'active')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching enseigne sourced products:', error);
    throw error;
  }

  if (!products || products.length === 0) {
    return [];
  }

  const productIds = products.map(p => p.id);

  // Récupérer les prix de vente depuis channel_pricing (canal LinkMe)
  const { data: channelPrices } = await supabase
    .from('channel_pricing')
    .select('product_id, custom_price_ht, public_price_ht')
    .eq('channel_id', LINKME_CHANNEL_ID)
    .in('product_id', productIds);

  const pricesByProductId: Record<
    string,
    { custom_price_ht: number | null; public_price_ht: number | null }
  > = {};
  if (channelPrices) {
    channelPrices.forEach(cp => {
      pricesByProductId[cp.product_id] = {
        custom_price_ht: cp.custom_price_ht,
        public_price_ht: cp.public_price_ht,
      };
    });
  }

  // Récupérer les images primaires
  const { data: images } = await supabase
    .from('product_images')
    .select('product_id, public_url')
    .in('product_id', productIds)
    .eq('is_primary', true);

  const imagesByProductId: Record<string, string> = {};
  if (images) {
    images.forEach(img => {
      if (img.public_url) {
        imagesByProductId[img.product_id] = img.public_url;
      }
    });
  }

  // Combiner les données avec calcul du prix de vente
  return products.map(p => {
    const channelPrice = pricesByProductId[p.id];
    // Priorité: custom_price_ht > public_price_ht > cost_price * 1.30
    let sellingPrice: number;
    if (channelPrice?.custom_price_ht && channelPrice.custom_price_ht > 0) {
      sellingPrice = channelPrice.custom_price_ht;
    } else if (
      channelPrice?.public_price_ht &&
      channelPrice.public_price_ht > 0
    ) {
      sellingPrice = channelPrice.public_price_ht;
    } else {
      // Calcul par défaut: cost_price × 1.30 (marge 30%)
      sellingPrice = (p.cost_price || 0) * 1.3;
    }

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      selling_price_ht: Math.round(sellingPrice * 100) / 100, // Arrondi 2 décimales
      supplier_reference: p.supplier_reference,
      primary_image_url: imagesByProductId[p.id] || null,
    };
  });
}

/**
 * Hook: Récupérer les produits sourcés d'une enseigne
 */
export function useEnseigneSourcedProducts(enseigneId: string | null) {
  return useQuery({
    queryKey: ['enseigne-sourced-products', enseigneId],
    queryFn: () => (enseigneId ? fetchEnseigneSourcedProducts(enseigneId) : []),
    enabled: !!enseigneId,
    staleTime: 60000, // 1 minute
  });
}
