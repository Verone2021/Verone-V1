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
  Truck
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { useProducts } from '../../../hooks/use-products'

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Dashboard Catalogue</h1>
              <p className="text-gray-600 mt-1">Vue d'ensemble des produits et collections Vérone</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/catalogue')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir Catalogue
              </Button>
              <Button
                onClick={() => router.push('/catalogue/create')}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Produit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Produits</CardTitle>
              <Package className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{totalProducts}</div>
              <p className="text-xs text-gray-600">
                +{recentProducts.length} cette semaine
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Publiés</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{publishedProducts}</div>
              <p className="text-xs text-gray-600">
                {totalProducts > 0 ? Math.round((publishedProducts / totalProducts) * 100) : 0}% du catalogue
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Produits Actifs</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{activeProducts}</div>
              <p className="text-xs text-gray-600">
                Disponibles à la vente
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Archivés</CardTitle>
              <Archive className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{archivedProducts}</div>
              <p className="text-xs text-gray-600">
                Produits archivés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Actions Rapides</CardTitle>
            <CardDescription>Accès rapide aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/catalogue/create')}
              >
                <div className="flex flex-col items-center">
                  <Plus className="h-6 w-6 mb-2" />
                  <span>Nouveau Produit</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/catalogue/categories')}
              >
                <div className="flex flex-col items-center">
                  <Filter className="h-6 w-6 mb-2" />
                  <span>Gérer Catégories</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/catalogue/collections')}
              >
                <div className="flex flex-col items-center">
                  <Package className="h-6 w-6 mb-2" />
                  <span>Collections</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/contacts-organisations/suppliers')}
              >
                <div className="flex flex-col items-center">
                  <Truck className="h-6 w-6 mb-2" />
                  <span>Fournisseurs</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Produits Récents</CardTitle>
              <CardDescription>Derniers produits ajoutés (7 derniers jours)</CardDescription>
            </CardHeader>
            <CardContent>
              {recentProducts.length > 0 ? (
                <div className="space-y-3">
                  {recentProducts.slice(0, 5).map((product) => {
                    const completion = calculateProductCompletion(product)
                    return (
                      <div key={product.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-black">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(product.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`border-black ${
                            completion.isComplete
                              ? 'text-green-700 border-green-700'
                              : 'text-orange-600 border-orange-600'
                          }`}
                        >
                          {completion.isComplete ? 'Complet' : 'Incomplet'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-600">Aucun produit récent</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Performance Catalogue</CardTitle>
              <CardDescription>Métriques de performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taux de publication</span>
                  <span className="font-medium text-black">
                    {totalProducts > 0 ? Math.round((publishedProducts / totalProducts) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Produits actifs</span>
                  <span className="font-medium text-black">{activeProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Croissance cette semaine</span>
                  <span className="font-medium text-green-600">+{recentProducts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation vers autres modules */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Modules Connexes</CardTitle>
            <CardDescription>Accès rapide aux autres sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 border-gray-300 text-gray-400 opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  <span>Gestion Stocks</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/catalogue/sourcing')}
              >
                <div className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  <span>Sourcing</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 border-gray-300 text-gray-400 opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  <span>Consultations</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}