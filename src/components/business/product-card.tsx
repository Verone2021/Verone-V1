"use client"

import Image from "next/image"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import { formatPrice } from "../../lib/utils"

// Interface Produit selon business rules
interface Product {
  id: string
  sku: string
  name: string
  price_ht: number // Prix en centimes
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  condition: 'new' | 'refurbished' | 'used'
  primary_image_url: string
  gallery_images?: string[]
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit?: string
  }
  brand?: string
  category?: string
}

interface ProductCardProps {
  product: Product
  className?: string
  showActions?: boolean
  onClick?: (product: Product) => void
}

// Configuration statuts selon system colors
const statusConfig = {
  in_stock: {
    label: "En stock",
    variant: "default" as const,
    className: "bg-green-600 text-white"
  },
  out_of_stock: {
    label: "Rupture",
    variant: "destructive" as const,
    className: "bg-red-600 text-white"
  },
  preorder: {
    label: "Précommande",
    variant: "secondary" as const,
    className: "bg-blue-600 text-white"
  },
  coming_soon: {
    label: "Bientôt",
    variant: "outline" as const,
    className: "bg-yellow-600 text-white"
  },
  discontinued: {
    label: "Arrêté",
    variant: "outline" as const,
    className: "bg-gray-600 text-white"
  }
}

export function ProductCard({
  product,
  className,
  showActions = true,
  onClick
}: ProductCardProps) {
  const status = statusConfig[product.status]

  const handleClick = () => {
    if (onClick) {
      onClick(product)
    }
  }

  return (
    <div
      className={cn(
        // Card base Vérone
        "card-verone group cursor-pointer transition-all duration-150 ease-out hover:shadow-lg",
        className
      )}
      onClick={handleClick}
    >
      {/* Image produit */}
      <div className="relative aspect-square overflow-hidden border-b border-black">
        <Image
          src={product.primary_image_url}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />

        {/* Badge statut */}
        <div className="absolute top-2 right-2">
          <Badge className={status.className}>
            {status.label}
          </Badge>
        </div>

        {/* Badge condition si pas neuf */}
        {product.condition !== 'new' && (
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="bg-white text-black">
              {product.condition === 'refurbished' ? 'Reconditionné' : 'Occasion'}
            </Badge>
          </div>
        )}
      </div>

      {/* Informations produit */}
      <div className="p-4 space-y-3">
        {/* En-tête */}
        <div className="space-y-1">
          <h3 className="font-medium text-base text-black line-clamp-2 group-hover:underline">
            {product.name}
          </h3>
          <div className="flex items-center justify-between text-sm text-black opacity-70">
            <span>SKU: {product.sku}</span>
            {product.brand && (
              <span>{product.brand}</span>
            )}
          </div>
        </div>

        {/* Prix */}
        <div className="space-y-1">
          <div className="text-xl font-semibold text-black">
            {formatPrice(product.price_ht)} HT
          </div>
          <div className="text-sm text-black opacity-70">
            {formatPrice(product.price_ht * 1.2)} TTC
          </div>
        </div>

        {/* Métadonnées */}
        {(product.weight || product.dimensions) && (
          <div className="text-xs text-black opacity-60 space-y-1">
            {product.weight && (
              <div>Poids: {product.weight} kg</div>
            )}
            {product.dimensions && (
              <div>
                Dimensions: {product.dimensions.length}×{product.dimensions.width}×{product.dimensions.height} {product.dimensions.unit || 'cm'}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2 pt-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                // Action ajouter au panier
              }}
            >
              Ajouter
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                // Action voir détails
              }}
            >
              Détails
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}