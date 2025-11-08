import { useState, useCallback } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/shared/modules/common/hooks';

interface ProductInventory {
  id: string;
  name: string;
  sku: string;
  product_image_url?: string;
  stock_quantity: number;
  total_in: number;
  total_out: number;
  total_adjustments: number;
  last_movement_at: string;
  movement_count: number;
}

interface InventoryStats {
  total_products: number;
  total_stock_value: number;
  total_movements: number;
  products_with_activity: number;
}

export function useStockInventory() {
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total_products: 0,
    total_stock_value: 0,
    total_movements: 0,
    products_with_activity: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const fetchInventory = useCallback(
    async (filters?: {
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    }) => {
      setLoading(true);
      setError(null);

      try {
        // Query pour récupérer l'inventaire consolidé avec mouvements
        // ✅ Phase 2: Ajout image produit (LEFT JOIN product_images)
        let query = supabase
          .from('products')
          .select(
            `
          id,
          name,
          sku,
          stock_quantity,
          stock_real,
          cost_price,
          product_images!left(public_url)
        `
          )
          .eq('product_images.is_primary', true)
          .limit(1, { foreignTable: 'product_images' })
          .is('archived_at', null);

        // Filtres de recherche
        if (filters?.search) {
          query = query.or(
            `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
          );
        }

        const { data: products, error: productsError } = await query;

        if (productsError) throw productsError;

        // Pour chaque produit, récupérer les mouvements agrégés
        const inventoryPromises = products.map(async product => {
          let movementsQuery = supabase
            .from('stock_movements')
            .select('quantity_change, performed_at, movement_type')
            .eq('product_id', product.id)
            .or('affects_forecast.is.null,affects_forecast.is.false')
            .order('performed_at', { ascending: false });

          // Filtres de période
          if (filters?.dateFrom) {
            movementsQuery = movementsQuery.gte(
              'performed_at',
              filters.dateFrom
            );
          }
          if (filters?.dateTo) {
            movementsQuery = movementsQuery.lte('performed_at', filters.dateTo);
          }

          const { data: movements, error: movementsError } =
            await movementsQuery;

          if (movementsError) throw movementsError;

          // Séparer les mouvements par type pour calculs corrects
          const inMovements =
            movements?.filter(m => m.movement_type === 'IN') || [];
          const outMovements =
            movements?.filter(m => m.movement_type === 'OUT') || [];
          const adjustMovements =
            movements?.filter(m => m.movement_type === 'ADJUST') || [];

          // Calculer totaux par type
          const total_in = inMovements.reduce(
            (sum, m) => sum + m.quantity_change,
            0
          );
          const total_out = outMovements.reduce(
            (sum, m) => sum + Math.abs(m.quantity_change),
            0
          );
          const total_adjustments = adjustMovements.reduce(
            (sum, m) => sum + m.quantity_change,
            0
          );

          const last_movement_at =
            movements && movements.length > 0
              ? movements[0].performed_at
              : null;

          return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            product_image_url:
              (product as any).product_images?.[0]?.public_url || null, // ✅ Phase 2: Image principale produit
            stock_quantity: product.stock_quantity || 0,
            total_in,
            total_out,
            total_adjustments,
            last_movement_at,
            movement_count: movements?.length || 0,
          };
        });

        const inventoryData = await Promise.all(inventoryPromises);

        // Filtrer pour ne garder que les produits avec mouvements
        const activeInventory = inventoryData.filter(
          item => item.movement_count > 0
        );

        // Calculer les statistiques
        // ✅ Valeur stock = stock_real (physique) * cost_price (prix indicatif d'achat)
        const statsData = {
          total_products: products.length,
          total_stock_value: products.reduce(
            (sum, p) => sum + (p.stock_real || 0) * (p.cost_price || 0),
            0
          ),
          total_movements: activeInventory.reduce(
            (sum, item) => sum + item.movement_count,
            0
          ),
          products_with_activity: activeInventory.length,
        };

        setInventory(activeInventory as any);
        setStats(statsData);
      } catch (err: any) {
        const errorMessage =
          err.message || "Erreur lors du chargement de l'inventaire";
        setError(errorMessage);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  const exportInventoryCSV = useCallback(
    (data: ProductInventory[]) => {
      const csvRows = [
        [
          'Produit',
          'SKU',
          'Entrées',
          'Sorties',
          'Ajustements',
          'Stock Actuel',
          'Dernière Activité',
        ].join(','),
        ...data.map(item =>
          [
            `"${item.name}"`,
            item.sku,
            item.total_in,
            item.total_out,
            item.total_adjustments,
            item.stock_quantity,
            item.last_movement_at
              ? new Date(item.last_movement_at).toLocaleDateString('fr-FR')
              : 'N/A',
          ].join(',')
        ),
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `inventaire-stock-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export réussi',
        description: `${data.length} produits exportés`,
      });
    },
    [toast]
  );

  return {
    inventory,
    stats,
    loading,
    error,
    fetchInventory,
    exportInventoryCSV,
  };
}
