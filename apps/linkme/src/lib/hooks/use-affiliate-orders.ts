/**
 * Hook: use-affiliate-orders
 * Gestion des commandes créées par les affiliés
 * ==============================================
 * - Création de commandes depuis l'app LinkMe
 * - Liste des clients de l'affilié
 * - Marge NON modifiable (vient de la sélection)
 * - Seul modifiable: quantités
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export interface CreateAffiliateOrderInput {
  affiliateId: string;
  customerId: string;
  customerType: 'organization' | 'individual';
  selectionId: string;
  items: Array<{
    selection_item_id: string;
    quantity: number;
  }>;
  notes?: string;
}

export interface AffiliateCustomer {
  id: string;
  name: string;
  customer_type: 'organization' | 'individual';
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  is_franchisee: boolean;
  created_at: string;
}

export interface CreateCustomerOrgInput {
  affiliateId: string;
  legalName: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
}

export interface CreateCustomerIndividualInput {
  affiliateId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook pour créer une commande affilié
 * Utilise la RPC create_affiliate_order qui:
 * - Valide l'affilié et la sélection
 * - Crée la commande en draft avec pending_admin_validation = true
 * - Récupère la marge depuis linkme_selection_items (pas du frontend)
 */
export function useCreateAffiliateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAffiliateOrderInput) => {
      const supabase = createClient();

      const { data, error } = await (supabase.rpc as any)(
        'create_affiliate_order',
        {
          p_affiliate_id: input.affiliateId,
          p_customer_id: input.customerId,
          p_customer_type: input.customerType,
          p_selection_id: input.selectionId,
          p_items: input.items,
          p_notes: input.notes || null,
        }
      );

      if (error) {
        console.error('Erreur création commande affilié:', error);
        throw new Error(
          error.message || 'Erreur lors de la création de la commande'
        );
      }

      return data as string; // order_id
    },
    onSuccess: (orderId, variables) => {
      // Invalider les caches pertinents
      queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      queryClient.invalidateQueries({
        queryKey: ['linkme-orders', variables.affiliateId],
      });
      queryClient.invalidateQueries({
        queryKey: ['affiliate-orders', variables.affiliateId],
      });

      toast.success('Commande créée !', {
        description: "En attente de validation par l'équipe.",
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de créer la commande',
      });
    },
  });
}

/**
 * Hook pour récupérer les clients de l'affilié
 * Utilise la RPC get_customers_for_affiliate
 */
export function useAffiliateCustomers(affiliateId: string | null) {
  return useQuery({
    queryKey: ['affiliate-customers', affiliateId],
    queryFn: async () => {
      if (!affiliateId) return [];

      const supabase = createClient();

      const { data, error } = await (supabase.rpc as any)(
        'get_customers_for_affiliate',
        {
          p_affiliate_id: affiliateId,
        }
      );

      if (error) {
        console.error('Erreur récupération clients affilié:', error);
        throw error;
      }

      return (data || []) as AffiliateCustomer[];
    },
    enabled: !!affiliateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour créer un client organisation pour l'affilié
 */
export function useCreateCustomerOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCustomerOrgInput) => {
      const supabase = createClient();

      const { data, error } = await (supabase.rpc as any)(
        'create_customer_organisation_for_affiliate',
        {
          p_affiliate_id: input.affiliateId,
          p_legal_name: input.legalName,
          p_trade_name: input.tradeName || null,
          p_email: input.email || null,
          p_phone: input.phone || null,
          p_address: input.address || null,
          p_postal_code: input.postalCode || null,
          p_city: input.city || null,
        }
      );

      if (error) {
        console.error('Erreur création organisation:', error);
        throw new Error(
          error.message || 'Erreur lors de la création du client'
        );
      }

      return data as string; // customer_id
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['affiliate-customers', variables.affiliateId],
      });
      toast.success('Client créé');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de créer le client',
      });
    },
  });
}

/**
 * Hook pour créer un client particulier pour l'affilié
 */
export function useCreateCustomerIndividual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCustomerIndividualInput) => {
      const supabase = createClient();

      const { data, error } = await (supabase.rpc as any)(
        'create_customer_individual_for_affiliate',
        {
          p_affiliate_id: input.affiliateId,
          p_first_name: input.firstName,
          p_last_name: input.lastName,
          p_email: input.email || null,
          p_phone: input.phone || null,
          p_address: input.address || null,
          p_postal_code: input.postalCode || null,
          p_city: input.city || null,
        }
      );

      if (error) {
        console.error('Erreur création client individuel:', error);
        throw new Error(
          error.message || 'Erreur lors de la création du client'
        );
      }

      return data as string; // customer_id
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['affiliate-customers', variables.affiliateId],
      });
      toast.success('Client créé');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de créer le client',
      });
    },
  });
}

/**
 * Hook pour récupérer les produits d'une sélection avec leurs marges
 * Utilise la même approche que useSelectionItems pour compatibilité RLS
 */
export function useSelectionProducts(selectionId: string | null) {
  return useQuery({
    queryKey: ['selection-products', selectionId],
    queryFn: async () => {
      if (!selectionId) return [];

      const supabase = createClient();

      // Utilise la syntaxe alias "product:products(...)" comme useSelectionItems
      const { data, error } = await supabase
        .from('linkme_selection_items')
        .select(
          `
          id,
          product_id,
          base_price_ht,
          selling_price_ht,
          margin_rate,
          product:products(
            name,
            sku,
            subcategory_id
          )
        `
        )
        .eq('selection_id', selectionId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Erreur récupération produits sélection:', error);
        throw error;
      }

      // Récupérer les images séparément (comme useSelectionItems)
      const productIds = (data || []).map((item: any) => item.product_id);
      let imageMap = new Map<string, string>();

      if (productIds.length > 0) {
        const { data: images } = await supabase
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
        productId: item.product_id,
        productName: item.product?.name || 'Produit inconnu',
        productSku: item.product?.sku || '',
        productImage: imageMap.get(item.product_id) || null,
        basePriceHt: item.base_price_ht || 0,
        sellingPriceHt: item.selling_price_ht || 0,
        marginRate: item.margin_rate || 0,
        taxRate: 0.2, // TVA 20% par défaut (stockée sur sales_order_items, pas products)
        subcategoryId: item.product?.subcategory_id || null,
      }));
    },
    enabled: !!selectionId,
    staleTime: 5 * 60 * 1000,
  });
}
