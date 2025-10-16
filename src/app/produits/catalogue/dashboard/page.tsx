"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Package,
  Archive,
  Clock,
  TrendingUp,
  Plus,
  Eye,
  Filter,
  Download,
  Truck,
  Palette
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProducts } from '@/hooks/use-products'

// Champs obligatoires pour un produit complet (adaptés aux données disponibles)
const REQUIRED_PRODUCT_FIELDS = [
  'name',
  'sku',
  'supplier_id',
  'subcategory_id',
  'cost_price',
  'description'
] as const

// Fonction pour calculer la completion d'un produit
function calculateProductCompletion(product: any): { isComplete: boolean, percentage: number, missingFields: number } {
  const filledFields = REQUIRED_PRODUCT_FIELDS.filter(field => {
    const value = product[field]
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    return value !== null && value !== undefined && value !== 0
  })

  const percentage = (filledFields.length / REQUIRED_PRODUCT_FIELDS.length) * 100
  const missingFields = REQUIRED_PRODUCT_FIELDS.length - filledFields.length
  const isComplete = percentage === 100

  return { isComplete, percentage: Math.round(percentage), missingFields }
}

export default function CatalogueDashboardPage() {
  const router = useRouter()
  const { products, loading: productsLoading } = useProducts()

  // Fonction de traduction des statuts en français
  const translateStatus = (status: string): string => {
    const translations: Record<string, string> = {
      'in_stock': 'En stock',
      'out_of_stock': 'Rupture de stock',
      'preorder': 'Pré-commande',
      'coming_soon': 'Bientôt disponible',
      'discontinued': 'Archivé',
      'sourcing': 'En sourcing',
      'pret_a_commander': 'Prêt à commander',
      'echantillon_a_commander': 'Échantillon à commander'
    }
    return translations[status] || status
  }

  // Calculs des statistiques - Logique ERP avec vraies valeurs enum
  const totalProducts = products?.length || 0

  // Produits Actifs : disponibles à la vente (in_stock, preorder, coming_soon, pret_a_commander)
  const activeProducts = products?.filter(p =>
    ['in_stock', 'preorder', 'coming_soon', 'pret_a_commander'].includes(p.status)
  )?.length || 0

  // Produits Publiés : tous sauf ceux en phase de sourcing
  const publishedProducts = products?.filter(p =>
    !['sourcing', 'echantillon_a_commander'].includes(p.status)
  )?.length || 0

  // Produits Archivés : discontinued (arrêtés du catalogue)
  const archivedProducts = products?.filter(p => p.status === 'discontinued')?.length || 0

  // Produits récents (derniers 7 jours)
  const recentProducts = products?.filter(p => {
    const createdAt = new Date(p.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return createdAt >= weekAgo
  }) || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Design Minimaliste */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">Dashboard Catalogue</h1>
              <p className="text-gray-500 mt-0.5 text-sm">Vue d'ensemble des produits et collections Vérone</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/catalogue')}
                className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-black"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Catalogue</span>
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/catalogue/create')}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Nouveau</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* KPIs Cards - Design Minimaliste */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Total Produits</CardTitle>
              <Package className="h-3.5 w-3.5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{totalProducts}</div>
              <p className="text-xs text-gray-500">
                +{recentProducts.length} cette semaine
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Publiés</CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{publishedProducts}</div>
              <p className="text-xs text-gray-500">
                {totalProducts > 0 ? Math.round((publishedProducts / totalProducts) * 100) : 0}% du catalogue
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Produits Actifs</CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{activeProducts}</div>
              <p className="text-xs text-gray-500">
                Disponibles à la vente
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">Archivés</CardTitle>
              <Archive className="h-3.5 w-3.5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{archivedProducts}</div>
              <p className="text-xs text-gray-500">
                Produits archivés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Rapides - Design Minimaliste */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-black">Actions Rapides</CardTitle>
            <CardDescription className="text-xs">Accès rapide aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-12 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => router.push('/catalogue/variantes')}
              >
                <div className="flex flex-col items-center gap-1">
                  <Palette className="h-4 w-4" />
                  <span className="text-xs">Variantes</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-12 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => router.push('/catalogue/categories')}
              >
                <div className="flex flex-col items-center gap-1">
                  <Filter className="h-4 w-4" />
                  <span className="text-xs">Gérer Catégories</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-12 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => router.push('/catalogue/collections')}
              >
                <div className="flex flex-col items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span className="text-xs">Collections</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-12 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => router.push('/contacts-organisations/suppliers')}
              >
                <div className="flex flex-col items-center gap-1">
                  <Truck className="h-4 w-4" />
                  <span className="text-xs">Fournisseurs</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity - Design Minimaliste */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-black">Produits Récents</CardTitle>
              <CardDescription className="text-xs">Derniers produits ajoutés (7 derniers jours)</CardDescription>
            </CardHeader>
            <CardContent>
              {recentProducts.length > 0 ? (
                <div className="space-y-2">
                  {recentProducts.slice(0, 5).map((product) => {
                    const completion = calculateProductCompletion(product)
                    return (
                      <div key={product.id} className="flex items-center justify-between py-1">
                        <div>
                          <p className="text-sm font-medium text-black">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(product.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            completion.isComplete
                              ? 'text-green-600 border-green-200 bg-green-50'
                              : 'text-black border-gray-200 bg-gray-50'
                          }`}
                        >
                          {completion.isComplete ? 'Complet' : 'Incomplet'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucun produit récent</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-black">Performance Catalogue</CardTitle>
              <CardDescription className="text-xs">Métriques de performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Taux de publication</span>
                  <span className="text-sm font-semibold text-black">
                    {totalProducts > 0 ? Math.round((publishedProducts / totalProducts) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Produits actifs</span>
                  <span className="text-sm font-semibold text-black">{activeProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Croissance cette semaine</span>
                  <span className="text-sm font-semibold text-green-600">+{recentProducts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modules Connexes - Design Minimaliste */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-black">Modules Connexes</CardTitle>
            <CardDescription className="text-xs">Accès rapide aux autres sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-12 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  <span className="text-xs">Gestion Stocks</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-12 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => router.push('/catalogue/sourcing')}
              >
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs">Sourcing</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-12 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs">Consultations</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}