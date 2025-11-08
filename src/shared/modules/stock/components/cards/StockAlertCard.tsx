import Image from 'next/image';
import Link from 'next/link';

import { AlertTriangle, XCircle, Package, ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProductImages } from '@/shared/modules/products/hooks';

// Type définition pour StockAlert
export interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  stock_real: number;
  stock_forecasted_out: number;
  min_stock: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'no_stock_but_ordered';
  severity: 'info' | 'warning' | 'critical';

  // Tracking commandes brouillon
  is_in_draft: boolean;
  quantity_in_draft: number | null;
  draft_order_number: string | null;

  related_orders?: Array<{
    order_number: string;
    quantity: number;
  }>;
}

interface StockAlertCardProps {
  alert: StockAlert;
  onActionClick?: (alert: StockAlert) => void;
}

export function StockAlertCard({ alert, onActionClick }: StockAlertCardProps) {
  // Hook pour récupérer l'image principale du produit
  const { primaryImage, loading: imageLoading } = useProductImages({
    productId: alert.product_id,
    autoFetch: true,
  });

  const getSeverityIcon = () => {
    switch (alert.severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <Package className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityColor = () => {
    // ✅ FIX: Brouillon reste ROUGE (alerte active, pas validée)
    // Workflow: Brouillon ROUGE → Validation VERTE → Réception DISPARAÎT
    // Note: Le badge VERT "Commandé" + bouton disabled indiquent l'action en cours
    // Note: !bg-red-50 force override du bg-white du composant Card
    if (alert.is_in_draft) {
      return 'border-red-600 !bg-red-50'; // ✅ Rouge car alerte reste active
    }

    // Couleurs selon sévérité (pour alertes sans commande)
    switch (alert.severity) {
      case 'critical':
        return 'border-red-600 !bg-red-50';
      case 'warning':
        return 'border-orange-600 !bg-orange-50';
      default:
        return 'border-blue-600 !bg-blue-50';
    }
  };

  const getAlertTypeLabel = () => {
    switch (alert.alert_type) {
      case 'low_stock':
        return 'Stock Faible';
      case 'out_of_stock':
        return 'Rupture de Stock';
      case 'no_stock_but_ordered':
        return 'Commandé Sans Stock';
      default:
        return 'Alerte';
    }
  };

  return (
    <Card className={`border-2 ${getSeverityColor()}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex gap-3">
          {/* Image Produit */}
          {imageLoading ? (
            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="h-8 w-8 text-gray-400 animate-pulse" />
            </div>
          ) : primaryImage?.public_url ? (
            <div className="h-16 w-16 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image
                src={primaryImage.public_url}
                alt={alert.product_name}
                width={64}
                height={64}
                className="object-contain w-full h-full"
              />
            </div>
          ) : (
            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}

          {/* Contenu Compact */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Header: SKU (LEFT) + Icône + Type + Buttons (RIGHT) */}
            <div className="flex items-center justify-between gap-3">
              {/* LEFT: SKU + Icône + Type */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {alert.sku}
                </Badge>
                {getSeverityIcon()}
                <span className="font-medium text-sm">
                  {getAlertTypeLabel()}
                </span>
              </div>

              {/* RIGHT: Action Buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <ButtonV2
                  size="sm"
                  variant={alert.is_in_draft ? 'outline' : 'primary'}
                  onClick={() => onActionClick?.(alert)}
                  disabled={alert.is_in_draft}
                  className={`text-xs ${alert.is_in_draft ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {alert.is_in_draft
                    ? 'Déjà commandé'
                    : alert.alert_type === 'no_stock_but_ordered'
                      ? 'Voir Commandes'
                      : 'Commander Fournisseur'}
                </ButtonV2>
                <Link href={`/catalogue/${alert.product_id}`}>
                  <ButtonV2 size="sm" variant="ghost" className="text-xs">
                    Voir Produit
                  </ButtonV2>
                </Link>
              </div>
            </div>

            {/* Nom produit */}
            <div>
              <Link
                href={`/catalogue/${alert.product_id}`}
                className="font-medium text-black hover:text-blue-600 hover:underline flex items-center gap-1"
              >
                {alert.product_name}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Stock info INLINE avec badge draft intégré */}
            <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
              <span>
                Stock: <strong>{alert.stock_real}</strong>
              </span>
              {alert.stock_forecasted_out > 0 && (
                <span>
                  - Réservé:{' '}
                  <strong className="text-red-600">
                    {alert.stock_forecasted_out}
                  </strong>
                </span>
              )}
              <span>
                - Seuil: <strong>{alert.min_stock}</strong>
              </span>
              {alert.is_in_draft && alert.quantity_in_draft && (
                <>
                  <span className="text-green-600 font-medium">
                    - Commandé: <strong>{alert.quantity_in_draft}</strong>
                  </span>
                  <Badge
                    variant="outline"
                    className="border-green-300 text-green-600 text-xs h-5 px-1.5"
                  >
                    {alert.draft_order_number}
                  </Badge>
                </>
              )}
            </div>

            {/* Commandes clients en attente (INLINE, TOUTES affichées) */}
            {alert.alert_type === 'no_stock_but_ordered' &&
              alert.related_orders && (
                <div className="text-xs text-red-600 flex items-center gap-1 flex-wrap">
                  <span className="font-medium">
                    ⚠️ {alert.related_orders.length} commande(s) en attente:
                  </span>
                  <span>
                    {alert.related_orders
                      .map(o => `${o.order_number} (${o.quantity})`)
                      .join(', ')}
                  </span>
                </div>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
