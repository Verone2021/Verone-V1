'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { VariantGroup } from '@verone/types';
import logger from '@verone/utils/logger';

import type {
  FetchedProduct,
  ProductImageRef,
  ToastFn,
} from './types/variant-group.types';

export interface VariantGroupArchiveDeps {
  supabase: SupabaseClient;
  toast: ToastFn;
  fetchVariantGroups: () => Promise<void>;
}

export function useVariantGroupArchive(deps: VariantGroupArchiveDeps) {
  const { supabase, toast, fetchVariantGroups } = deps;

  // Récupérer les produits disponibles (pas encore dans un groupe)
  const getAvailableProducts = async (subcategoryId?: string) => {
    let query = supabase
      .from('products')
      .select('id, name, sku, stock_status, product_status')
      .is('variant_group_id', null)
      .in('product_status', ['active', 'preorder'])
      .eq('creation_mode', 'complete')
      .order('name', { ascending: true });

    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erreur fetch produits disponibles', error, {
        operation: 'fetch_available_products_failed',
      });
      return [];
    }

    return data || [];
  };

  // Archiver un groupe de variantes (archive groupe + TOUS ses produits)
  const archiveVariantGroup = async (groupId: string): Promise<boolean> => {
    try {
      // 1. Archiver le groupe
      const { error: groupError } = await supabase
        .from('variant_groups')
        .update({
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', groupId);

      if (groupError) {
        toast({
          title: 'Erreur',
          description: groupError.message,
          variant: 'destructive',
        });
        return false;
      }

      // 2. Archiver TOUS les produits du groupe en cascade
      const { error: productsError } = await supabase
        .from('products')
        .update({
          archived_at: new Date().toISOString(),
          status: 'discontinued',
          updated_at: new Date().toISOString(),
        })
        .eq('variant_group_id', groupId)
        .is('archived_at', null); // Ne modifier que les produits non-archivés

      if (productsError) {
        toast({
          title: 'Avertissement',
          description: `Erreur lors de l'archivage des produits: ${productsError.message}`,
          variant: 'destructive',
        });
        // Continue quand même, le groupe est archivé
      }

      toast({
        title: 'Groupe archivé',
        description: 'Le groupe et tous ses produits ont été archivés',
      });

      await fetchVariantGroups();
      return true;
    } catch (err) {
      logger.error('Erreur archivage groupe', err as Error, {
        operation: 'archive_variant_group_failed',
      });
      toast({
        title: 'Erreur',
        description: "Impossible d'archiver le groupe",
        variant: 'destructive',
      });
      return false;
    }
  };

  // Restaurer un groupe archivé (restaure groupe + TOUS ses produits)
  const unarchiveVariantGroup = async (groupId: string): Promise<boolean> => {
    try {
      // 1. Restaurer le groupe
      const { error: groupError } = await supabase
        .from('variant_groups')
        .update({
          archived_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', groupId);

      if (groupError) {
        toast({
          title: 'Erreur',
          description: groupError.message,
          variant: 'destructive',
        });
        return false;
      }

      // 2. Restaurer TOUS les produits du groupe
      const { error: productsError } = await supabase
        .from('products')
        .update({
          archived_at: null,
          status: 'in_stock', // Remettre en stock par défaut
          updated_at: new Date().toISOString(),
        })
        .eq('variant_group_id', groupId)
        .not('archived_at', 'is', null); // Ne modifier que les produits archivés

      if (productsError) {
        toast({
          title: 'Avertissement',
          description: `Erreur lors de la restauration des produits: ${productsError.message}`,
          variant: 'destructive',
        });
      }

      toast({
        title: 'Groupe restauré',
        description: 'Le groupe et tous ses produits ont été restaurés',
      });

      await fetchVariantGroups();
      return true;
    } catch (err) {
      logger.error('Erreur restauration groupe', err as Error, {
        operation: 'restore_variant_group_failed',
      });
      toast({
        title: 'Erreur',
        description: 'Impossible de restaurer le groupe',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Charger les groupes de variantes archivés
  const loadArchivedVariantGroups = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('variant_groups')
        .select(
          'id, name, base_sku, subcategory_id, variant_type, product_count, has_common_supplier, supplier_id, dimensions_length, dimensions_width, dimensions_height, dimensions_unit, style, suitable_rooms, common_weight, has_common_weight, common_cost_price, has_common_cost_price, common_eco_tax, common_material, has_common_material, common_color, has_common_color, material_name_position, color_name_position, archived_at, created_at, updated_at'
        )
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (fetchError) {
        logger.error('Erreur chargement groupes archivés', fetchError, {
          operation: 'fetch_archived_groups_failed',
        });
        return [];
      }

      // Récupérer les produits des groupes archivés (incluant archivés et actifs)
      const typedData = (data ?? []) as { id: string }[];
      const groupIds = typedData.map(g => g.id);
      let allProducts: (FetchedProduct & { archived_at?: string | null })[] =
        [];

      if (groupIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select(
            'id, name, sku, stock_status, product_status, variant_group_id, variant_position, cost_price, weight, variant_attributes, archived_at'
          )
          .in('variant_group_id', groupIds)
          .order('variant_position', { ascending: true });

        allProducts = (productsData ?? []) as (FetchedProduct & {
          archived_at?: string | null;
        })[];
      }

      // Récupérer les images
      const productIds = allProducts.map(p => p.id);
      let allImages: ProductImageRef[] = [];

      if (productIds.length > 0) {
        const { data: imagesData } = await supabase
          .from('product_images')
          .select('product_id, public_url')
          .in('product_id', productIds)
          .order('display_order', { ascending: true });

        allImages = (imagesData ?? []) as ProductImageRef[];
      }

      // Associer les images aux produits
      const productsWithImages = allProducts.map(product => ({
        ...product,
        image_url: allImages.find(img => img.product_id === product.id)
          ?.public_url,
      }));

      // Grouper les produits par variant_group_id
      const groupsWithProducts = (data || []).map(group => ({
        ...group,
        products: productsWithImages.filter(
          p => p.variant_group_id === group.id
        ),
        product_count: productsWithImages.filter(
          p => p.variant_group_id === group.id
        ).length,
      }));

      return groupsWithProducts as unknown as VariantGroup[];
    } catch (err) {
      logger.error('Erreur chargement variant groups', err as Error, {
        operation: 'load_variant_groups_failed',
      });
      return [];
    }
  };

  return {
    getAvailableProducts,
    archiveVariantGroup,
    unarchiveVariantGroup,
    loadArchivedVariantGroups,
  };
}
