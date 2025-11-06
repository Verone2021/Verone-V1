'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Types pour les produits archivés
interface ArchivedProduct {
  id: string;
  name: string;
  sku: string;
  description?: string;
  cost_price?: number;
  price_ttc?: number;
  status: 'archived' | 'discontinued' | 'end_of_life';
  archived_reason?: string;
  archived_at: string;
  created_at: string;
  updated_at: string;
  subcategory_id?: string;
  supplier_id?: string;
  images?: Array<{
    id: string;
    storage_path: string;
    is_primary: boolean;
    public_url?: string;
  }>;
}

interface ArchivedProductsState {
  products: ArchivedProduct[];
  loading: boolean;
  error: string | null;
  total: number;
}

export function useArchivedProducts() {
  const [state, setState] = useState<ArchivedProductsState>({
    products: [],
    loading: true,
    error: null,
    total: 0,
  });

  const supabase = createClient();

  // Charger tous les produits archivés
  const loadArchivedProducts = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error, count } = await supabase
        .from('products')
        .select(
          `
          id,
          name,
          sku,
          description,
          cost_price,
          price_ttc,
          status,
          archived_reason,
          archived_at,
          created_at,
          updated_at,
          subcategory_id,
          supplier_id,
          images:product_images(
            id,
            storage_path,
            is_primary
          )
        `,
          { count: 'exact' }
        )
        .eq('product_status', 'discontinued')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) throw error;

      // Enrichir les données avec les URLs publiques des images
      const enrichedProducts = (data || []).map(product => ({
        ...(product as any),
        images: ((product as any).images || []).map(
          (img: {
            id: string;
            storage_path: string;
            is_primary: boolean;
            public_url?: string;
          }) => ({
            ...img,
            public_url: img.storage_path
              ? supabase.storage
                  .from('product-images')
                  .getPublicUrl(img.storage_path).data.publicUrl
              : undefined,
          })
        ),
      }));

      setState(prev => ({
        ...prev,
        products: enrichedProducts,
        total: count || 0,
        loading: false,
      }));
    } catch (error) {
      console.error('❌ Erreur chargement produits archivés:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        loading: false,
      }));
    }
  };

  // Archiver un produit
  const archiveProduct = async (productId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          status: 'discontinued',
          archived_reason: reason,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) throw error;

      // Recharger la liste
      await loadArchivedProducts();

      console.log('✅ Produit archivé avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur archivage produit:', error);
      throw error;
    }
  };

  // Restaurer un produit archivé
  const restoreProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          status: 'in_stock',
          archived_reason: null,
          archived_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) throw error;

      // Mise à jour optimiste
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== productId),
        total: prev.total - 1,
      }));

      console.log('✅ Produit restauré avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur restauration produit:', error);
      throw error;
    }
  };

  // Supprimer définitivement un produit archivé
  const permanentlyDeleteProduct = async (productId: string) => {
    try {
      // Supprimer d'abord les images associées
      const { error: imagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (imagesError) throw imagesError;

      // Supprimer le produit
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      // Mise à jour optimiste
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== productId),
        total: prev.total - 1,
      }));

      console.log('✅ Produit supprimé définitivement');
      return true;
    } catch (error) {
      console.error('❌ Erreur suppression définitive:', error);
      throw error;
    }
  };

  // Charger les données au montage
  useEffect(() => {
    loadArchivedProducts();
  }, []);

  // Statistiques
  const stats = {
    total: state.products.length,
    archived: state.products.filter(p => p.status === 'archived').length,
    discontinued: state.products.filter(p => p.status === 'discontinued')
      .length,
    endOfLife: state.products.filter(p => p.status === 'end_of_life').length,
    recentlyArchived: state.products.filter(p => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(p.archived_at) > weekAgo;
    }).length,
  };

  return {
    ...state,
    loadArchivedProducts,
    archiveProduct,
    restoreProduct,
    permanentlyDeleteProduct,
    stats,
  };
}
