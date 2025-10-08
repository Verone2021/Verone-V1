"use client"

import { Badge, TreePine, FolderOpen, Tags, ExternalLink, Package, Heart, Star, Eye, Calendar, Truck, ShieldCheck, ImageIcon, CheckCircle, AlertCircle, Clock, Settings, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { ProductImageGallery } from './product-image-gallery'
import { ProductFixedCharacteristics } from './product-fixed-characteristics'

interface ProductViewProps {
  product: any
  onSwitchToEdit: () => void
  className?: string
}

export function ProductViewMode({ product, onSwitchToEdit, className }: ProductViewProps) {
  const getStockBadge = () => {
    const stockQty = product.stock_quantity || 0
    const condition = product.condition || 'new'

    if (stockQty > 10) {
      return (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          <span className="font-medium text-sm">En stock ({stockQty} disponibles)</span>
        </div>
      )
    }

    if (stockQty > 0 && stockQty <= 10) {
      return (
        <div className="flex items-center gap-2 text-orange-700 bg-orange-50 px-4 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium text-sm">Stock limité ({stockQty} disponibles)</span>
        </div>
      )
    }

    if (product.status === 'preorder') {
      return (
        <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg">
          <Clock className="h-4 w-4" />
          <span className="font-medium text-sm">Précommande disponible</span>
        </div>
      )
    }

    if (product.status === 'coming_soon') {
      return (
        <div className="flex items-center gap-2 text-purple-700 bg-purple-50 px-4 py-2 rounded-lg">
          <Clock className="h-4 w-4" />
          <span className="font-medium text-sm">Bientôt disponible</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-red-700 bg-red-50 px-4 py-2 rounded-lg">
        <AlertCircle className="h-4 w-4" />
        <span className="font-medium text-sm">Momentanément indisponible</span>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>

      {/* Layout e-commerce optimisé: 50% images / 50% infos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

        {/* COLONNE GAUCHE: Galerie Images */}
        <div className="space-y-4">
          {/* Galerie principale */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <ProductImageGallery
              productId={product.id}
              productName={product.name}
              productStatus={product.status}
              compact={false}
            />
          </div>
        </div>

        {/* COLONNE DROITE: Informations produit e-commerce */}
        <div className="space-y-6">

          {/* Header produit minimaliste */}
          <div className="space-y-4">
            {/* Navigation / Catégorie */}
            {product.subcategory && (
              <nav className="text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  {product.subcategory?.category?.family && (
                    <>
                      <span>{product.subcategory.category.family.name}</span>
                      <span>›</span>
                    </>
                  )}
                  {product.subcategory?.category && (
                    <>
                      <span>{product.subcategory.category.name}</span>
                      <span>›</span>
                    </>
                  )}
                  <span>{product.subcategory.name}</span>
                </div>
              </nav>
            )}

            {/* Nom du produit */}
            <div>
              <h1 className="text-3xl font-bold text-black leading-tight mb-2">
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-lg text-gray-600">par {product.brand}</p>
              )}
            </div>

            {/* Prix mis en avant */}
            {product.selling_price ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-black">
                    {product.selling_price.toFixed(2)}€
                  </span>
                  <span className="text-lg text-gray-500">HT</span>
                </div>
                <div className="text-xl text-gray-700">
                  <span className="font-semibold">
                    {(product.selling_price * 1.20).toFixed(2)}€
                  </span>
                  <span className="text-gray-500"> TTC</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500 text-lg">Prix sur demande</p>
              </div>
            )}

            {/* Statut stock */}
            <div className="flex justify-center">
              {getStockBadge()}
            </div>

            {/* Bouton administration (seulement en mode admin) */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                onClick={onSwitchToEdit}
                className="w-full bg-black hover:bg-gray-800 text-white"
                size="lg"
              >
                <Settings className="h-4 w-4 mr-2" />
                Mode Administration
              </Button>
            </div>
          </div>

          {/* Description produit */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-black">Description</h2>
            <div className="prose prose-gray max-w-none">
              {product.description ? (
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              ) : (
                <p className="text-gray-400 italic">Description à venir</p>
              )}
            </div>
          </div>

          {/* Spécifications techniques - DÉPLACÉES ICI après description */}
          {product.technical_description && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-black">Spécifications techniques</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.technical_description}
                </p>
              </div>
            </div>
          )}

          {/* Points clés */}
          {product.selling_points && product.selling_points.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-black">Points clés</h2>
              <ul className="space-y-3">
                {product.selling_points.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <Star className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-yellow-500" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Caractéristiques produit e-commerce */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-black">Caractéristiques</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <ProductFixedCharacteristics product={product} />
            </div>
          </div>

          {/* Informations complémentaires en accordéon style e-commerce */}
          <div className="space-y-2">

            {/* Livraison et retours */}
            <details className="bg-gray-50 rounded-lg">
              <summary className="p-4 cursor-pointer font-medium text-black hover:bg-gray-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Livraison et retours
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </summary>
              <div className="px-4 pb-4 text-gray-600 text-sm space-y-2">
                <p>• Livraison gratuite à partir de 500€</p>
                <p>• Délai de livraison : 2-5 jours ouvrés</p>
                <p>• Retours gratuits sous 30 jours</p>
                <p>• Service client dédié</p>
              </div>
            </details>

            {/* Informations fournisseur */}
            {product.supplier && (
              <details className="bg-gray-50 rounded-lg">
                <summary className="p-4 cursor-pointer font-medium text-black hover:bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Informations fournisseur
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </summary>
                <div className="px-4 pb-4 text-gray-600 text-sm space-y-2">
                  <p><strong>Fournisseur :</strong> {product.supplier.name}</p>
                  {product.supplier_reference && (
                    <p><strong>Référence :</strong> {product.supplier_reference}</p>
                  )}
                  {product.supplier_page_url && (
                    <a
                      href={product.supplier_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Voir chez le fournisseur
                    </a>
                  )}
                </div>
              </details>
            )}

            {/* Dimensions et poids */}
            {(product.dimensions_length || product.dimensions_width || product.dimensions_height || product.weight) && (
              <details className="bg-gray-50 rounded-lg">
                <summary className="p-4 cursor-pointer font-medium text-black hover:bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Dimensions et poids
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </summary>
                <div className="px-4 pb-4 text-gray-600 text-sm space-y-2">
                  {(product.dimensions_length || product.dimensions_width || product.dimensions_height) && (
                    <p>
                      <strong>Dimensions :</strong> {product.dimensions_length || 0} × {product.dimensions_width || 0} × {product.dimensions_height || 0} {product.dimensions_unit || 'cm'}
                    </p>
                  )}
                  {product.weight && (
                    <p><strong>Poids :</strong> {product.weight} {product.weight_unit || 'kg'}</p>
                  )}
                  <p><strong>Condition :</strong> {
                    product.condition === 'new' ? 'Neuf' :
                    product.condition === 'used' ? 'Occasion' : 'Reconditionné'
                  }</p>
                </div>
              </details>
            )}
          </div>

        </div>
      </div>

      {/* Section métadonnées minimales en bas (style e-commerce) */}
      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <Calendar className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-xs text-gray-600">Référence produit</p>
            <p className="text-sm font-medium text-gray-800">
              {product.sku || product.id.slice(0, 8)}
            </p>
          </div>
          <div>
            <Eye className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-xs text-gray-600">Ajouté le</p>
            <p className="text-sm font-medium text-gray-800">
              {product.created_at ? new Date(product.created_at).toLocaleDateString('fr-FR') : 'N/A'}
            </p>
          </div>
          <div>
            <ShieldCheck className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-xs text-gray-600">Garantie</p>
            <p className="text-sm font-medium text-gray-800">2 ans constructeur</p>
          </div>
        </div>
      </div>
    </div>
  )
}