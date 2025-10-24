import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, XCircle, Package, ExternalLink } from 'lucide-react'
import Link from 'next/link'

// Type définition pour StockAlert
export interface StockAlert {
  id: string
  product_id: string
  product_name: string
  sku: string
  stock_real: number
  stock_forecasted_out: number
  min_stock: number
  alert_type: 'low_stock' | 'out_of_stock' | 'no_stock_but_ordered'
  severity: 'info' | 'warning' | 'critical'
  related_orders?: Array<{
    order_number: string
    quantity: number
  }>
}

interface StockAlertCardProps {
  alert: StockAlert
  onActionClick?: (alert: StockAlert) => void
}

export function StockAlertCard({ alert, onActionClick }: StockAlertCardProps) {
  const getSeverityIcon = () => {
    switch (alert.severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      default:
        return <Package className="h-5 w-5 text-blue-600" />
    }
  }

  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'critical':
        return 'border-red-600 bg-red-50'
      case 'warning':
        return 'border-orange-600 bg-orange-50'
      default:
        return 'border-blue-600 bg-blue-50'
    }
  }

  const getAlertTypeLabel = () => {
    switch (alert.alert_type) {
      case 'low_stock':
        return 'Stock Faible'
      case 'out_of_stock':
        return 'Rupture de Stock'
      case 'no_stock_but_ordered':
        return 'Commandé Sans Stock'
      default:
        return 'Alerte'
    }
  }

  return (
    <Card className={`border-2 ${getSeverityColor()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getSeverityIcon()}
          <span>{getAlertTypeLabel()}</span>
          <Badge variant="outline" className="ml-auto">
            {alert.sku}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Link
            href={`/catalogue/${alert.product_id}`}
            className="font-medium text-black hover:text-blue-600 hover:underline flex items-center gap-1"
          >
            {alert.product_name}
            <ExternalLink className="h-3 w-3" />
          </Link>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
            <span>Stock Réel: <strong>{alert.stock_real}</strong></span>
            {alert.stock_forecasted_out > 0 && (
              <span>· Réservé: <strong className="text-red-600">{alert.stock_forecasted_out}</strong></span>
            )}
            <span>· Seuil: <strong>{alert.min_stock}</strong></span>
          </div>
        </div>

        {alert.alert_type === 'no_stock_but_ordered' && alert.related_orders && (
          <div className="bg-white p-2 rounded border border-red-200">
            <p className="text-xs font-medium text-red-600 mb-1">
              ⚠️ {alert.related_orders.length} commande(s) client(s) en attente
            </p>
            {alert.related_orders.slice(0, 2).map((order, idx) => (
              <div key={idx} className="text-xs text-gray-600">
                • {order.order_number}: {order.quantity} unité(s)
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onActionClick?.(alert)}
            className="text-xs"
          >
            {alert.alert_type === 'no_stock_but_ordered' ? 'Voir Commandes' : 'Commander Fournisseur'}
          </ButtonV2>
          <Link href={`/catalogue/${alert.product_id}`}>
            <ButtonV2 size="sm" variant="ghost" className="text-xs">
              Voir Produit
            </ButtonV2>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
