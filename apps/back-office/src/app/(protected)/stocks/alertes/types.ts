export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'stock' | 'movement' | 'forecast' | 'system';

export interface StockAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  productImageUrl?: string | null;
  currentStock?: number;
  minStock?: number;
  reorderPoint?: number;
  timestamp: string;
  acknowledged: boolean;
  // Tracking commandes brouillon
  is_in_draft: boolean;
  quantity_in_draft: number | null;
  draft_order_id: string | null;
  draft_order_number: string | null;
  // Champs du hook stock_alert_tracking
  stock_forecasted_in?: number;
  stock_forecasted_out?: number;
  shortage_quantity?: number;
  validated?: boolean;
  validated_at?: string | null;
  // Couleur calculée par la vue dynamique
  alert_color?: 'critical_red' | 'red' | 'orange' | 'green' | 'resolved';
  alert_type?: string;
  action?: {
    label: string;
    handler: () => void;
  };
}
