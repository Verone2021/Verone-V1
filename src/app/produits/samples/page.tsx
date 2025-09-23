'use client'

import Link from 'next/link'
import { ArrowLeft, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { useProducts } from '../../../hooks/use-products'
import { useState } from 'react'

export default function SampleProductsPage() {
  const { products, loading } = useProducts()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Filtrer seulement les produits nécessitant des échantillons
  const sampleProducts = products.filter(p => p.requires_sample === true && !p.archived_at)

  const getStatusInfo = (product: any) => {
    if (product.creation_mode === 'sourcing') {
      return {
        label: '🔍 Sourcing + Échantillon',
        className: 'bg-blue-600 text-white',
        description: 'En cours de sourcing, échantillon requis'
      }
    }
    return {
      label: '📦 Échantillon requis',
      className: 'bg-orange-600 text-white',
      description: 'Produit finalisé, échantillon à commander'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-black opacity-70">Chargement des produits avec échantillons...</div>
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
              Échantillons à Commander
            </h1>
            <p className="text-gray-600 mt-2">
              Produits nécessitant une validation par échantillon ({sampleProducts.length} produits)
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">{sampleProducts.length}</div>
          <div className="text-sm text-gray-600">Total échantillons</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {sampleProducts.filter(p => p.creation_mode === 'sourcing').length}
          </div>
          <div className="text-sm text-gray-600">En sourcing</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {sampleProducts.filter(p => p.supplier_id).length}
          </div>
          <div className="text-sm text-gray-600">Fournisseur validé</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-600">
            {sampleProducts.filter(p => !p.supplier_id).length}
          </div>
          <div className="text-sm text-gray-600">Fournisseur manquant</div>
        </div>
      </div>

      {/* Liste des produits nécessitant des échantillons */}
      {sampleProducts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun échantillon à commander
          </h3>
          <p className="text-gray-600 mb-4">
            Les produits nécessitant une validation par échantillon apparaîtront ici
          </p>
          <Link
            href="/catalogue/create"
            className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Package className="h-4 w-4 mr-2" />
            Créer un produit
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sampleProducts.map((product) => {
            const statusInfo = getStatusInfo(product)
            const hasSupplier = !!product.supplier_id
            const isReady = hasSupplier && product.supplier_reference

            return (
              <div key={product.id} className="bg-white border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-black">
                        {product.name}
                      </h3>
                      <Badge className={statusInfo.className}>
                        {statusInfo.label}
                      </Badge>
                      {isReady ? (
                        <Badge className="bg-green-600 text-white">
                          ✅ Prêt à commander
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-600 text-white">
                          ⚠️ Info manquantes
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">SKU:</span> {product.sku || 'Non défini'}
                      </div>
                      <div>
                        <span className="font-medium">Prix estimé:</span>{' '}
                        {product.price_ht ? `${product.price_ht.toFixed(2)}€` : 'À définir'}
                      </div>
                      <div>
                        <span className="font-medium">Créé le:</span>{' '}
                        {new Date(product.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      <div>
                        <span className="font-medium">Fournisseur:</span>{' '}
                        {product.supplier?.name || 'Non défini'}
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* État du produit pour échantillon */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className={`flex items-center gap-1 ${hasSupplier ? 'text-green-600' : 'text-red-600'}`}>
                        {hasSupplier ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        Fournisseur {hasSupplier ? 'identifié' : 'manquant'}
                      </div>
                      <div className={`flex items-center gap-1 ${product.supplier_reference ? 'text-green-600' : 'text-yellow-600'}`}>
                        {product.supplier_reference ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        Référence {product.supplier_reference ? 'disponible' : 'manquante'}
                      </div>
                      <div className={`flex items-center gap-1 ${product.price_ht ? 'text-green-600' : 'text-yellow-600'}`}>
                        {product.price_ht ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        Prix {product.price_ht ? 'défini' : 'à confirmer'}
                      </div>
                    </div>

                    {/* Informations de sourcing */}
                    {(product.supplier_reference || product.supplier_page_url) && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
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
                    )}
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

                    {isReady ? (
                      <Button
                        size="sm"
                        className="text-xs bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        📦 Commander échantillon
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                        onClick={() => window.location.href = `/catalogue/${product.id}`}
                      >
                        ⚠️ Compléter infos
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Note explicative */}
      <div className="bg-orange-50 border border-orange-200 p-4">
        <h4 className="font-medium text-orange-900 mb-2">À propos des échantillons produits</h4>
        <div className="text-sm text-orange-700 space-y-1">
          <p><strong>📦 Échantillon requis :</strong> Produits nécessitant une validation qualité avant mise en catalogue</p>
          <p><strong>✅ Prêt à commander :</strong> Toutes les informations sont disponibles pour commander l'échantillon</p>
          <p><strong>⚠️ Info manquantes :</strong> Fournisseur, référence ou prix manquants</p>
          <p><strong>Processus :</strong> Info complètes → Commande échantillon → Validation → Catalogue actif</p>
        </div>
      </div>
    </div>
  )
}