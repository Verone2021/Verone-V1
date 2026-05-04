'use client';

import { useState, useEffect } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import type { SourcingProduct, SourcingFilters } from './types';

export function useSourcingFetch(filters?: SourcingFilters) {
  const [products, setProducts] = useState<SourcingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // 🔥 FIX SIMPLE: Utiliser fonction classique au lieu de useCallback
  // Cela évite les dépendances circulaires
  const fetchSourcingProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Requête de base pour produits en sourcing avec jointures organisations
      let query = supabase
        .from('products')
        .select(
          `
          id,
          sku,
          name,
          supplier_page_url,
          supplier_reference,
          cost_price,
          cost_net_avg,
          eco_tax_default,
          stock_status,
          product_status,
          supplier_id,
          creation_mode,
          sourcing_type,
          requires_sample,
          assigned_client_id,
          margin_percentage,
          manufacturer,
          description,
          supplier_moq,
          dimensions,
          weight,
          internal_notes,
          sourcing_channel,
          sourcing_status,
          sourcing_priority,
          sourcing_tags,
          target_price,
          sourcing_notes,
          consultation_id,
          created_at,
          updated_at,
          archived_at,
          supplier:organisations!products_supplier_id_fkey(
            id,
            legal_name,
            trade_name,
            type,
            website
          ),
          assigned_client:organisations!products_assigned_client_id_fkey(
            id,
            legal_name,
            trade_name,
            type
          ),
          product_images!left(
            public_url,
            cloudflare_image_id,
            is_primary
          )
        `
        )
        .eq('creation_mode', 'sourcing')
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
        );
      }

      if (filters?.product_status) {
        query = query.eq(
          'product_status',
          filters.product_status as
            | 'active'
            | 'draft'
            | 'preorder'
            | 'discontinued'
        );
      }

      if (filters?.sourcing_type) {
        query = query.eq('sourcing_type', filters.sourcing_type);
      }

      if (filters?.has_supplier !== undefined) {
        if (filters.has_supplier) {
          query = query.not('supplier_id', 'is', null);
        } else {
          query = query.is('supplier_id', null);
        }
      }

      if (filters?.requires_sample !== undefined) {
        query = query.eq('requires_sample', filters.requires_sample);
      }

      // 🆕 Filtre par fournisseur spécifique
      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      // 🆕 Filtre par client assigné spécifique
      if (filters?.assigned_client_id) {
        query = query.eq('assigned_client_id', filters.assigned_client_id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les produits en sourcing',
          variant: 'destructive',
        });
        return;
      }

      // Enrichir les produits avec les calculs (BR-TECH-002: images via product_images)
      const enrichedProducts = (data || []).map(product => {
        const supplierCost = product.cost_price ?? 0; // Prix d'achat LPP comme base calcul
        const margin = product.margin_percentage ?? 50; // Marge par défaut 50%
        const estimatedSellingPrice = supplierCost * (1 + margin / 100);

        // ✅ FIX: Calculer les noms d'affichage pour supplier et assigned_client
        const supplierWithName = product.supplier
          ? {
              ...product.supplier,
              name:
                product.supplier.trade_name ??
                product.supplier.legal_name ??
                'Fournisseur',
            }
          : null;

        const clientWithName = product.assigned_client
          ? {
              ...product.assigned_client,
              name:
                product.assigned_client.trade_name ??
                product.assigned_client.legal_name ??
                'Client',
            }
          : null;

        return {
          ...product,
          supplier: supplierWithName,
          assigned_client: clientWithName,
          estimated_selling_price: estimatedSellingPrice,
        };
      });

      setProducts(enrichedProducts as SourcingProduct[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🔥 FIX: Appeler directement sans dépendances sur la fonction
    // Dépendre uniquement des valeurs primitives de filters
    void fetchSourcingProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.search,
    filters?.product_status,
    filters?.sourcing_type,
    filters?.has_supplier,
    filters?.requires_sample,
  ]);

  return { products, setProducts, loading, error, fetchSourcingProducts };
}
