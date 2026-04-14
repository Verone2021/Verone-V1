'use client';

import { useMemo } from 'react';

import useSWR from 'swr';

import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@verone/common/hooks';

import {
  productsFetcher,
  PRODUCTS_PER_PAGE,
  CACHE_REVALIDATION_TIME,
} from './products-fetcher';

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;

  // 💰 PRICING - Colonne réelle DB
  margin_percentage: number; // Marge minimum en pourcentage
  // ⚠️ minimumSellingPrice = cost_price × (1 + margin_percentage/100) - CALCULÉ, pas stocké

  // ❌ Legacy: selling_price N'EXISTE PAS en Phase 1 - Prix de vente sera dans sales_order_items (Phase 2)
  cost_price?: number; // Prix de vente HT (colonne products.cost_price) - À SUPPRIMER en Phase 2

  // 🎯 Dual Status System (Phase 3.4 - Migration 2025-11-04)
  stock_status: 'in_stock' | 'out_of_stock' | 'coming_soon'; // Disponibilité physique (automatique)
  product_status: 'draft' | 'active' | 'preorder' | 'discontinued'; // Statut commercial (manuel)
  condition: 'new' | 'refurbished' | 'used';
  variant_attributes?: Record<string, unknown>;
  dimensions?: Record<string, unknown>;
  weight?: number;

  // ✅ BR-TECH-002: Images via product_images JOIN (primary_image_url enrichi côté client)
  primary_image_url?: string | null;
  video_url?: string;
  supplier_reference?: string;
  gtin?: string;

  // ✅ STOCK - Propriétés DB existantes
  stock_quantity?: number; // Stock quantity (legacy)
  stock_real?: number; // Stock réel physique
  stock_forecasted_in?: number; // Prévisions d'entrée
  stock_forecasted_out?: number; // Prévisions de sortie
  min_stock?: number; // Stock minimum

  supplier_page_url?: string;
  supplier_id?: string;

  // Champs descriptions ajoutés lors de la migration
  description?: string;
  technical_description?: string;
  selling_points?: string[];
  created_at: string;
  updated_at: string;

  // NOUVEAUX CHAMPS - Système sourcing et différenciation
  product_type?: 'standard' | 'custom';
  assigned_client_id?: string;
  creation_mode?: 'sourcing' | 'complete';

  // Relation fournisseur
  supplier?: {
    id: string;
    name: string;
    type: string;
  };

  // ✅ Images produit (relation many-to-one via product_images)
  product_images?: Array<{
    id: string;
    product_id: string;
    image_url: string;
    display_order: number | null;
    alt_text: string | null;
    is_primary: boolean | null;
  }>;

  // ✅ COMPUTED: Nom du fournisseur (calculé côté client depuis supplier.name)
  supplier_name?: string;

  // CALCULÉ: Prix minimum de vente (prix d'achat + marge)
  minimumSellingPrice?: number;
}

export interface ProductFilters {
  search?: string;
  status?: string;
  supplier_id?: string;
  category_id?: string;
  subcategory_id?: string;
  family_id?: string;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  is_published_online?: boolean;
}

export interface CreateProductData {
  // Champs obligatoires selon business rules (CONDITIONNELS selon mode)
  name: string; // Obligatoire TOUJOURS
  description?: string; // Obligatoire en mode COMPLETE uniquement
  subcategory_id?: string; // Obligatoire en mode COMPLETE uniquement

  // NOUVEAUX CHAMPS - Système sourcing et différenciation
  product_type?: 'standard' | 'custom'; // Type de produit
  assigned_client_id?: string; // Client assigné (obligatoire si product_type = 'custom')
  creation_mode?: 'sourcing' | 'complete'; // Mode de création
  supplier_page_url?: string; // URL fournisseur (obligatoire en mode SOURCING)

  // 🔥 FIX: cost_price RESTAURÉ (migration 20251017_007)
  cost_price?: number; // Prix d'achat HT fournisseur

  // 🔥 FIX: Champs de completion et status (pour wizard workflow)
  status?: string; // Statut de disponibilité (DEPRECATED - utiliser product_status + stock_status)
  completion_status?: string; // 'draft' ou 'active'
  completion_percentage?: number; // Pourcentage de complétion (0-100)

  // Champs automatiques (générés par la DB)
  // sku: généré automatiquement

  // Champs business rules
  availability_type?: string; // DEPRECATED - Remplacé par dual status system (product_status + stock_status)
  technical_description?: string; // Description technique interne
  selling_points?: string[]; // Points de vente
  requires_sample?: boolean; // Nécessite échantillon

  // Champs de marge et pricing
  margin_percentage?: number; // Marge en pourcentage (ex: 50 = 50%)
  target_margin_percentage?: number; // Marge cible pour calcul prix minimum

  // Champs de stock
  stock_quantity?: number;
  stock_real?: number;
  stock_forecasted_in?: number;
  stock_forecasted_out?: number;
  min_stock?: number;
  reorder_point?: number;

  // Champs optionnels existants
  slug?: string;
  condition?: string;
  variant_attributes?: Record<string, unknown>;
  dimensions?: Record<string, unknown>;
  weight?: number;
  brand?: string;

  // URLs et références
  video_url?: string;
  supplier_reference?: string;
  gtin?: string;
  supplier_id?: string;
}

// NOUVELLE interface spécialisée pour le sourcing rapide
export interface SourcingFormData {
  // 3 champs OBLIGATOIRES pour sourcing rapide
  name: string;
  supplier_page_url: string;
  // image: géré séparément via upload

  // Champs automatiques injectés
  creation_mode: 'sourcing';
  sourcing_type: 'interne' | 'client'; // Calculé automatiquement selon assigned_client_id
  assigned_client_id?: string; // Facultatif - si rempli → sourcing_type = 'client'
}

export function useProducts(filters?: ProductFilters, page: number = 0) {
  const { toast } = useToast();
  const supabase = createClient();

  // 🔑 Clé SWR stable basée sur filtres + page
  const swrKey = useMemo(
    () => ['products', JSON.stringify(filters ?? {}), page],
    [filters, page]
  );

  // 🚀 Utiliser SWR avec cache et revalidation automatique
  /* eslint-disable @typescript-eslint/no-unsafe-assignment -- SWR key destructuring returns unknown types */
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    ([_, filtersJson]) =>
      productsFetcher(
        'products' as string,
        JSON.parse(filtersJson as string) as ProductFilters | undefined,
        page
      ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: CACHE_REVALIDATION_TIME,
      keepPreviousData: true, // Garde les données pendant rechargement
    }
  );
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  const products = data?.products ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);

  // 📝 Méthodes CRUD avec invalidation cache SWR
  const createProduct = async (
    productData: CreateProductData
  ): Promise<Product | null> => {
    try {
      // ✅ FIX: Inline object literal pour inférence TypeScript Supabase (pattern commit b09a8a4)
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          slug:
            productData.slug ??
            productData.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-'),
          cost_price: productData.cost_price,
          margin_percentage: productData.margin_percentage,
          availability_type: productData.availability_type ?? 'normal',
          description: productData.description,
          subcategory_id: productData.subcategory_id,
          technical_description: productData.technical_description,
          selling_points: productData.selling_points ?? [],
          product_type: productData.product_type ?? 'standard',
          assigned_client_id: productData.assigned_client_id,
          creation_mode: productData.creation_mode ?? 'complete',
          supplier_page_url: productData.supplier_page_url,
          condition: productData.condition ?? 'new',
          variant_attributes: productData.variant_attributes,
          dimensions: productData.dimensions,
          weight: productData.weight,
          video_url: productData.video_url,
          supplier_reference: productData.supplier_reference,
          gtin: productData.gtin,
          supplier_id: productData.supplier_id,
          brand: productData.brand,
          target_margin_percentage: productData.target_margin_percentage,
          status: productData.status,
          completion_status: productData.completion_status,
          completion_percentage: productData.completion_percentage,
          requires_sample: productData.requires_sample,
          stock_quantity: productData.stock_quantity,
          stock_real: productData.stock_real,
          stock_forecasted_in: productData.stock_forecasted_in,
          stock_forecasted_out: productData.stock_forecasted_out,
          min_stock: productData.min_stock,
          reorder_point: productData.reorder_point,
        } as unknown as import('@verone/types').Database['public']['Tables']['products']['Insert'])
        .select(
          'id, name, sku, slug, cost_price, margin_percentage, stock_status, product_status, condition, variant_attributes, dimensions, weight, video_url, supplier_reference, gtin, stock_quantity, supplier_page_url, supplier_id, description, technical_description, selling_points, product_type, assigned_client_id, creation_mode, created_at, updated_at'
        )
        .single();

      if (error) throw error;

      // 🔄 Invalider cache SWR pour refresh auto
      await mutate();

      toast({
        title: 'Succès',
        description: 'Produit créé avec succès',
      });
      return newProduct as unknown as Product;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la création';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProduct = async (
    id: string,
    productData: Partial<CreateProductData>
  ): Promise<Product | null> => {
    try {
      const { data: updatedProduct, error } = await supabase
        .from('products')

        .update(productData as Record<string, unknown>)
        .eq('id', id)
        .select(
          'id, name, sku, slug, cost_price, margin_percentage, stock_status, product_status, condition, variant_attributes, dimensions, weight, video_url, supplier_reference, gtin, stock_quantity, supplier_page_url, supplier_id, description, technical_description, selling_points, product_type, assigned_client_id, creation_mode, created_at, updated_at'
        )
        .single();

      if (error) throw error;

      // 🔄 Invalider cache SWR
      await mutate();

      toast({
        title: 'Succès',
        description: 'Produit mis à jour avec succès',
      });
      return updatedProduct as Product;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) throw error;

      // 🔄 Invalider cache SWR
      await mutate();

      toast({
        title: 'Succès',
        description: 'Produit supprimé avec succès',
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    products,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: () => mutate(),
    createProduct,
    updateProduct,
    deleteProduct,
    // 📄 Pagination
    page,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages - 1,
    hasPreviousPage: page > 0,
  };
}

// useProduct extracted to use-product.ts for file size
export { useProduct } from './use-product';
