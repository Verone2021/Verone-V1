/**
 * Hook: useUserSelection
 * Gestion de la sélection de l'utilisateur connecté
 *
 * L'utilisateur est lié à un affilié via:
 * - user_id (direct)
 * - enseigne_id (si enseigne_admin)
 * - organisation_id (si org_independante)
 *
 * @module use-user-selection
 * @since 2025-12-04
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

/**
 * Interface affilié
 */
export interface UserAffiliate {
  id: string;
  user_id: string | null;
  enseigne_id: string | null;
  organisation_id: string | null;
  display_name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  bio: string | null;
  status: string;
  default_margin_rate: number;
  max_margin_rate: number;
  linkme_commission_rate: number;
}

/**
 * Interface sélection
 */
export interface UserSelection {
  id: string;
  affiliate_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_public: boolean;
  share_token: string | null;
  products_count: number;
  views_count: number;
  orders_count: number;
  total_revenue: number;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface produit dans une sélection
 */
export interface SelectionItem {
  id: string;
  selection_id: string;
  product_id: string;
  base_price_ht: number;
  margin_rate: number;
  selling_price_ht: number;
  custom_description: string | null;
  is_featured: boolean;
  display_order: number;
  // Données produit jointes
  product_name: string;
  product_reference: string;
  product_image_url: string | null;
  product_stock_real: number;
}

/**
 * Hook: récupère l'affilié de l'utilisateur connecté
 */
export function useUserAffiliate() {
  const { user, linkMeRole } = useAuth();

  return useQuery({
    queryKey: [
      'user-affiliate',
      user?.id,
      linkMeRole?.enseigne_id,
      linkMeRole?.organisation_id,
    ],
    queryFn: async (): Promise<UserAffiliate | null> => {
      if (!user || !linkMeRole) return null;

      // Construire la requête selon le rôle
      let query = (supabase as any).from('linkme_affiliates').select('*');

      // Chercher par enseigne_id pour enseigne_admin
      if (linkMeRole.role === 'enseigne_admin' && linkMeRole.enseigne_id) {
        query = query.eq('enseigne_id', linkMeRole.enseigne_id);
      }
      // Chercher par organisation_id pour org_independante
      else if (
        linkMeRole.role === 'org_independante' &&
        linkMeRole.organisation_id
      ) {
        query = query.eq('organisation_id', linkMeRole.organisation_id);
      }
      // Chercher par user_id en fallback
      else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Erreur fetch affiliate:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        user_id: data.user_id,
        enseigne_id: data.enseigne_id,
        organisation_id: data.organisation_id,
        display_name: data.display_name || '',
        slug: data.slug || '',
        email: data.email,
        phone: data.phone,
        logo_url: data.logo_url,
        bio: data.bio,
        status: data.status || 'active',
        default_margin_rate: data.default_margin_rate || 20,
        max_margin_rate: data.max_margin_rate || 50,
        linkme_commission_rate: data.linkme_commission_rate || 5,
      };
    },
    enabled: !!user && !!linkMeRole,
    staleTime: 60000,
  });
}

/**
 * Hook: récupère les sélections de l'utilisateur
 */
export function useUserSelections() {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['user-selections', affiliate?.id],
    queryFn: async (): Promise<UserSelection[]> => {
      if (!affiliate) return [];

      const { data, error } = await (supabase as any)
        .from('linkme_selections')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur fetch selections:', error);
        throw error;
      }

      return (data || []).map((s: any) => ({
        id: s.id,
        affiliate_id: s.affiliate_id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        image_url: s.image_url,
        is_public: s.is_public ?? false,
        share_token: s.share_token,
        products_count: s.products_count || 0,
        views_count: s.views_count || 0,
        orders_count: s.orders_count || 0,
        total_revenue: s.total_revenue || 0,
        status: s.status || 'draft',
        published_at: s.published_at,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));
    },
    enabled: !!affiliate,
    staleTime: 30000,
  });
}

/**
 * Hook: récupère les produits d'une sélection
 */
export function useSelectionItems(selectionId: string | null) {
  return useQuery({
    queryKey: ['selection-items', selectionId],
    queryFn: async (): Promise<SelectionItem[]> => {
      if (!selectionId) return [];

      // Utilise la syntaxe alias "product:products(...)" au lieu de "products!inner(...)"
      // car cette dernière échoue silencieusement avec linkme_selection_items
      const { data, error } = await (supabase as any)
        .from('linkme_selection_items')
        .select(
          `
          id,
          selection_id,
          product_id,
          base_price_ht,
          margin_rate,
          selling_price_ht,
          custom_description,
          is_featured,
          display_order,
          product:products(
            name,
            sku,
            stock_real
          )
        `
        )
        .eq('selection_id', selectionId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Erreur fetch selection items:', error);
        throw error;
      }

      // Récupérer les images
      const productIds = (data || []).map((item: any) => item.product_id);
      let imageMap = new Map<string, string>();

      if (productIds.length > 0) {
        const { data: images } = await (supabase as any)
          .from('product_images')
          .select('product_id, public_url')
          .in('product_id', productIds)
          .eq('is_primary', true);

        imageMap = new Map(
          (images || []).map((img: any) => [img.product_id, img.public_url])
        );
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        selection_id: item.selection_id,
        product_id: item.product_id,
        base_price_ht: item.base_price_ht || 0,
        margin_rate: item.margin_rate || 20,
        selling_price_ht: item.selling_price_ht || 0,
        custom_description: item.custom_description,
        is_featured: item.is_featured ?? false,
        display_order: item.display_order || 0,
        product_name: item.product?.name || '',
        product_reference: item.product?.sku || '',
        product_image_url: imageMap.get(item.product_id) || null,
        product_stock_real: item.product?.stock_real || 0,
      }));
    },
    enabled: !!selectionId,
    staleTime: 30000,
  });
}

/**
 * Hook: créer une nouvelle sélection
 */
export function useCreateSelection() {
  const queryClient = useQueryClient();
  const { data: affiliate } = useUserAffiliate();

  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      if (!affiliate) {
        throw new Error('Aucun compte affilié trouvé');
      }

      // Générer un slug unique
      const baseSlug = input.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      const { data, error } = await (supabase as any)
        .from('linkme_selections')
        .insert({
          affiliate_id: affiliate.id,
          name: input.name,
          slug: uniqueSlug,
          description: input.description || null,
          is_public: false,
          status: 'draft',
          products_count: 0,
          views_count: 0,
          orders_count: 0,
          total_revenue: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}

/**
 * Hook: ajouter un produit à une sélection (legacy - utilise marge suggérée)
 */
export function useAddToSelection() {
  const queryClient = useQueryClient();
  const { data: affiliate } = useUserAffiliate();

  return useMutation({
    mutationFn: async (input: {
      selectionId: string;
      productId: string;
      catalogProductId: string; // ID dans channel_pricing pour récupérer les paramètres de marge
    }) => {
      if (!affiliate) {
        throw new Error('Aucun compte affilié trouvé');
      }

      // Récupérer les infos du produit depuis channel_pricing
      const { data: catalogProduct, error: cpError } = await (supabase as any)
        .from('channel_pricing')
        .select(
          `
          custom_price_ht,
          min_margin_rate,
          max_margin_rate,
          suggested_margin_rate,
          products!inner(
            cost_price,
            eco_tax_default,
            margin_percentage
          )
        `
        )
        .eq('id', input.catalogProductId)
        .single();

      if (cpError) {
        console.error('Erreur fetch channel_pricing:', cpError);
        throw new Error('Produit non trouvé dans le catalogue');
      }

      // Calcul du prix de base (cost + eco_tax) * (1 + margin%)
      const product = catalogProduct.products;
      const costPrice = product?.cost_price || 0;
      const ecoTax = product?.eco_tax_default || 0;
      const marginPct = product?.margin_percentage ?? 25;
      const calculatedPrice =
        costPrice > 0 ? (costPrice + ecoTax) * (1 + marginPct / 100) : 0;

      const basePriceHt = catalogProduct.custom_price_ht ?? calculatedPrice;
      const marginRate =
        catalogProduct.suggested_margin_rate ?? affiliate.default_margin_rate;
      const sellingPriceHt = basePriceHt * (1 + marginRate / 100);

      // Récupérer le prochain display_order
      const { data: existingItems } = await (supabase as any)
        .from('linkme_selection_items')
        .select('display_order')
        .eq('selection_id', input.selectionId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = (existingItems?.[0]?.display_order ?? 0) + 1;

      // Appeler l'API back-office pour bypasser RLS
      // Note: selling_price_ht est une colonne GENERATED - ne pas l'inclure
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_OFFICE_URL || 'http://localhost:3000'}/api/linkme/selections/add-item`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selection_id: input.selectionId,
            product_id: input.productId,
            base_price_ht: basePriceHt,
            margin_rate: marginRate,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Vérifier si c'est une erreur de doublon
        if (response.status === 409) {
          throw new Error('Ce produit est déjà dans votre sélection');
        }
        throw new Error(result.message || "Erreur lors de l'ajout du produit");
      }

      // L'API gère déjà le products_count
      return result.item;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['selection-items', variables.selectionId],
      });
      queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}

/**
 * Hook: ajouter un produit à une sélection avec marge personnalisée
 * Version améliorée permettant à l'utilisateur de choisir sa marge
 */
export function useAddToSelectionWithMargin() {
  const queryClient = useQueryClient();
  const { data: affiliate } = useUserAffiliate();

  return useMutation({
    mutationFn: async (input: {
      selectionId: string;
      productId: string;
      catalogProductId: string;
      marginRate: number; // Marge choisie par l'utilisateur (en %)
    }) => {
      if (!affiliate) {
        throw new Error('Aucun compte affilié trouvé');
      }

      // Récupérer les infos du produit depuis channel_pricing
      const { data: catalogProduct, error: cpError } = await (supabase as any)
        .from('channel_pricing')
        .select(
          `
          custom_price_ht,
          min_margin_rate,
          max_margin_rate,
          products!inner(
            cost_price,
            eco_tax_default,
            margin_percentage
          )
        `
        )
        .eq('id', input.catalogProductId)
        .single();

      if (cpError) {
        console.error('Erreur fetch channel_pricing:', cpError);
        throw new Error('Produit non trouvé dans le catalogue');
      }

      // Valider la marge contre les limites du channel_pricing
      const minMargin = catalogProduct.min_margin_rate ?? 1;
      const maxMargin = catalogProduct.max_margin_rate ?? 50;

      if (input.marginRate < minMargin || input.marginRate > maxMargin) {
        throw new Error(
          `La marge doit être entre ${minMargin}% et ${maxMargin}%`
        );
      }

      // Calcul du prix de base
      const product = catalogProduct.products;
      const costPrice = product?.cost_price || 0;
      const ecoTax = product?.eco_tax_default || 0;
      const marginPct = product?.margin_percentage ?? 25;
      const calculatedPrice =
        costPrice > 0 ? (costPrice + ecoTax) * (1 + marginPct / 100) : 0;

      const basePriceHt = catalogProduct.custom_price_ht ?? calculatedPrice;

      // Utiliser la marge fournie par l'utilisateur
      const commissionRate = affiliate.linkme_commission_rate || 5;
      const sellingPriceHt =
        basePriceHt * (1 + commissionRate / 100 + input.marginRate / 100);

      // Récupérer le prochain display_order
      const { data: existingItems } = await (supabase as any)
        .from('linkme_selection_items')
        .select('display_order')
        .eq('selection_id', input.selectionId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = (existingItems?.[0]?.display_order ?? 0) + 1;

      // Appeler l'API back-office pour bypasser RLS
      // Note: selling_price_ht est une colonne GENERATED - calculée automatiquement
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_OFFICE_URL || 'http://localhost:3000'}/api/linkme/selections/add-item`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selection_id: input.selectionId,
            product_id: input.productId,
            base_price_ht: basePriceHt,
            margin_rate: input.marginRate,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Ce produit est déjà dans votre sélection');
        }
        throw new Error(result.message || "Erreur lors de l'ajout du produit");
      }

      // L'API gère déjà le products_count
      return result.item;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['selection-items', variables.selectionId],
      });
      queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}

/**
 * Hook: retirer un produit d'une sélection
 */
export function useRemoveFromSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { itemId: string; selectionId: string }) => {
      const { error } = await (supabase as any)
        .from('linkme_selection_items')
        .delete()
        .eq('id', input.itemId);

      if (error) throw error;

      // Recalculer le compteur
      const { count } = await (supabase as any)
        .from('linkme_selection_items')
        .select('*', { count: 'exact', head: true })
        .eq('selection_id', input.selectionId);

      await (supabase as any)
        .from('linkme_selections')
        .update({
          products_count: count || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.selectionId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['selection-items', variables.selectionId],
      });
      queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}

/**
 * Hook: mettre à jour la marge d'un produit
 */
export function useUpdateItemMargin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      itemId: string;
      selectionId: string;
      marginRate: number;
    }) => {
      // Récupérer le prix de base actuel
      const { data: item, error: fetchError } = await (supabase as any)
        .from('linkme_selection_items')
        .select('base_price_ht')
        .eq('id', input.itemId)
        .single();

      if (fetchError) throw fetchError;

      const sellingPriceHt = item.base_price_ht * (1 + input.marginRate / 100);

      const { error } = await (supabase as any)
        .from('linkme_selection_items')
        .update({
          margin_rate: input.marginRate,
          selling_price_ht: sellingPriceHt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.itemId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['selection-items', variables.selectionId],
      });
    },
  });
}

/**
 * Hook: publier/dépublier une sélection
 */
export function useToggleSelectionPublished() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { selectionId: string; isPublic: boolean }) => {
      const updateData: any = {
        is_public: input.isPublic,
        status: input.isPublic ? 'active' : 'draft',
        updated_at: new Date().toISOString(),
      };

      if (input.isPublic) {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('linkme_selections')
        .update(updateData)
        .eq('id', input.selectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-selections'] });
    },
  });
}

/**
 * Hook: récupère uniquement les product_id d'une sélection (pour filtrage)
 * Utilisé par le catalogue pour masquer les produits déjà dans la sélection
 */
export function useSelectionProductIds(selectionId: string | null) {
  return useQuery({
    queryKey: ['selection-product-ids', selectionId],
    queryFn: async (): Promise<string[]> => {
      if (!selectionId) return [];

      const { data, error } = await (supabase as any)
        .from('linkme_selection_items')
        .select('product_id')
        .eq('selection_id', selectionId);

      if (error) {
        console.error('Erreur fetch selection product ids:', error);
        return [];
      }

      return (data || []).map(
        (item: { product_id: string }) => item.product_id
      );
    },
    enabled: !!selectionId,
    staleTime: 30000,
  });
}

/**
 * Hook: réorganiser les produits d'une sélection (drag & drop)
 */
export function useReorderProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      selectionId: string;
      orderedItemIds: string[];
    }) => {
      // Mettre à jour l'ordre de chaque item
      const updates = input.orderedItemIds.map((itemId, index) =>
        (supabase as any)
          .from('linkme_selection_items')
          .update({
            display_order: index,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId)
      );

      const results = await Promise.all(updates);

      // Vérifier les erreurs
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error('Erreur lors de la réorganisation');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['selection-items', variables.selectionId],
      });
    },
  });
}
