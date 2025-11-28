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
    // Stock prévisionnel basé sur PO VALIDÉES uniquement (pas les brouillons)
    // stock_forecasted_in = quantité des PO validées (en transit)
    const stock_previsionnel_valide =
      alert.stock_real +
      (alert.stock_forecasted_in || 0) -
      (alert.stock_forecasted_out || 0);

    // PRIORITÉ 1 : Si PO brouillon existe → ORANGE (en attente de validation)
    // Un brouillon indique qu'une action est en cours mais pas encore confirmée
    if (alert.is_in_draft) {
      return 'border-orange-500 !bg-orange-50';
    }

    // PRIORITÉ 2 : Si PO validée couvre le besoin → VERT
    if (stock_previsionnel_valide >= alert.min_stock) {
      return 'border-green-600 !bg-green-50';
    }

    // PRIORITÉ 3 : Sinon → ROUGE (besoin non couvert, aucune commande)
    return 'border-red-600 !bg-red-50';
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

  // Calcul stock prévisionnel pour condition bouton
  // stock_forecasted_in = commandes validées uniquement (PO validated, en transit)
  // stock_forecasted_out = commandes clients validées (SO validated, réservations)
  const stock_previsionnel =
    alert.stock_real +
    (alert.stock_forecasted_in || 0) -
    (alert.stock_forecasted_out || 0);

  // ✅ FIX: quantity_in_draft est la quantité du draft actuel UNIQUEMENT (pas un cumul!)
  // C'est INDÉPENDANT de stock_forecasted_in (qui concerne les PO validées)
  const quantiteBrouillon = alert.is_in_draft
    ? alert.quantity_in_draft || 0
    : 0;

  // Stock prévisionnel TOTAL incluant les brouillons
  const stock_previsionnel_total = stock_previsionnel + quantiteBrouillon;

  // Seuil atteint = bouton grisé (incluant brouillons dans le calcul)
  const seuilAtteint = stock_previsionnel_total >= alert.min_stock;

  // Manque réel pour atteindre le seuil (en tenant compte des brouillons)
  const manque = Math.max(0, alert.min_stock - stock_previsionnel_total);

  // Logique bouton Commander :
  // - Désactivé si seuil atteint (stock_previsionnel >= min_stock)
  // - Activé si seuil non atteint (permet de commander le complément, même si commande existante)
  const peutCommander = !seuilAtteint && manque > 0;

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
                  variant={peutCommander ? 'primary' : 'outline'}
                  onClick={() => onActionClick?.(alert)}
                  disabled={!peutCommander}
                  className={`text-xs ${!peutCommander ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {seuilAtteint
                    ? 'Seuil atteint'
                    : alert.alert_type === 'no_stock_but_ordered'
                      ? 'Voir Commandes'
                      : manque > 0
                        ? `Commander ${manque} manquant${manque > 1 ? 's' : ''}`
                        : 'Commander Fournisseur'}
                </Button>
                {alert.draft_order_id ? (
                  <Link href={`/commandes/fournisseurs`}>
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

            {/* Indicateurs Stock Compacts - Format ligne */}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 flex-wrap">
              <span>
                Stock Réel:{' '}
                <strong className="text-gray-900">{alert.stock_real}</strong>
              </span>
              <span
                className={`${
                  alert.stock_real +
                    (alert.stock_forecasted_in || 0) -
                    (alert.stock_forecasted_out || 0) >=
                  alert.min_stock
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                · Prévisionnel:{' '}
                <strong>
                  {alert.stock_real +
                    (alert.stock_forecasted_in || 0) -
                    (alert.stock_forecasted_out || 0)}
                </strong>
              </span>
              <span>
                · Seuil:{' '}
                <strong className="text-gray-900">{alert.min_stock}</strong>
              </span>
              <span
                className={
                  alert.shortage_quantity > 0
                    ? 'text-red-600 font-medium'
                    : 'text-green-600'
                }
              >
                · Manquants:{' '}
                <strong>
                  {alert.shortage_quantity > 0 ? alert.shortage_quantity : '✓'}
                </strong>
              </span>
              {alert.stock_forecasted_out > 0 && (
                <span className="text-red-600">
                  · Réservé: <strong>{alert.stock_forecasted_out}</strong>
                </span>
              )}
              {alert.stock_forecasted_in > 0 && (
                <span className="text-green-600 font-medium">
                  · Commandé: <strong>{alert.stock_forecasted_in}</strong>
                </span>
              )}
            </div>

            {/* Section Statut Commandes */}
            <div className="mt-2 space-y-1">
              {/* Badge VERT : Commandes validées en transit (stock_forecasted_in > 0) */}
              {alert.stock_forecasted_in > 0 && (
                <Badge
                  variant="outline"
                  className="border-green-600 bg-green-100 text-green-800 text-xs font-medium mr-2"
                >
                  ✅ {alert.stock_forecasted_in} unité
                  {alert.stock_forecasted_in > 1 ? 's' : ''} validée
                  {alert.stock_forecasted_in > 1 ? 's' : ''} (en cours de
                  livraison)
                </Badge>
              )}

              {/* Badge ORANGE : Commande brouillon en attente */}
              {/* ✅ FIX: quantity_in_draft est la quantité du draft actuel (pas un cumul) */}
              {alert.is_in_draft &&
                quantiteBrouillon > 0 &&
                alert.draft_order_id && (
                  <Badge
                    variant="outline"
                    className="border-orange-500 bg-orange-50 text-orange-700 text-xs font-medium cursor-pointer hover:bg-orange-100 transition-colors"
                    onClick={() => onActionClick?.(alert)}
                  >
                    ⏳ {quantiteBrouillon} unité
                    {quantiteBrouillon > 1 ? 's' : ''} en attente de validation
                    - N° {alert.draft_order_number}
                  </Badge>
                )}

              {/* Badge VERT COMPLET : Seuil atteint */}
              {seuilAtteint && !alert.is_in_draft && (
                <Badge
                  variant="outline"
                  className="border-green-600 bg-green-100 text-green-800 text-xs font-medium"
                >
                  ✅ Seuil atteint - Stock prévisionnel suffisant
                </Badge>
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
