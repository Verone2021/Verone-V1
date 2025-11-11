import Image from 'next/image';
import Link from 'next/link';

import { useProductImages } from '@verone/products/hooks';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { AlertTriangle, XCircle, Package, ExternalLink } from 'lucide-react';

// Type définition pour StockAlert
export interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  stock_real: number;
  stock_forecasted_in: number;
  stock_forecasted_out: number;
  min_stock: number;
  shortage_quantity: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'no_stock_but_ordered';
  severity: 'info' | 'warning' | 'critical';

  // Tracking commandes brouillon
  is_in_draft: boolean;
  quantity_in_draft: number | null;
  draft_order_id: string | null;
  draft_order_number: string | null;
  validated: boolean; // ✅ Commande validée (passe de ROUGE → VERT)
  validated_at: string | null;

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
    // ✅ CALCUL STOCK PRÉVISIONNEL
    // Formule : stock_real + stock_forecasted_in - stock_forecasted_out
    const stock_previsionnel =
      alert.stock_real +
      (alert.stock_forecasted_in || 0) -
      (alert.stock_forecasted_out || 0);

    // ✅ WORKFLOW COMPLET : ROUGE (brouillon ou insuffisant) → VERT (validé et suffisant) → DISPARAÎT (réceptionné)

    // 🟢 VERT si commande validée ET stock prévisionnel >= min_stock
    if (alert.validated && stock_previsionnel >= alert.min_stock) {
      return 'border-green-600 !bg-green-50';
    }

    // 🔴 ROUGE si commande brouillon OU stock prévisionnel < min_stock
    if (alert.is_in_draft || stock_previsionnel < alert.min_stock) {
      return 'border-red-600 !bg-red-50';
    }

    // Couleurs selon sévérité (cas par défaut - normalement pas atteint)
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
                <Button
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
                </Button>
                {alert.draft_order_id ? (
                  <Link
                    href={`/commandes/fournisseurs?id=${alert.draft_order_id}`}
                  >
                    <Button size="sm" variant="outline" className="text-xs">
                      Voir Commande
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/catalogue/${alert.product_id}`}>
                    <Button size="sm" variant="ghost" className="text-xs">
                      Voir Produit
                    </Button>
                  </Link>
                )}
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

            {/* Indicateurs Stock Avancés - Grid 4 colonnes */}
            <div className="grid grid-cols-4 gap-3 mt-2">
              {/* Stock Actuel */}
              <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase font-medium">
                  Stock Actuel
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {alert.stock_real}
                </div>
              </div>

              {/* Stock Prévisionnel */}
              <div
                className={`text-center p-2 rounded-lg border ${
                  alert.stock_real +
                    (alert.stock_forecasted_in || 0) -
                    (alert.stock_forecasted_out || 0) >=
                  alert.min_stock
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="text-[10px] text-gray-500 uppercase font-medium">
                  Stock Prévisionnel
                </div>
                <div
                  className={`text-lg font-bold ${
                    alert.stock_real +
                      (alert.stock_forecasted_in || 0) -
                      (alert.stock_forecasted_out || 0) >=
                    alert.min_stock
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}
                >
                  {alert.stock_real +
                    (alert.stock_forecasted_in || 0) -
                    (alert.stock_forecasted_out || 0)}
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5">
                  (+{alert.stock_forecasted_in || 0} -{' '}
                  {alert.stock_forecasted_out || 0})
                </div>
              </div>

              {/* Seuil Minimum */}
              <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase font-medium">
                  Seuil Minimum
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {alert.min_stock}
                </div>
              </div>

              {/* Produits Manquants */}
              <div
                className={`text-center p-2 rounded-lg border ${
                  alert.shortage_quantity > 0
                    ? 'bg-red-50 border-red-300'
                    : 'bg-green-50 border-green-300'
                }`}
              >
                <div className="text-[10px] text-gray-500 uppercase font-medium">
                  Manquants
                </div>
                <div
                  className={`text-lg font-bold ${
                    alert.shortage_quantity > 0
                      ? 'text-red-700'
                      : 'text-green-700'
                  }`}
                >
                  {alert.shortage_quantity > 0 ? alert.shortage_quantity : '✓'}
                </div>
              </div>
            </div>

            {/* Badge Statut Commande */}
            {alert.is_in_draft && alert.quantity_in_draft && (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className="border-green-500 bg-green-50 text-green-700 text-xs font-medium"
                >
                  ✅ Commandé: {alert.quantity_in_draft} unités -{' '}
                  {alert.draft_order_number}
                </Badge>
              </div>
            )}

            {alert.validated && (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className="border-green-600 bg-green-100 text-green-800 text-xs font-medium"
                >
                  ✅ Validé - Stock prévisionnel suffisant
                </Badge>
              </div>
            )}

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
