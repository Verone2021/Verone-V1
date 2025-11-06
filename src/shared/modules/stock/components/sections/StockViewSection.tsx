"use client"

import { ExternalLink, Truck } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '../../lib/utils'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  sku?: string
  name?: string
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  condition: 'new' | 'refurbished' | 'used'
  stock_quantity?: number
  min_stock?: number
}

interface StockViewSectionProps {
  product: Product
  className?: string
}

const STATUS_OPTIONS = [
  { value: 'in_stock', label: '✓ En stock', color: 'bg-green-600 text-white' },
  { value: 'out_of_stock', label: '✕ Rupture', color: 'bg-red-600 text-white' },
  { value: 'preorder', label: '📅 Précommande', color: 'bg-blue-600 text-white' },
  { value: 'coming_soon', label: '⏳ Bientôt', color: 'bg-black text-white' },
  { value: 'discontinued', label: '⚠ Arrêté', color: 'bg-gray-600 text-white' }
] as const

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'refurbished', label: 'Reconditionné' },
  { value: 'used', label: 'Occasion' }
] as const

export function StockViewSection({ product, className }: StockViewSectionProps) {
  const router = useRouter()

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity <= 0) return { color: 'text-red-600', level: 'Rupture' }
    if (quantity <= minLevel) return { color: 'text-black', level: 'Critique' }
    if (quantity <= minLevel * 2) return { color: 'text-gray-700', level: 'Faible' }
    return { color: 'text-green-600', level: 'Bon' }
  }

  const stockStatus = getStockStatus(product.stock_quantity || 0, product.min_stock || 5)
  const currentStatus = STATUS_OPTIONS.find(opt => opt.value === product.status)
  const currentCondition = CONDITION_OPTIONS.find(opt => opt.value === product.condition)

  const handleNavigateToStock = () => {
    // Navigation vers la page de gestion stock avec filtrage automatique
    // Utilise SKU en priorité, puis nom, puis ID comme fallback
    const searchParam = product.sku || product.name || product.id
    router.push(`/catalogue/stocks?search=${encodeURIComponent(searchParam)}`)
  }

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <Truck className="h-5 w-5 mr-2" />
          Stock & Disponibilité
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-gray-600">
            Lecture seule
          </Badge>
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={handleNavigateToStock}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Gérer stock
          </ButtonV2>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-black opacity-70">Statut:</span>
          {currentStatus && (
            <Badge className={cn(currentStatus.color)}>
              {currentStatus.label}
            </Badge>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-black opacity-70">Quantité:</span>
          <span className={cn("font-semibold", stockStatus.color)}>
            {product.stock_quantity || 0} unités
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-black opacity-70">Seuil minimum:</span>
          <span className="text-black">{product.min_stock || 5} unités</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-black opacity-70">Condition:</span>
          <Badge variant="outline">
            {currentCondition?.label}
          </Badge>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-black opacity-70">Niveau stock:</span>
          <span className={cn("font-medium", stockStatus.color)}>
            {stockStatus.level}
          </span>
        </div>
      </div>

      {/* Indicateur de gestion dédiée */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="flex items-center">
            <Truck className="h-3 w-3 mr-1" />
            Gestion stock via système dédié
          </span>
          <span>Business rules appliquées</span>
        </div>
      </div>
    </div>
  )
}