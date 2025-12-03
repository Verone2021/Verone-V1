'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// ID du canal LinkMe
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

// Types
export interface LinkMeSupplier {
  id: string;
  supplier_id: string;
  is_visible_as_partner: boolean;
  display_order: number | null;
  supplier: {
    id: string;
    legal_name: string;
    logo_url: string | null;
  };
  products_count?: number;
}

/**
 * Récupère la liste des fournisseurs LinkMe avec nombre de produits
 */
async function fetchLinkMeSuppliers(): Promise<LinkMeSupplier[]> {
  // Récupérer les fournisseurs du canal LinkMe
  const { data: suppliers, error } = await supabase
    .from('linkme_channel_suppliers')
    .select(
      `
      id,
      supplier_id,
      is_visible_as_partner,
      display_order,
      supplier:supplier_id(id, legal_name, logo_url)
    `
    )
    .eq('channel_id', LINKME_CHANNEL_ID)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Erreur fetch fournisseurs LinkMe:', error);
    throw error;
  }

  if (!suppliers) return [];

  // Récupérer le compte de produits par fournisseur
  const supplierIds = suppliers.map(s => s.supplier_id);

  const { data: productCounts } = await supabase
    .from('channel_pricing')
    .select(
      `
      product_id,
      products!inner(supplier_id)
    `
    )
    .eq('channel_id', LINKME_CHANNEL_ID)
    .in('products.supplier_id', supplierIds);

  // Compter les produits par fournisseur
  const countBySupplier: Record<string, number> = {};
  if (productCounts) {
    for (const item of productCounts) {
      const supplierId = item.products?.supplier_id;
      if (supplierId) {
        countBySupplier[supplierId] = (countBySupplier[supplierId] || 0) + 1;
      }
    }
  }

  // Ajouter le compte aux fournisseurs - cast explicite pour retour typé
  return suppliers.map(s => ({
    ...s,
    products_count: countBySupplier[s.supplier_id] || 0,
  })) as LinkMeSupplier[];
}

/**
 * Hook: Liste des fournisseurs LinkMe
 */
export function useLinkMeSuppliers() {
  return useQuery({
    queryKey: ['linkme-suppliers'],
    queryFn: fetchLinkMeSuppliers,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook: Toggle visibilité fournisseur comme partenaire
 */
export function useToggleLinkMeSupplierVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isVisible,
    }: {
      id: string;
      isVisible: boolean;
    }) => {
      const { error } = await supabase
        .from('linkme_channel_suppliers')
        .update({ is_visible_as_partner: isVisible })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-suppliers'] });
    },
  });
}

/**
 * Hook: Modifier l'ordre d'affichage d'un fournisseur
 */
export function useUpdateLinkMeSupplierOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      displayOrder,
    }: {
      id: string;
      displayOrder: number;
    }) => {
      const { error } = await supabase
        .from('linkme_channel_suppliers')
        .update({ display_order: displayOrder })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-suppliers'] });
    },
  });
}
