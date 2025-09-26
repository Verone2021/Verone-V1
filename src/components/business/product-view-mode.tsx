"use client"

import { Badge, TreePine, FolderOpen, Tags, ExternalLink, Package, Heart, Star, Eye, Calendar, Truck, ShieldCheck, ImageIcon, CheckCircle, AlertCircle, Clock, Settings } from 'lucide-react'
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
        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-md">
          <CheckCircle className="h-4 w-4" />
          <span className="font-semibold text-sm">En stock ({stockQty} disponibles)</span>
        </div>
      )
    }

    if (stockQty > 0 && stockQty <= 10) {
      return (
        <div className="flex items-center gap-2 text-orange-700 bg-orange-50 px-3 py-1.5 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span className="font-semibold text-sm">Stock limité ({stockQty} disponibles)</span>
        </div>
      )
    }

    if (product.status === 'preorder') {
      return (
        <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md">
          <Clock className="h-4 w-4" />
          <span className="font-semibold text-sm">Précommande</span>
        </div>
      )
    }

    if (product.status === 'coming_soon') {
      return (
        <div className="flex items-center gap-2 text-purple-700 bg-purple-50 px-3 py-1.5 rounded-md">
          <Clock className="h-4 w-4" />
          <span className="font-semibold text-sm">Bientôt disponible</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1.5 rounded-md">
        <AlertCircle className="h-4 w-4" />
        <span className="font-semibold text-sm">Rupture de stock</span>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>

      {/* Layout Back-Office détaillé: Image gauche + Infos droite */}
      <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6 mb-6 max-w-7xl mx-auto">

        {/* COLONNE GAUCHE: Galerie Images + Stock + Caractéristiques */}
        <div className="space-y-4">
          {/* Galerie principale avec miniatures */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <ProductImageGallery
              productId={product.id}
              productName={product.name}
              productStatus={product.status}
              compact={false}
            />
          </div>

          {/* Stock badge + condition sous les images */}
          <div className="space-y-3">
            <div className="flex justify-center">
              {getStockBadge()}
            </div>

            {product.condition && (
              <div className="flex justify-center">
                <Badge variant="outline" className="text-xs">
                  État: {product.condition === 'new' ? 'Neuf' : product.condition === 'used' ? 'Occasion' : 'Reconditionné'}
                </Badge>
              </div>
            )}
          </div>

          {/* Caractéristiques fixées sous le stock */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-3 flex items-center text-gray-700">
              <Tags className="h-4 w-4 mr-2" />
              Caractéristiques produit
            </h3>
            <ProductFixedCharacteristics product={product} />
          </div>
        </div>

        {/* COLONNE DROITE: Infos essentielles back-office */}
        <div className="space-y-4">

          {/* Header produit + statuts */}
          <div className="bg-gradient-to-r from-gray-50 to-white border-l-4 border-black p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {product.status === 'active' ? '✓ Actif' : product.status === 'draft' ? 'Brouillon' : 'Archivé'}
                </Badge>
                {product.requires_sample === false && (
                  <Badge className="bg-green-100 text-green-800 text-xs border-green-300">
                    Prêt commande
                  </Badge>
                )}
                {product.requires_sample === true && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs border-yellow-300">
                    Échantillon requis
                  </Badge>
                )}
              </div>
              <Button
                onClick={onSwitchToEdit}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Éditer
              </Button>
            </div>

            <h1 className="text-2xl font-bold text-black mb-3">
              {product.name}
            </h1>

            <div className="space-y-2">
              <div className="text-sm text-gray-700 leading-relaxed">
                {product.description || <span className="text-gray-400 italic">Description à compléter</span>}
              </div>

              {product.selling_points && product.selling_points.length > 0 && (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Points clés:</p>
                  <ul className="space-y-1">
                    {product.selling_points.slice(0, 3).map((point: string, idx: number) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start">
                        <Star className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0 text-yellow-600" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Tarification détaillée */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-3 text-gray-700">Tarification</h3>

            {product.selling_price ? (
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-black">
                    {product.selling_price.toFixed(2)}€
                  </span>
                  <span className="text-sm text-gray-500">HT</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-green-700">
                    {(product.selling_price * 1.20).toFixed(2)}€
                  </span>
                  <span className="text-gray-500"> TTC (TVA 20%)</span>
                </div>

                {product.base_cost && (
                  <div className="border-t border-gray-200 pt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Coût fournisseur:</span>
                      <span className="font-medium">{product.base_cost.toFixed(2)}€ HT</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Marge brute:</span>
                      <span className="font-medium text-green-700">
                        {((product.selling_price - product.base_cost) / product.base_cost * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Prix non défini</p>
            )}
          </div>

          {/* Infos techniques en grille compacte */}
          <div className="grid grid-cols-2 gap-3">

            {/* Classification hiérarchique */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center">
                <TreePine className="h-3 w-3 mr-1" />
                Classification
              </h4>
              {product.subcategory?.category?.family ? (
                <div className="space-y-1">
                  <div className="text-xs text-gray-700 truncate" title={product.subcategory.category.family.name}>
                    → {product.subcategory.category.family.name}
                  </div>
                  <div className="text-xs text-gray-600 truncate pl-2" title={product.subcategory.category.name}>
                    → {product.subcategory.category.name}
                  </div>
                  <div className="text-xs font-medium truncate pl-4" title={product.subcategory.name}>
                    → {product.subcategory.name}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Non classifié</p>
              )}
            </div>

            {/* Fournisseur + lien */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center">
                <Truck className="h-3 w-3 mr-1" />
                Fournisseur
              </h4>
              {product.supplier ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium truncate" title={product.supplier.name}>
                    {product.supplier.name}
                  </p>
                  {product.supplier_reference && (
                    <p className="text-xs text-gray-600 font-mono truncate" title={product.supplier_reference}>
                      Réf: {product.supplier_reference}
                    </p>
                  )}
                  {product.supplier_page_url && (
                    <a
                      href={product.supplier_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Page fournisseur
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Non défini</p>
              )}
            </div>

            {/* Dimensions + poids */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center">
                <Package className="h-3 w-3 mr-1" />
                Dimensions
              </h4>
              {product.dimensions_length || product.dimensions_width || product.dimensions_height ? (
                <div className="space-y-1">
                  <div className="text-xs font-medium">
                    L {product.dimensions_length || 0} ×
                    l {product.dimensions_width || 0} ×
                    H {product.dimensions_height || 0} {product.dimensions_unit || 'cm'}
                  </div>
                  {product.weight && (
                    <div className="text-xs text-gray-600">
                      Poids: {product.weight} {product.weight_unit || 'kg'}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Non spécifiées</p>
              )}
            </div>

            {/* Identifiants + marque */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center">
                <Tags className="h-3 w-3 mr-1" />
                Identifiants
              </h4>
              <div className="space-y-1">
                <div className="text-xs font-mono text-gray-700">
                  <span className="text-gray-500">SKU:</span> {product.sku || 'N/A'}
                </div>
                {product.gtin && (
                  <div className="text-xs font-mono text-gray-600">
                    <span className="text-gray-500">GTIN:</span> {product.gtin}
                  </div>
                )}
                {product.brand && (
                  <div className="text-xs text-gray-700">
                    <span className="text-gray-500">Marque:</span> {product.brand}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sections techniques étendues sous le layout principal */}
      <div className="max-w-7xl mx-auto mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Spécifications techniques complètes */}
        {product.technical_description && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-3 flex items-center text-gray-700">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Spécifications techniques
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
              {product.technical_description}
            </p>
          </div>
        )}


        {/* Métadonnées système étendues */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-sm mb-3 flex items-center text-gray-700">
            <Calendar className="h-4 w-4 mr-2" />
            Informations système
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Créé le:</span>
              <span className="font-medium">
                {product.created_at ? new Date(product.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dernière màj:</span>
              <span className="font-medium">
                {product.updated_at ? new Date(product.updated_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ID produit:</span>
              <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded" title={product.id}>
                {product.id.slice(0, 8)}...
              </span>
            </div>
            {product.slug && (
              <div className="flex justify-between">
                <span className="text-gray-600">Slug:</span>
                <span className="font-mono text-xs">{product.slug}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}