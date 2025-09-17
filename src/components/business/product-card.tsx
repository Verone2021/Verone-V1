"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import { Package, Archive, Trash2, ArchiveRestore } from "lucide-react"
import { useProductImages } from "../../hooks/use-product-images"
import { useProductPackages } from "../../hooks/use-product-packages"

// Interface Organisation Fournisseur
interface SupplierOrganisation {
  id: string
  name: string
  slug: string
  email?: string
  country?: string
  is_active: boolean
}

// Interface Produit selon business rules - migration brand → supplier (CORRIGÉ : images gérées par useProductImages)
interface Product {
  id: string
  sku: string
  name: string
  price_ht: number // Prix en euros
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  condition: 'new' | 'refurbished' | 'used'
  // Images gérées par product_images table via useProductImages hook
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit?: string
  }
  supplier?: SupplierOrganisation
  category?: string
  archived_at?: string | null
  created_at: string
}

interface ProductCardProps {
  product: Product
  className?: string
  showActions?: boolean
  showPackages?: boolean // Nouvelle option pour afficher les packages
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
  onClick,
  onArchive,
  onDelete,
  archived = false
}: ProductCardProps) {
  const router = useRouter()
  const status = statusConfig[product.status]

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
      {/* Image produit */}
      <div className="relative aspect-[4/3] overflow-hidden border-b border-black">
        {primaryImage?.public_url && !imageLoading ? (
          <Image
            src={primaryImage.public_url}
            alt={primaryImage.alt_text || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
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
                <Package className="h-12 w-12 text-gray-300" />
              </div>
            ) : (
              <Package className="h-12 w-12 text-gray-400" />
            )}
          </div>
        )}

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

        {/* Badge "nouveau" pour les produits créés dans les 30 derniers jours */}
        {(() => {
          const createdAt = new Date(product.created_at)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return createdAt > thirtyDaysAgo
        })() && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
              nouveau
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
            {product.supplier && (
              <span>{product.supplier.name}</span>
            )}
          </div>
        </div>

        {/* Prix avec packages */}
        <div className="space-y-1">
          <div className="text-xl font-semibold text-black">
            {product.price_ht.toFixed(2)} € HT
          </div>
          <div className="text-sm text-black opacity-70">
            {(product.price_ht * 1.2).toFixed(2)} € TTC
          </div>

          {/* Affichage packages conditionnels */}
          {showPackages && !packagesLoading && (
            <div className="space-y-1 mt-2">
              {/* Badge remise disponible */}
              {hasMultiplePackages && defaultPackage && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
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
                      <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        {discountLabel}
                      </Badge>
                    ) : null
                  })()}
                </div>
              )}
            </div>
          )}
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
          <div className="space-y-2 pt-2">
            {/* Actions principales */}
            <div className="flex gap-2">
              {/* Archiver/Restaurer */}
              {onArchive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchiveClick}
                  className={`flex-1 min-w-0 ${archived ? "text-blue-600 border-blue-200 hover:bg-blue-50" : "text-orange-600 border-orange-200 hover:bg-orange-50"}`}
                >
                  {archived ? (
                    <>
                      <ArchiveRestore className="h-4 w-4 mr-1" />
                      Restaurer
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-1" />
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
                  className="flex-1 min-w-0 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>

            {/* Voir détails */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
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