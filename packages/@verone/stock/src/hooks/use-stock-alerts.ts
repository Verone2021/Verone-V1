import { useState, useCallback, useEffect } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

// Types d'alertes stock
export type StockAlertType =
  | 'low_stock'
  | 'out_of_stock'
  | 'no_stock_but_ordered';

export interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  product_image_url?: string | null; // ✅ URL image principale produit
  alert_type: StockAlertType;
  severity: 'critical' | 'warning' | 'info';
  stock_real: number;
  stock_forecasted_in: number;
  stock_forecasted_out: number;
  min_stock: number;
  shortage_quantity: number;

  // Tracking commandes brouillon
  quantity_in_draft: number | null;
  draft_order_id: string | null;
  draft_order_number: string | null;
  is_in_draft: boolean;

  // Validation
  validated: boolean;
  validated_at: string | null;

  related_orders?: {
    order_number: string;
    quantity: number;
  }[];
}

export function useStockAlerts() {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const { toast } = useToast();
  const supabase = createClient();

  const fetchAlerts = useCallback(
    async (type?: StockAlertType) => {
      setLoading(true);
      try {
        // Query stock_alert_tracking avec jointures
        // ✅ FIX Phase 3: Filtrer alertes validées
        // Workflow: ROUGE (non commandé) → VERT (draft) → DISPARAÎT (validated)
        // Les alertes validated=true doivent disparaître de la liste
        let query = supabase
          .from('stock_alert_tracking')
          .select(
            `
          id,
          product_id,
          alert_type,
          alert_priority,
          stock_real,
          stock_forecasted_out,
          min_stock,
          shortage_quantity,
          quantity_in_draft,
          draft_order_id,
          validated,
          validated_at,
          products (
            name,
            sku,
            stock_real,
            stock_forecasted_in,
            product_images!left (
              public_url
            )
          ),
          purchase_orders!stock_alert_tracking_draft_order_id_fkey (
            po_number
          )
        `
          )
          .eq('products.product_images.is_primary', true)
          // ✅ NE PAS filtrer alertes validées - elles doivent rester visibles en VERT
          // Workflow: 🔴 Non validée → 🟢 Validée (commande en cours) → ✅ Disparaît (réceptionnée)
          .order('alert_priority', { ascending: false })
          .order('stock_real', { ascending: true });

        // Filtrer par type si spécifié
        if (type) {
          query = query.eq('alert_type', type);
        }

        const { data, error } = await query;

        console.log('🔍 SUPABASE QUERY RESULT:', {
          data,
          error,
          count: data?.length,
        });

        if (error) throw error;

        // Transformer en StockAlert[]
        const alertsList: StockAlert[] = (data || []).map((alert: any) => {
          // 🔍 DEBUG: Log alert brut
          console.log('🔍 ALERT RAW:', JSON.stringify(alert, null, 2));

          // Récupérer commandes liées pour type no_stock_but_ordered
          const relatedOrders: { order_number: string; quantity: number }[] =
            [];

          return {
            id: alert.id,
            product_id: alert.product_id,
            product_name: alert.products?.name || 'Produit inconnu',
            sku: alert.products?.sku || 'N/A',
            product_image_url:
              alert.products?.product_images?.[0]?.public_url || null,
            alert_type: alert.alert_type as StockAlertType,
            severity:
              alert.alert_priority === 3
                ? 'critical'
                : alert.alert_priority === 2
                  ? 'warning'
                  : 'info',
            // ✅ FIX: Lire stock_real depuis products (source de vérité, pas alert_tracking qui peut être désync)
            stock_real: alert.products?.stock_real ?? alert.stock_real,
            stock_forecasted_in: alert.products?.stock_forecasted_in || 0,
            stock_forecasted_out: alert.stock_forecasted_out,
            min_stock: alert.min_stock,
            shortage_quantity: alert.shortage_quantity,
            quantity_in_draft: alert.quantity_in_draft,
            draft_order_id: alert.draft_order_id,
            draft_order_number: alert.purchase_orders?.po_number || null,
            is_in_draft: alert.draft_order_id !== null,
            validated: alert.validated,
            validated_at: alert.validated_at,
            related_orders:
              relatedOrders.length > 0 ? relatedOrders : undefined,
          };
        });

        setAlerts(alertsList);
      } catch (error: any) {
        console.error('Erreur chargement alertes:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les alertes stock',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [supabase, toast]
  );

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // ✅ Alertes actives = stock réel < seuil minimum (filtre cohérent avec page alertes)
  const activeAlerts = alerts.filter(a => a.stock_real < a.min_stock);

  return {
    loading,
    alerts,
    fetchAlerts,
    // ✅ Alertes actives (stock_real < min_stock)
    activeAlerts,
    // Helpers existants
    criticalAlerts: alerts.filter(a => a.severity === 'critical'),
    warningAlerts: alerts.filter(a => a.severity === 'warning'),
    getAlertsByType: (type: StockAlertType) =>
      alerts.filter(a => a.alert_type === type),
    // Nouveaux helpers pour tracking brouillon
    alertsInDraft: alerts.filter(a => a.is_in_draft),
    alertsNotInDraft: alerts.filter(a => !a.is_in_draft),
    alertsValidated: alerts.filter(a => a.validated),
    // Helper pour vérifier si produit dans brouillon
    isProductInDraft: (productId: string) =>
      alerts.some(a => a.product_id === productId && a.is_in_draft),
    // Helper pour récupérer quantité commandée
    getQuantityInDraft: (productId: string) =>
      alerts.find(a => a.product_id === productId)?.quantity_in_draft || 0,
  };
}
