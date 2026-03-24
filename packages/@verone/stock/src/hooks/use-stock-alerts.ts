import { useState, useCallback, useEffect } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

// ====================================================================
// ⚠️ FICHIER CRITIQUE - NE PAS MODIFIER SANS VALIDATION COMPLÈTE
// ====================================================================
// Ce hook gère le workflow complet des alertes stock.
//
// TYPES D'ALERTES (calculés dynamiquement par la vue) :
// - 'out_of_stock' : stock_previsionnel < 0 (commandes clients > stock dispo)
// - 'low_stock' : stock_real < min_stock (stock bas mais positif)
// - 'no_stock_but_ordered' : pas de stock mais commandes fournisseurs en cours
//
// WORKFLOW MÉTIER :
// 🔴 ROUGE → Commande brouillon OU stock prévisionnel < min_stock
// 🟢 VERT  → Commande validée ET stock prévisionnel >= min_stock
// ✅ DISPARAÎT → Réception complète ET stock_real >= min_stock
//
// TESTS OBLIGATOIRES avant toute modification :
// 1. Valider PO → Alerte passe ROUGE → VERT
// 2. Dévalider PO → Alerte passe VERT → ROUGE
// 3. Expédition partielle SO → Alerte RECALCULE (ne disparaît pas)
// 4. Annulation reliquat → Alerte RECALCULE
// 5. Réception complète → Alerte DISPARAÎT
// ====================================================================

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
  product_image_url?: string | null;
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

  // Couleur calculée par la vue (pour compatibilité)
  alert_color?: string;

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
        // ====================================================================
        // ✅ UTILISE LA VUE DYNAMIQUE stock_alerts_unified_view
        // ====================================================================
        // Cette vue calcule en TEMPS RÉEL :
        // - alert_type basé sur stock_previsionnel (out_of_stock si < 0)
        // - alert_color selon la logique métier complète
        // - severity pour compatibilité
        // - Toutes les jointures (products, images, draft orders)
        // ====================================================================
        let query = supabase
          .from('stock_alerts_unified_view')
          .select(
            'id, product_id, product_name, sku, product_image_url, alert_type, severity, stock_real, stock_forecasted_in, stock_forecasted_out, min_stock, shortage_quantity, quantity_in_draft, draft_order_id, draft_order_number, is_in_draft, validated, validated_at, alert_color'
          )
          .neq('alert_type', 'none');

        // Filtrer par type si spécifié
        if (type) {
          query = query.eq('alert_type', type);
        }

        const { data, error } = await query;

        console.warn('🔍 STOCK ALERTS (vue dynamique):', {
          count: data?.length,
          error,
        });

        if (error) throw error;

        // Transformer en StockAlert[] - La vue retourne déjà les données formatées
        type AlertRow = Record<string, unknown>;
        const alertsList: StockAlert[] = ((data ?? []) as AlertRow[]).map(
          alert => ({
            id: alert.id as string,
            product_id: alert.product_id as string,
            product_name: (alert.product_name as string) ?? 'Produit inconnu',
            sku: (alert.sku as string) ?? 'N/A',
            product_image_url:
              (alert.product_image_url as string | null) ?? null,
            // ✅ alert_type calculé dynamiquement par la vue
            // out_of_stock si stock_previsionnel < 0, low_stock si stock_real < min_stock
            alert_type: ((alert.alert_type as string) ??
              'low_stock') as StockAlertType,
            severity: ((alert.severity as string) ??
              'warning') as StockAlert['severity'],
            stock_real: (alert.stock_real as number) ?? 0,
            stock_forecasted_in: (alert.stock_forecasted_in as number) ?? 0,
            stock_forecasted_out: (alert.stock_forecasted_out as number) ?? 0,
            min_stock: (alert.min_stock as number) ?? 0,
            shortage_quantity: (alert.shortage_quantity as number) ?? 0,
            quantity_in_draft:
              (alert.quantity_in_draft as number | null) ?? null,
            draft_order_id: (alert.draft_order_id as string | null) ?? null,
            draft_order_number:
              (alert.draft_order_number as string | null) ?? null,
            is_in_draft: (alert.is_in_draft as boolean) ?? false,
            validated: (alert.validated as boolean) ?? false,
            validated_at: (alert.validated_at as string | null) ?? null,
            alert_color: (alert.alert_color as string | undefined) ?? undefined,
          })
        );

        setAlerts(alertsList);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
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
    void fetchAlerts();
  }, [fetchAlerts]);

  // ✅ Alertes actives = low_stock OU out_of_stock
  // - low_stock : stock_real < min_stock (nécessite min_stock > 0)
  // - out_of_stock : stock_previsionnel < 0 (INDÉPENDANT de min_stock)
  const activeAlerts = alerts.filter(a => {
    const stockPrevisionnel =
      a.stock_real + a.stock_forecasted_in - a.stock_forecasted_out;
    return a.stock_real < a.min_stock || stockPrevisionnel < 0;
  });

  return {
    loading,
    alerts,
    fetchAlerts,
    // ✅ Alertes actives (restauré)
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
      alerts.find(a => a.product_id === productId)?.quantity_in_draft ?? 0,
  };
}
