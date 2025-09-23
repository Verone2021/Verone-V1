'use client'

import Link from 'next/link'
import { ArrowLeft, Package, RotateCcw, Trash2 } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { useProducts } from '../../../hooks/use-products'
import { ProductCard } from '../../../components/business/product-card'
import { useState } from 'react'

export default function ArchivedProductsPage() {
  const { products, loading, unarchiveProduct, deleteProduct } = useProducts()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Filtrer seulement les produits archivés
  const archivedProducts = products.filter(p => p.archived_at)

  const statusConfig = {
    archived: { label: "📦 Archivé", className: "bg-gray-600 text-white" },
    discontinued: { label: "⛔ Arrêté", className: "bg-red-600 text-white" },
    end_of_life: { label: "🔚 Fin de série", className: "bg-orange-600 text-white" }
  }

  const handleRestoreProduct = async (productId: string) => {
    try {
      await unarchiveProduct(productId)
      console.log('✅ Produit restauré avec succès')
    } catch (error) {
      console.error('❌ Erreur lors de la restauration:', error)
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${productName}" ?\n\nCette action est irréversible !`
    )

    if (confirmed) {
      try {
        await deleteProduct(productId)
        console.log('✅ Produit supprimé définitivement')
      } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-black opacity-70">Chargement des produits archivés...</div>
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
              Produits Archivés
            </h1>
            <p className="text-gray-600 mt-2">
              Produits archivés, arrêtés et en fin de série ({archivedProducts.length} produits)
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-black">{archivedProducts.length}</div>
          <div className="text-sm text-gray-600">Total archivé</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-600">
            {archivedProducts.filter(p => p.status === 'archived').length}
          </div>
          <div className="text-sm text-gray-600">Archivés</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">
            {archivedProducts.filter(p => p.status === 'discontinued').length}
          </div>
          <div className="text-sm text-gray-600">Arrêtés</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">
            {archivedProducts.filter(p => p.availability_type === 'discontinued').length}
          </div>
          <div className="text-sm text-gray-600">Fin de série</div>
        </div>
      </div>

      {/* Liste des produits archivés */}
      {archivedProducts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun produit archivé
          </h3>
          <p className="text-gray-600 mb-4">
            Les produits archivés, arrêtés ou en fin de série apparaîtront ici
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Package className="h-4 w-4 mr-2" />
            Voir le catalogue actif
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {archivedProducts.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-black">
                      {product.name}
                    </h3>
                    <Badge className="bg-gray-600 text-white">
                      📦 Archivé
                    </Badge>
                    {product.status === 'discontinued' && (
                      <Badge className="bg-red-600 text-white">
                        ⛔ Arrêté
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">SKU:</span> {product.sku}
                    </div>
                    <div>
                      <span className="font-medium">Prix HT:</span>{' '}
                      {product.price_ht ? `${product.price_ht.toFixed(2)}€` : 'Non défini'}
                    </div>
                    <div>
                      <span className="font-medium">Archivé le:</span>{' '}
                      {product.archived_at ? new Date(product.archived_at).toLocaleDateString('fr-FR') : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Fournisseur:</span>{' '}
                      {product.supplier?.name || 'Non spécifié'}
                    </div>
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleRestoreProduct(product.id)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restaurer
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note explicative */}
      <div className="bg-blue-50 border border-blue-200 p-4">
        <h4 className="font-medium text-blue-900 mb-2">À propos des produits archivés</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>📦 Archivé :</strong> Produits temporairement retirés du catalogue actif</p>
          <p><strong>⛔ Arrêté :</strong> Produits définitivement arrêtés par le fabricant</p>
          <p><strong>🔚 Fin de série :</strong> Produits en fin de vie commerciale</p>
          <p><strong>Action :</strong> Vous pouvez restaurer ou supprimer définitivement les produits</p>
        </div>
      </div>
    </div>
  )
}