"use client"

import { memo, useCallback, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { ButtonV2 } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Package, Archive, Trash2, ArchiveRestore, Eye } from "lucide-react"
import { useProductImages } from "@/hooks/use-product-images"
import type { Product } from "@/hooks/use-catalogue"

interface ProductCardProps {
  product: Product
  className?: string
  showActions?: boolean
  priority?: boolean
  onClick?: (product: Product) => void
  onArchive?: (product: Product) => void
  onDelete?: (product: Product) => void
  archived?: boolean
}

// Configuration statuts avec couleurs Design System V2
const statusConfig = {
  in_stock: {
    label: "En stock",
    className: "bg-green-600 text-white",
  },
  out_of_stock: {
    label: "Rupture",
    className: "bg-red-600 text-white",
  },
  preorder: {
    label: "Précommande",
    className: "bg-blue-600 text-white",
  },
  coming_soon: {
    label: "Bientôt",
    className: "bg-blue-600 text-white", // ✅ Bleu au lieu de noir
  },
  discontinued: {
    label: "Arrêté",
    className: "bg-gray-600 text-white",
  }
}

export const ProductCardV2 = memo(function ProductCardV2({
  product,
  className,
  showActions = true,
  priority = false,
  onClick,
  onArchive,
  onDelete,
  archived = false
}: ProductCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  const status = statusConfig[product.status] || {
    label: product.status || "Statut inconnu",
    className: "bg-gray-600 text-white"
  }

  const { primaryImage, loading: imageLoading } = useProductImages({
    productId: product.id,
    autoFetch: true
  })

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(product)
    } else {
      router.push(`/catalogue/${product.id}`)
    }
  }, [product, onClick, router])

  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/catalogue/${product.id}`)
  }, [product.id, router])

  const handleArchiveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onArchive) {
      onArchive(product)
    }
  }, [product, onArchive])

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(product)
    }
  }, [product, onDelete])

  return (
    <div
      className={cn(
        // Base card avec rounded corners 2025 - FOND BLANC PUR
        "relative overflow-hidden rounded-xl border border-gray-300 bg-white",
        "cursor-pointer transition-all duration-200 ease-out",
        // Shadow elevation progressive ⭐ KEY FEATURE
        !isHovered && "shadow-sm",
        isHovered && "shadow-xl -translate-y-1",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image produit - FOND BLANC */}
      <div className="relative h-32 overflow-hidden bg-white">
        {primaryImage?.public_url && !imageLoading ? (
          <Image
            src={primaryImage.public_url}
            alt={primaryImage.alt_text || product.name}
            fill
            priority={priority}
            className={cn(
              "object-contain transition-transform duration-300",
              isHovered && "scale-110"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {imageLoading ? (
              <div className="animate-pulse">
                <Package className="h-12 w-12 text-gray-300" />
              </div>
            ) : (
              <Package className="h-12 w-12 text-gray-400" />
            )}
          </div>
        )}

        {/* Badges - Espacement amélioré */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <Badge className={cn("text-[10px] font-medium px-1.5 py-0.5", status.className)}>
            {status.label}
          </Badge>

          {product.condition !== 'new' && (
            <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-black text-[10px] px-1.5 py-0.5">
              {product.condition === 'refurbished' ? 'Reconditionné' : 'Occasion'}
            </Badge>
          )}
        </div>

        {/* Badge "nouveau" */}
        {(() => {
          const createdAt = new Date(product.created_at)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return createdAt > thirtyDaysAgo
        })() && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-green-500 text-white text-[10px] font-medium px-1.5 py-0.5">
              🆕 Nouveau
            </Badge>
          </div>
        )}
      </div>

      {/* Informations produit - HIÉRARCHIE CLAIRE */}
      <div className="p-3 space-y-2">
        {/* Header - NOM + SKU */}
        <div className="space-y-0.5">
          <h3 className="font-semibold text-sm text-black line-clamp-2 min-h-[2.5rem] leading-tight">
            {product.name}
          </h3>
          <p className="text-[10px] text-gray-600 font-mono">
            SKU: {product.sku}
          </p>
        </div>

        {/* Stock + Prix Achat - COMPACT */}
        <div className="space-y-1">
          {product.stock_quantity !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600">Stock:</span>
              <span className={cn(
                "text-xs font-semibold",
                product.stock_quantity > 10 ? "text-green-600" : "text-orange-600"
              )}>
                {product.stock_quantity}
              </span>
            </div>
          )}

          {product.cost_price && (
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-600">Prix d'achat indicatif</span>
              <div className="text-lg font-bold text-gray-900">
                {product.cost_price.toFixed(2)} €
                <span className="text-xs font-normal text-gray-500 ml-1">HT</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions - UNE SEULE LIGNE - BOUTONS OUTLINE BLANC/NOIR */}
        {showActions && (
          <div className="flex gap-1.5 pt-1">
            {/* Bouton principal : Voir détail (OUTLINE blanc/noir) */}
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={handleDetailsClick}
              className="flex-1 text-xs h-7"
              icon={Eye}
            >
              Voir détail
            </ButtonV2>

            {/* Bouton secondaire : Archive/Restaurer (OUTLINE) */}
            {onArchive && (
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={handleArchiveClick}
                className="w-7 h-7 p-0 flex items-center justify-center"
                aria-label={archived ? "Restaurer le produit" : "Archiver le produit"}
              >
                {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </ButtonV2>
            )}

            {/* Bouton tertiaire : Supprimer (OUTLINE rouge si archived) */}
            {archived && onDelete && (
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                className="w-7 h-7 p-0 flex items-center justify-center border-red-600 text-red-600 hover:bg-red-50"
                aria-label="Supprimer le produit"
              >
                <Trash2 className="h-4 w-4" />
              </ButtonV2>
            )}
          </div>
        )}
      </div>

      {/* Hover overlay subtil */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none",
          "transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  )
})
