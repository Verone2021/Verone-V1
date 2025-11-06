"use client"

import { useState, useEffect } from 'react'
import { Eye, Package, ArrowRight, AlertCircle } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { sortVariantSiblings } from '../../lib/business-rules/naming-rules'
import Image from 'next/image'

interface VariantSibling {
  id: string
  name: string
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  display_order?: number
  primary_image_url?: string
  variant_attributes?: Record<string, any>
  price_ht: number
  stock_quantity?: number
}

interface VariantSiblingsProps {
  currentProductId: string
  productGroupId: string
  className?: string
  onVariantSelect?: (variantId: string) => void
}

export function VariantSiblings({
  currentProductId,
  productGroupId,
  className,
  onVariantSelect
}: VariantSiblingsProps) {
  const supabase = createClient()
  const [siblings, setSiblings] = useState<VariantSibling[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVariantSiblings()
  }, [productGroupId, currentProductId])

  const fetchVariantSiblings = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          status,
          display_order,
          primary_image_url,
          variant_attributes,
          price_ht,
          stock_quantity
        `)
        .eq('product_group_id', productGroupId)
        .neq('id', currentProductId) // Exclure la variante courante selon R019

      if (error) throw error

      // Appliquer les règles de tri R020
      const sortedSiblings = sortVariantSiblings(data as any || [], currentProductId)
      setSiblings(sortedSiblings as any)

    } catch (err) {
      console.error('❌ Erreur chargement variantes sœurs:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'in_stock':
        return { label: '✓ En stock', color: 'bg-green-600 text-white', available: true }
      case 'out_of_stock':
        return { label: '✕ Rupture', color: 'bg-red-600 text-white', available: false }
      case 'preorder':
        return { label: '📅 Précommande', color: 'bg-blue-600 text-white', available: true }
      case 'coming_soon':
        return { label: '⏳ Bientôt', color: 'bg-black text-white', available: false }
      case 'discontinued':
        return { label: '⚠ Arrêté', color: 'bg-gray-600 text-white', available: false }
      default:
        return { label: 'Inconnu', color: 'bg-gray-400 text-white', available: false }
    }
  }

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(priceInCents / 100)
  }

  const renderAttributeDifferences = (attributes?: Record<string, any>) => {
    if (!attributes || Object.keys(attributes).length === 0) {
      return <span className="text-xs text-gray-400">Aucun attribut</span>
    }

    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(attributes).slice(0, 3).map(([key, value]) => (
          <span
            key={key}
            className="inline-block px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
          >
            {value}
          </span>
        ))}
        {Object.keys(attributes).length > 3 && (
          <span className="text-xs text-gray-400">+{Object.keys(attributes).length - 3}</span>
        )}
      </div>
    )
  }

  const handleVariantClick = (variantId: string) => {
    if (onVariantSelect) {
      onVariantSelect(variantId)
    } else {
      // Navigation par défaut
      window.location.href = `/catalogue/${variantId}`
    }
  }

  if (loading) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center mb-3">
          <Package className="h-4 w-4 mr-2" />
          <h3 className="text-sm font-medium text-black">Variantes similaires</h3>
        </div>
        <div className="text-center py-4 text-gray-500 text-sm">
          Chargement des variantes...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center mb-3">
          <Package className="h-4 w-4 mr-2" />
          <h3 className="text-sm font-medium text-black">Variantes similaires</h3>
        </div>
        <div className="flex items-center text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          Erreur: {error}
        </div>
      </div>
    )
  }

  if (siblings.length === 0) {
    return (
      <div className={cn("card-verone p-4", className)}>
        <div className="flex items-center mb-3">
          <Package className="h-4 w-4 mr-2" />
          <h3 className="text-sm font-medium text-black">Variantes similaires</h3>
        </div>
        <div className="text-center py-4 text-gray-400 text-sm">
          Aucune autre variante disponible
        </div>
      </div>
    )
  }

  return (
    <div className={cn("card-verone p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Package className="h-4 w-4 mr-2" />
          <h3 className="text-sm font-medium text-black">Variantes similaires</h3>
          <Badge variant="outline" className="ml-2 text-xs">
            {siblings.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {siblings.map((sibling) => {
          const statusInfo = getStatusInfo(sibling.status)
          const isUnavailable = !statusInfo.available

          return (
            <div
              key={sibling.id}
              className={cn(
                "flex items-center p-3 border rounded-md transition-all cursor-pointer hover:border-gray-400",
                isUnavailable && "opacity-60 bg-gray-50",
                "border-gray-200 hover:shadow-sm"
              )}
              onClick={() => handleVariantClick(sibling.id)}
            >
              {/* Image */}
              <div className="flex-shrink-0 w-12 h-12 mr-3">
                {sibling.primary_image_url ? (
                  <Image
                    src={sibling.primary_image_url}
                    alt={sibling.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover rounded border"
                    onError={() => {
                      console.warn(`Erreur chargement image sibling: ${sibling.primary_image_url}`)
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded border flex items-center justify-center">
                    <Package className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Informations */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Nom */}
                    <div className="font-medium text-sm text-black truncate">
                      {sibling.name}
                    </div>

                    {/* Attributs différentiants */}
                    <div className="mt-1">
                      {renderAttributeDifferences(sibling.variant_attributes)}
                    </div>

                    {/* Prix et stock */}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-black font-medium">
                        {formatPrice(sibling.price_ht)}
                      </span>
                      {sibling.stock_quantity !== undefined && (
                        <span className={cn(
                          "font-medium",
                          sibling.stock_quantity > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          Stock: {sibling.stock_quantity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Statut et action */}
                  <div className="flex flex-col items-end gap-2 ml-3">
                    <Badge
                      className={cn(statusInfo.color, "text-xs")}
                    >
                      {statusInfo.label}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action globale */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <ButtonV2
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            // TODO: Naviguer vers la page du groupe complet
            console.log('Navigate to product group:', productGroupId)
          }}
        >
          <Eye className="h-3 w-3 mr-1" />
          Voir toutes les variantes du groupe
        </ButtonV2>
      </div>
    </div>
  )
}