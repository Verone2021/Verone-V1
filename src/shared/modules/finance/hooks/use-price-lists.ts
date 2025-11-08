/**
 * Hook React: Gestion Listes de Prix (CRUD Complet)
 *
 * Gestion administrative des listes de prix avec:
 * - CRUD listes de prix (base, channel, customer_group, promotional, contract)
 * - CRUD items de prix avec paliers quantités
 * - Assignment listes aux clients/canaux
 * - Historique modifications
 * - Validation règles métier
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/shared/modules/common/hooks';

// =====================================================================
// TYPES
// =====================================================================

export type PriceListType =
  | 'base'
  | 'customer_group'
  | 'channel'
  | 'promotional'
  | 'contract';

export interface PriceList {
  id: string;
  code: string;
  name: string;
  description: string | null;
  list_type: PriceListType;
  priority: number;
  currency: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PriceListItem {
  id: string;
  price_list_id: string;
  product_id: string;
  cost_price: number;
  discount_rate: number | null;
  min_quantity: number;
  max_quantity: number | null;
  margin_rate: number | null;
  currency: string;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Relations jointes
  products?: {
    id: string;
    name: string;
    sku: string;
    cost_price: number;
  };
  price_lists?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface CreatePriceListData {
  code: string;
  name: string;
  description?: string;
  list_type: PriceListType;
  priority?: number;
  currency?: string;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
}

export interface UpdatePriceListData {
  code?: string;
  name?: string;
  description?: string;
  list_type?: PriceListType;
  priority?: number;
  currency?: string;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
}

export interface CreatePriceListItemData {
  price_list_id: string;
  product_id: string;
  cost_price: number;
  discount_rate?: number;
  min_quantity?: number;
  max_quantity?: number;
  margin_rate?: number;
  currency?: string;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
  notes?: string;
}

export interface UpdatePriceListItemData {
  cost_price?: number;
  discount_rate?: number;
  min_quantity?: number;
  max_quantity?: number;
  margin_rate?: number;
  currency?: string;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
  notes?: string;
}

// =====================================================================
// HOOK: usePriceLists (Liste des listes de prix)
// =====================================================================

export function usePriceLists(filters?: {
  list_type?: PriceListType;
  is_active?: boolean;
}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['price-lists', filters],
    queryFn: async (): Promise<PriceList[]> => {
      try {
        let query = (supabase as any)
          .from('price_lists')
          .select('*')
          .order('priority', { ascending: true });

        if (filters?.list_type) {
          query = query.eq('list_type', filters.list_type);
        }

        if (filters?.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active);
        }

        const { data, error } = await query;

        if (error) {
          logger.error('Failed to fetch price lists', undefined, {
            operation: 'usePriceLists',
            error: error.message,
            filters,
          });
          throw error;
        }

        logger.info('Price lists fetched successfully', {
          operation: 'usePriceLists',
          count: data?.length || 0,
        });

        return (data as unknown as PriceList[]) || [];
      } catch (error) {
        logger.error('Exception in usePriceLists', undefined, {
          operation: 'usePriceLists',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

// =====================================================================
// HOOK: usePriceList (Détail liste de prix)
// =====================================================================

export function usePriceList(priceListId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['price-list', priceListId],
    queryFn: async (): Promise<PriceList | null> => {
      if (!priceListId) return null;

      try {
        const { data, error } = await (supabase as any)
          .from('price_lists')
          .select('*')
          .eq('id', priceListId)
          .single();

        if (error) {
          logger.error('Failed to fetch price list', undefined, {
            operation: 'usePriceList',
            priceListId,
            error: error.message,
          });
          throw error;
        }

        return data as unknown as PriceList;
      } catch (error) {
        logger.error('Exception in usePriceList', undefined, {
          operation: 'usePriceList',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled: !!priceListId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// =====================================================================
// HOOK: usePriceListItems (Items d'une liste de prix)
// =====================================================================

export function usePriceListItems(priceListId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['price-list-items', priceListId],
    queryFn: async (): Promise<PriceListItem[]> => {
      if (!priceListId) return [];

      try {
        const { data, error } = await (supabase as any)
          .from('price_list_items')
          .select(
            `
            *,
            products (
              id,
              name,
              sku,
              cost_price,
              product_images!left (
                public_url,
                is_primary
              )
            ),
            price_lists (
              id,
              code,
              name
            )
          `
          )
          .eq('price_list_id', priceListId)
          .order('min_quantity', { ascending: true });

        if (error) {
          logger.error('Failed to fetch price list items', undefined, {
            operation: 'usePriceListItems',
            priceListId,
            error: error.message,
          });
          throw error;
        }

        logger.info('Price list items fetched successfully', {
          operation: 'usePriceListItems',
          priceListId,
          count: data?.length || 0,
        });

        // Enrichir les produits avec primary_image_url (BR-TECH-002)
        const enrichedItems = (data || []).map((item: any) => ({
          ...item,
          products: item.products
            ? {
                ...item.products,
                primary_image_url:
                  item.products.product_images?.[0]?.public_url || null,
              }
            : null,
        }));

        return enrichedItems as unknown as PriceListItem[];
      } catch (error) {
        logger.error('Exception in usePriceListItems', undefined, {
          operation: 'usePriceListItems',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled: !!priceListId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// =====================================================================
// MUTATION: createPriceList
// =====================================================================

export function useCreatePriceList() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePriceListData): Promise<PriceList> => {
      try {
        const { data: user } = await supabase.auth.getUser();

        const { data: priceList, error } = await (supabase as any)
          .from('price_lists')
          .insert({
            code: data.code,
            name: data.name,
            description: data.description || null,
            list_type: data.list_type,
            priority: data.priority || 100,
            currency: data.currency || 'EUR',
            valid_from: data.valid_from || null,
            valid_until: data.valid_until || null,
            is_active: data.is_active !== undefined ? data.is_active : true,
            created_by: user.user?.id || null,
          })
          .select()
          .single();

        if (error) {
          logger.error('Failed to create price list', undefined, {
            operation: 'createPriceList',
            error: error.message,
            data,
          });
          throw error;
        }

        if (!priceList) {
          throw new Error('Price list creation returned null');
        }

        logger.info('Price list created successfully', {
          operation: 'createPriceList',
          priceListId: priceList.id,
        });

        return priceList as unknown as PriceList;
      } catch (error) {
        logger.error('Exception in createPriceList', undefined, {
          operation: 'createPriceList',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      toast({
        title: 'Succès',
        description: 'Liste de prix créée avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de créer la liste de prix',
        variant: 'destructive',
      });
    },
  });
}

// =====================================================================
// MUTATION: updatePriceList
// =====================================================================

export function useUpdatePriceList() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      priceListId,
      data,
    }: {
      priceListId: string;
      data: UpdatePriceListData;
    }): Promise<PriceList> => {
      try {
        const { data: user } = await supabase.auth.getUser();

        const { data: priceList, error } = await (supabase as any)
          .from('price_lists')
          .update({
            ...data,
            updated_by: user.user?.id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', priceListId)
          .select()
          .single();

        if (error) {
          logger.error('Failed to update price list', undefined, {
            operation: 'updatePriceList',
            priceListId,
            error: error.message,
          });
          throw error;
        }

        logger.info('Price list updated successfully', {
          operation: 'updatePriceList',
          priceListId,
        });

        return priceList as unknown as PriceList;
      } catch (error) {
        logger.error('Exception in updatePriceList', undefined, {
          operation: 'updatePriceList',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      queryClient.invalidateQueries({
        queryKey: ['price-list', variables.priceListId],
      });
      toast({
        title: 'Succès',
        description: 'Liste de prix mise à jour avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de mettre à jour la liste de prix',
        variant: 'destructive',
      });
    },
  });
}

// =====================================================================
// MUTATION: deletePriceList
// =====================================================================

export function useDeletePriceList() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (priceListId: string): Promise<void> => {
      try {
        const { error } = await (supabase as any)
          .from('price_lists')
          .delete()
          .eq('id', priceListId);

        if (error) {
          logger.error('Failed to delete price list', undefined, {
            operation: 'deletePriceList',
            priceListId,
            error: error.message,
          });
          throw error;
        }

        logger.info('Price list deleted successfully', {
          operation: 'deletePriceList',
          priceListId,
        });
      } catch (error) {
        logger.error('Exception in deletePriceList', undefined, {
          operation: 'deletePriceList',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      toast({
        title: 'Succès',
        description: 'Liste de prix supprimée avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de supprimer la liste de prix',
        variant: 'destructive',
      });
    },
  });
}

// =====================================================================
// MUTATION: createPriceListItem
// =====================================================================

export function useCreatePriceListItem() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      data: CreatePriceListItemData
    ): Promise<PriceListItem> => {
      try {
        const { data: item, error } = await (supabase as any)
          .from('price_list_items')
          .insert({
            price_list_id: data.price_list_id,
            product_id: data.product_id,
            cost_price: data.cost_price,
            discount_rate: data.discount_rate || null,
            min_quantity: data.min_quantity || 1,
            max_quantity: data.max_quantity || null,
            margin_rate: data.margin_rate || null,
            currency: data.currency || 'EUR',
            valid_from: data.valid_from || null,
            valid_until: data.valid_until || null,
            is_active: data.is_active !== undefined ? data.is_active : true,
            notes: data.notes || null,
          })
          .select()
          .single();

        if (error) {
          logger.error('Failed to create price list item', undefined, {
            operation: 'createPriceListItem',
            error: error.message,
            data,
          });
          throw error;
        }

        if (!item) {
          throw new Error('Price list item creation returned null');
        }

        logger.info('Price list item created successfully', {
          operation: 'createPriceListItem',
          itemId: item.id,
        });

        return item as unknown as PriceListItem;
      } catch (error) {
        logger.error('Exception in createPriceListItem', undefined, {
          operation: 'createPriceListItem',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['price-list-items', variables.price_list_id],
      });
      queryClient.invalidateQueries({ queryKey: ['pricing-v2'] });
      toast({
        title: 'Succès',
        description: 'Item de prix ajouté avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'ajouter l'item de prix",
        variant: 'destructive',
      });
    },
  });
}

// =====================================================================
// MUTATION: updatePriceListItem
// =====================================================================

export function useUpdatePriceListItem() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      priceListId: string; // Garde pour compatibilité interface mais non utilisé
      data: UpdatePriceListItemData;
    }): Promise<PriceListItem> => {
      try {
        const { data: item, error } = await (supabase as any)
          .from('price_list_items')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId)
          .select()
          .single();

        if (error) {
          logger.error('Failed to update price list item', undefined, {
            operation: 'updatePriceListItem',
            itemId,
            error: error.message,
          });
          throw error;
        }

        logger.info('Price list item updated successfully', {
          operation: 'updatePriceListItem',
          itemId,
        });

        return item as unknown as PriceListItem;
      } catch (error) {
        logger.error('Exception in updatePriceListItem', undefined, {
          operation: 'updatePriceListItem',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['price-list-items', variables.priceListId],
      });
      queryClient.invalidateQueries({ queryKey: ['pricing-v2'] });
      toast({
        title: 'Succès',
        description: 'Item de prix mis à jour avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour l'item de prix",
        variant: 'destructive',
      });
    },
  });
}

// =====================================================================
// MUTATION: deletePriceListItem
// =====================================================================

export function useDeletePriceListItem() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
    }: {
      itemId: string;
      priceListId: string; // Garde pour compatibilité interface mais non utilisé
    }): Promise<void> => {
      try {
        const { error } = await (supabase as any)
          .from('price_list_items')
          .delete()
          .eq('id', itemId);

        if (error) {
          logger.error('Failed to delete price list item', undefined, {
            operation: 'deletePriceListItem',
            itemId,
            error: error.message,
          });
          throw error;
        }

        logger.info('Price list item deleted successfully', {
          operation: 'deletePriceListItem',
          itemId,
        });
      } catch (error) {
        logger.error('Exception in deletePriceListItem', undefined, {
          operation: 'deletePriceListItem',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['price-list-items', variables.priceListId],
      });
      queryClient.invalidateQueries({ queryKey: ['pricing-v2'] });
      toast({
        title: 'Succès',
        description: 'Item de prix supprimé avec succès',
      });
    },
    onError: error => {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer l'item de prix",
        variant: 'destructive',
      });
    },
  });
}
