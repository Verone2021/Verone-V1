"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import { Package, Archive, Trash2, ArchiveRestore } from "lucide-react"
import { useProductImages } from "../../hooks/use-product-images"
import { useProductPackages } from "../../hooks/use-product-packages"
import type { Product } from "../../hooks/use-catalogue"

interface ProductCardProps {
  product: Product
  className?: string
  showActions?: boolean
  showPackages?: boolean // Nouvelle option pour afficher les packages
  priority?: boolean // Nouvelle option pour optimiser LCP (première image)
  onClick?: (product: Product) => void
  onArchive?: (product: Product) => void
  onDelete?: (product: Product) => void
  archived?: boolean
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
    className: "bg-black text-white"
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
  showPackages = false,
  priority = false,
  onClick,
  onArchive,
  onDelete,
  archived = false
}: ProductCardProps) {
  const router = useRouter()
  const status = statusConfig[product.status] || {
    label: product.status || "Statut inconnu",
    variant: "outline" as const,
    className: "bg-gray-600 text-white"
  }

  // ✨ Hooks optimisés - images + packages
  const { primaryImage, loading: imageLoading } = useProductImages({
    productId: product.id,
    autoFetch: true
  })

  const {
    defaultPackage,
    hasMultiplePackages,
    getDiscountLabel,
    calculatePackagePrice,
    loading: packagesLoading
  } = useProductPackages({
    productId: product.id,
    autoFetch: showPackages
  })

  const handleClick = () => {
    if (onClick) {
      onClick(product)
    } else {
      // Navigation par défaut vers la page détail
      router.push(`/catalogue/${product.id}`)
    }
  }

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/catalogue/${product.id}`)
  }

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onArchive) {
      onArchive(product)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(product)
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
      {/* Image produit - ULTRA COMPACT */}
      <div className="relative h-32 overflow-hidden border-b border-black">
        {primaryImage?.public_url && !imageLoading ? (
          <Image
            src={primaryImage.public_url}
            alt={primaryImage.alt_text || product.name}
            fill
            priority={priority} // 🚀 Optimisation LCP pour première image
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={() => {
              // En cas d'erreur de chargement, afficher le placeholder
              console.warn(`Erreur chargement image: ${primaryImage.public_url}`)
            }}
          />
        ) : (
          /* Placeholder quand pas d'image ou en cours de chargement */
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            {imageLoading ? (
              <div className="animate-pulse">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
            ) : (
              <Package className="h-8 w-8 text-gray-400" />
            )}
          </div>
        )}

        {/* Badge statut - MINI */}
        <div className="absolute top-1 right-1">
          <Badge className={cn("text-[10px] px-1.5 py-0.5", status.className)}>
            {status.label}
          </Badge>
        </div>

        {/* Badge condition si pas neuf - MINI */}
        {product.condition !== 'new' && (
          <div className="absolute top-1 left-1">
            <Badge variant="outline" className="bg-white text-black text-[10px] px-1.5 py-0.5">
              {product.condition === 'refurbished' ? 'Reconditionné' : 'Occasion'}
            </Badge>
          </div>
        )}

        {/* Badge "nouveau" pour les produits créés dans les 30 derniers jours - MINI */}
        {(() => {
          const createdAt = new Date(product.created_at)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return createdAt > thirtyDaysAgo
        })() && (
          <div className="absolute bottom-1 left-1">
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-[10px] px-1.5 py-0.5">
              nouveau
            </Badge>
          </div>
        )}
      </div>

      {/* Informations produit - ULTRA COMPACT */}
      <div className="p-2 space-y-1.5">
        {/* En-tête - COMPACT avec truncate pour éviter deux lignes */}
        <div className="space-y-0.5">
          <h3 className="font-medium text-xs text-black truncate group-hover:underline">
            {product.name}
          </h3>
          <div className="text-[10px] text-black opacity-70">
            <span>SKU: {product.sku}</span>
          </div>
        </div>

        {/* Prix d'achat uniquement - COMPACT */}
        <div className="space-y-0.5">
          {product.cost_price && (
            <div className="text-sm font-semibold text-black">
              {product.cost_price.toFixed(2)} € HT
            </div>
          )}

          {/* Affichage packages conditionnels - MINI */}
          {showPackages && !packagesLoading && (
            <div className="space-y-0.5 mt-1">
              {/* Badge remise disponible */}
              {hasMultiplePackages && defaultPackage && (
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200 px-1 py-0">
                    {hasMultiplePackages ? "Conditionnements multiples" : "Package unique"}
                  </Badge>
                  {(() => {
                    const bestPackage = hasMultiplePackages
                      ? /* Trouve le package avec la meilleure remise */
                        (() => {
                          // Logique simplifiée pour trouver la meilleure remise
                          return defaultPackage
                        })()
                      : null
                    const discountLabel = bestPackage ? getDiscountLabel(bestPackage) : null
                    return discountLabel ? (
                      <Badge variant="secondary" className="text-[9px] bg-gray-50 text-gray-800 border-gray-200 px-1 py-0">
                        {discountLabel}
                      </Badge>
                    ) : null
                  })()}
                </div>
              )}
            </div>
          )}
        </div>


        {/* Actions - ULTRA COMPACT */}
        {showActions && (
          <div className="space-y-1 pt-1">
            {/* Actions principales */}
            <div className="flex gap-1">
              {/* Archiver/Restaurer */}
              {onArchive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchiveClick}
                  className={`flex-1 min-w-0 h-6 text-[10px] px-1.5 ${archived ? "text-blue-600 border-blue-200 hover:bg-blue-50" : "text-black border-gray-200 hover:bg-gray-50"}`}
                >
                  {archived ? (
                    <>
                      <ArchiveRestore className="h-2.5 w-2.5 mr-0.5" />
                      Restaurer
                    </>
                  ) : (
                    <>
                      <Archive className="h-2.5 w-2.5 mr-0.5" />
                      Archiver
                    </>
                  )}
                </Button>
              )}

              {/* Supprimer */}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="flex-1 min-w-0 h-6 text-[10px] px-1.5 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-2.5 w-2.5 mr-0.5" />
                  Supprimer
                </Button>
              )}
            </div>

            {/* Voir détails */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-6 text-[10px]"
              onClick={handleDetailsClick}
            >
              Voir détails
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}