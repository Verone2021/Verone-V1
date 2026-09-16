'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

export const SAMPLE_DRAFT_ORDER_QUERY_KEY = 'sourcing-sample-draft-order';
export const SAMPLE_CANDIDATES_QUERY_KEY = 'sourcing-sample-candidates';

/** Ligne d'une commande échantillon brouillon. */
export interface SampleDraftLine {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceHt: number;
  /** Part des frais de la commande imputée à cette ligne (calculée en base). */
  allocatedFeesHt: number;
  /** Coût rendu unitaire calculé par la base (prix + éco-part + frais / quantité). */
  unitCostNet: number | null;
}

/** Commande échantillon brouillon d'un fournisseur, avec son contenu. */
export interface SampleDraftOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  shippingCostHt: number;
  customsCostHt: number;
  insuranceCostHt: number;
  lines: SampleDraftLine[];
}

/**
 * Commande échantillon **brouillon** du fournisseur — [BO-SOURCING-SAMPLE-002]
 *
 * `request_sample_order` regroupe déjà plusieurs produits d'un même fournisseur
 * dans cette commande tant qu'elle n'est pas validée. Ce hook la rend visible
 * depuis la fiche sourcing, ce qui manquait entièrement.
 */
export function useSampleDraftOrder(supplierId: string | null | undefined) {
  return useQuery({
    queryKey: [SAMPLE_DRAFT_ORDER_QUERY_KEY, supplierId],
    enabled: Boolean(supplierId),
    staleTime: 30_000,
    queryFn: async (): Promise<SampleDraftOrder | null> => {
      if (!supplierId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(
          `id, po_number, supplier_id,
           shipping_cost_ht, customs_cost_ht, insurance_cost_ht,
           items:purchase_order_items(
             id, product_id, quantity, unit_price_ht,
             allocated_shipping_ht, allocated_customs_ht, allocated_insurance_ht,
             unit_cost_net, archived_at,
             product:products(sku, name)
           )`
        )
        .eq('supplier_id', supplierId)
        .eq('po_type', 'sample')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const lines: SampleDraftLine[] = (data.items ?? [])
        .filter(item => item.archived_at === null)
        .map(item => ({
          id: item.id,
          productId: item.product_id,
          sku: item.product?.sku ?? '—',
          name: item.product?.name ?? 'Produit',
          quantity: item.quantity,
          unitPriceHt: item.unit_price_ht,
          allocatedFeesHt:
            (item.allocated_shipping_ht ?? 0) +
            (item.allocated_customs_ht ?? 0) +
            (item.allocated_insurance_ht ?? 0),
          unitCostNet: item.unit_cost_net,
        }));

      return {
        id: data.id,
        poNumber: data.po_number,
        supplierId: data.supplier_id,
        shippingCostHt: data.shipping_cost_ht ?? 0,
        customsCostHt: data.customs_cost_ht ?? 0,
        insuranceCostHt: data.insurance_cost_ht ?? 0,
        lines,
      };
    },
  });
}

/** Produit du même fournisseur qu'on peut ajouter à la commande échantillon. */
export interface SampleCandidateProduct {
  id: string;
  sku: string;
  name: string;
  costPrice: number;
}

/**
 * Produits en sourcing du même fournisseur, encore commandables en échantillon :
 * non retirés, prix d'achat renseigné, et sans échantillon déjà en cours
 * (même règle que la garde VS001 de `request_sample_order`).
 */
export function useSampleCandidates(
  supplierId: string | null | undefined,
  excludeProductId?: string
) {
  return useQuery({
    queryKey: [SAMPLE_CANDIDATES_QUERY_KEY, supplierId, excludeProductId],
    enabled: Boolean(supplierId),
    staleTime: 30_000,
    queryFn: async (): Promise<SampleCandidateProduct[]> => {
      if (!supplierId) return [];
      const supabase = createClient();

      const { data: products, error } = await supabase
        .from('products')
        .select('id, sku, name, cost_price')
        .eq('creation_mode', 'sourcing')
        .eq('supplier_id', supplierId)
        .is('archived_at', null)
        .gt('cost_price', 0)
        .order('name')
        .limit(200);

      if (error) throw error;

      const ids = (products ?? [])
        .map(p => p.id)
        .filter(id => id !== excludeProductId);
      if (ids.length === 0) return [];

      // Produits qui ont déjà un échantillon actif : exclus, la base les
      // refuserait (VS001).
      const { data: active, error: activeError } = await supabase
        .from('purchase_order_items')
        .select(
          'product_id, purchase_order:purchase_orders!inner(po_type, status)'
        )
        .in('product_id', ids)
        .is('archived_at', null)
        .eq('purchase_order.po_type', 'sample')
        .neq('purchase_order.status', 'cancelled')
        .limit(500);

      if (activeError) throw activeError;

      const alreadyOrdered = new Set(
        (active ?? []).map(row => row.product_id).filter(Boolean)
      );

      return (products ?? [])
        .filter(p => ids.includes(p.id) && !alreadyOrdered.has(p.id))
        .map(p => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          costPrice: p.cost_price ?? 0,
        }));
    },
  });
}
