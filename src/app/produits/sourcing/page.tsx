'use client'

import Link from 'next/link'
import { ArrowLeft, Search, Package, Plus, Zap } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { useProducts } from '../../../hooks/use-products'
import { ProductCard } from '../../../components/business/product-card'
import { useState } from 'react'

export default function SourcingProductsPage() {
  const { products, loading } = useProducts()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Filtrer seulement les produits en sourcing
  const sourcingProducts = products.filter(p => p.creation_mode === 'sourcing' && !p.archived_at)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-black opacity-70">Chargement des produits en sourcing...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/produits"
            className="inline-flex items-center px-3 py-1.5 text-sm border border-black text-black bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dashboard
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">
              Produits en Sourcing
            </h1>
            <p className="text-gray-600 mt-2">
              Produits en cours de recherche et validation ({sourcingProducts.length} produits)
            </p>
          </div>
        </div>

        {/* Actions de création */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => window.location.href = '/catalogue/sourcing'}
            variant="outline"
            className="flex items-center space-x-2 border-black text-black hover:bg-black hover:text-white"
          >
            <Zap className="h-4 w-4" />
            <span>Sourcing Rapide</span>
          </Button>

          <Button
            onClick={() => window.location.href = '/catalogue/create'}
            className="flex items-center space-x-2 bg-black hover:bg-gray-800 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Produit</span>
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{sourcingProducts.length}</div>
          <div className="text-sm text-gray-600">Total en sourcing</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">
            {sourcingProducts.filter(p => p.requires_sample).length}
          </div>
          <div className="text-sm text-gray-600">Échantillons requis</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {sourcingProducts.filter(p => p.supplier_id).length}
          </div>
          <div className="text-sm text-gray-600">Fournisseur identifié</div>
        </div>
      </div>

      {/* Liste des produits en sourcing */}
      {sourcingProducts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200">
          <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun produit en sourcing
          </h3>
          <p className="text-gray-600 mb-4">
            Les produits en cours de recherche et validation apparaîtront ici
          </p>
          <Link
            href="/catalogue/sourcing"
            className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Zap className="h-4 w-4 mr-2" />
            Commencer un sourcing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sourcingProducts.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-black">
                      {product.name}
                    </h3>
                    <Badge className="bg-blue-600 text-white">
                      🔍 Sourcing
                    </Badge>
                    {product.requires_sample && (
                      <Badge className="bg-orange-600 text-white">
                        📦 Échantillon requis
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">SKU:</span> {product.sku || 'Non défini'}
                    </div>
                    <div>
                      <span className="font-medium">Prix estimé:</span>{' '}
                      {product.estimated_selling_price ? `${product.estimated_selling_price.toFixed(2)}€` : 'À définir'}
                    </div>
                    <div>
                      <span className="font-medium">Créé le:</span>{' '}
                      {new Date(product.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    <div>
                      <span className="font-medium">Fournisseur:</span>{' '}
                      {product.supplier?.name || 'En recherche'}
                    </div>
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Informations de sourcing */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {product.supplier_reference && (
                      <span>Réf. fournisseur: {product.supplier_reference}</span>
                    )}
                    {product.supplier_page_url && (
                      <a
                        href={product.supplier_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Voir chez le fournisseur ↗
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.location.href = `/catalogue/${product.id}`}
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Voir détails
                  </Button>

                  {product.requires_sample && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      📦 Commander échantillon
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note explicative */}
      <div className="bg-blue-50 border border-blue-200 p-4">
        <h4 className="font-medium text-blue-900 mb-2">À propos du sourcing produits</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>🔍 Sourcing :</strong> Produits en cours de recherche et validation fournisseur</p>
          <p><strong>📦 Échantillon requis :</strong> Produits nécessitant une validation qualité avant finalisation</p>
          <p><strong>Processus :</strong> Sourcing → Échantillon → Validation → Catalogue actif</p>
          <p><strong>Action :</strong> Complétez les informations manquantes pour finaliser le produit</p>
        </div>
      </div>
    </div>
  )
}