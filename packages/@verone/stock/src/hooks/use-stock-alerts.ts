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
  | 'low_stock_forecast'
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
          .select('*')
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const alertsList: StockAlert[] = (data ?? []).map((alert: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          id: alert.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          product_id: alert.product_id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          product_name: alert.product_name ?? 'Produit inconnu',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          sku: alert.sku ?? 'N/A',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          product_image_url: alert.product_image_url ?? null,
          // ✅ alert_type calculé dynamiquement par la vue
          // out_of_stock si stock_previsionnel < 0, low_stock si stock_real < min_stock
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          alert_type: (alert.alert_type as StockAlertType) ?? 'low_stock',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          severity: alert.severity ?? 'warning',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          stock_real: alert.stock_real ?? 0,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          stock_forecasted_in: alert.stock_forecasted_in ?? 0,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          stock_forecasted_out: alert.stock_forecasted_out ?? 0,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          min_stock: alert.min_stock ?? 0,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          shortage_quantity: alert.shortage_quantity ?? 0,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          quantity_in_draft: alert.quantity_in_draft ?? null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          draft_order_id: alert.draft_order_id ?? null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          draft_order_number: alert.draft_order_number ?? null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          is_in_draft: alert.is_in_draft ?? false,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          validated: alert.validated ?? false,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          validated_at: alert.validated_at ?? null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          alert_color: alert.alert_color ?? null,
        }));

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

  // ✅ Alertes actives = low_stock OU low_stock_forecast OU out_of_stock
  // - low_stock : stock_real < min_stock (nécessite min_stock > 0)
  // - low_stock_forecast : stock_real OK mais previsionnel < min_stock (BO-STOCK-007 A8)
  // - out_of_stock : stock_previsionnel < 0 (INDÉPENDANT de min_stock)
  const activeAlerts = alerts.filter(a => {
    const stockPrevisionnel =
      a.stock_real + a.stock_forecasted_in - a.stock_forecasted_out;
    return (
      a.stock_real < a.min_stock ||
      stockPrevisionnel < 0 ||
      a.alert_type === 'low_stock_forecast'
    );
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
