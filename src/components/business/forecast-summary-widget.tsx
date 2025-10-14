"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink, Package, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'

// =============================================
// WIDGET PRÉVISIONNEL STOCK - DESIGN COMPACT
// Affiche TOP 5 commandes entrantes/sortantes
// =============================================

export interface ForecastedOrder {
  id: string
  order_number: string
  order_type: 'purchase' | 'sales' // PO ou SO
  client_name?: string // Pour SO
  supplier_name?: string // Pour PO
  total_quantity: number
  expected_date: string
  status: string
}

interface ForecastSummaryWidgetProps {
  incomingOrders: ForecastedOrder[] // Commandes fournisseurs (entrées)
  outgoingOrders: ForecastedOrder[] // Commandes clients (sorties)
  totalIn: number // Total entrées prévisionnelles
  totalOut: number // Total sorties prévisionnelles (valeur absolue)
  onOrderClick?: (orderId: string, orderType: 'purchase' | 'sales') => void
}

export function ForecastSummaryWidget({
  incomingOrders,
  outgoingOrders,
  totalIn,
  totalOut,
  onOrderClick
}: ForecastSummaryWidgetProps) {
  const [activeTab, setActiveTab] = useState<'in' | 'out'>('in')

  const displayedOrders = activeTab === 'in' ? incomingOrders : outgoingOrders

  return (
    <Card className="border-black">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-black text-lg">Stock Prévisionnel</CardTitle>
            <CardDescription className="text-xs">
              Commandes en cours impactant les stocks futurs
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-green-300 text-green-600 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{totalIn} entrées
            </Badge>
            <Badge variant="outline" className="border-red-300 text-red-600 text-xs">
              <TrendingDown className="h-3 w-3 mr-1" />
              -{totalOut} sorties
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Tabs Entrées/Sorties */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('in')}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'in'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              <span>Entrées Prévues</span>
              <Badge variant="outline" className="ml-1 border-green-300 text-green-600 text-xs">
                {incomingOrders.length}
              </Badge>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('out')}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'out'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              <span>Sorties Prévues</span>
              <Badge variant="outline" className="ml-1 border-red-300 text-red-600 text-xs">
                {outgoingOrders.length}
              </Badge>
            </div>
          </button>
        </div>

        {/* Liste des commandes */}
        <div className="space-y-2">
          {displayedOrders.length === 0 ? (
            <div className="text-center py-6">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {activeTab === 'in'
                  ? 'Aucune commande fournisseur en attente'
                  : 'Aucune commande client confirmée'}
              </p>
            </div>
          ) : (
            displayedOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onOrderClick?.(order.id, order.order_type)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-black text-sm">
                      {order.order_number}
                    </span>
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-600">
                    {order.order_type === 'purchase' ? order.supplier_name : order.client_name}
                  </p>
                </div>

                <div className="text-right">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      activeTab === 'in'
                        ? 'border-green-300 text-green-600'
                        : 'border-red-300 text-red-600'
                    }`}
                  >
                    {activeTab === 'in' ? '+' : '-'}{order.total_quantity} unités
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.expected_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer avec liens */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs border-black text-black hover:bg-black hover:text-white"
            asChild
          >
            <Link href="/commandes/fournisseurs">
              Voir toutes les commandes fournisseurs
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs border-black text-black hover:bg-black hover:text-white"
            asChild
          >
            <Link href="/commandes/clients">
              Voir toutes les commandes clients
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
