'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Archive, Search, Zap, Plus, TrendingUp, Settings } from 'lucide-react'
import Link from 'next/link'
import { useProducts } from '@/hooks/use-products'

interface ProductStats {
  totalProducts: number
  archivedProducts: number
  sourcingProducts: number
  sampleProducts: number
}

export default function ProduitsPage() {
  const { products, loading } = useProducts()

  // Calculer les statistiques des produits
  const stats: ProductStats = {
    totalProducts: products.length,
    archivedProducts: products.filter(p => p.archived_at).length,
    sourcingProducts: products.filter(p => p.creation_mode === 'sourcing').length,
    sampleProducts: products.filter(p => p.requires_sample === true).length,
  }

  const moduleCards = [
    {
      title: 'Produits Archivés',
      description: 'Produits archivés et fin de série',
      count: stats.archivedProducts,
      href: '/produits/archived',
      icon: <Archive className="h-6 w-6" />,
      color: 'bg-gray-50 border-gray-200 text-gray-700',
      available: true
    },
    {
      title: 'Produits en Sourcing',
      description: 'Produits en cours de sourcing',
      count: stats.sourcingProducts,
      href: '/produits/sourcing',
      icon: <Search className="h-6 w-6" />,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      available: true
    },
    {
      title: 'Échantillons à Commander',
      description: 'Produits nécessitant des échantillons',
      count: stats.sampleProducts,
      href: '/produits/samples',
      icon: <Package className="h-6 w-6" />,
      color: 'bg-orange-50 border-orange-200 text-orange-700',
      available: true
    }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-black">Dashboard Produits</h1>
          <p className="text-gray-600 mt-2">
            Hub central pour la gestion des produits Vérone par statut
          </p>
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

      {/* Statistiques Produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Produits
            </CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {loading ? '...' : stats.totalProducts}
            </div>
            <p className="text-xs text-gray-500">
              Tous produits confondus
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Produits Archivés
            </CardTitle>
            <Archive className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {loading ? '...' : stats.archivedProducts}
            </div>
            <p className="text-xs text-gray-500">
              Fin de série et archivés
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              En Sourcing
            </CardTitle>
            <Search className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : stats.sourcingProducts}
            </div>
            <p className="text-xs text-gray-500">
              Produits en recherche
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Échantillons
            </CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loading ? '...' : stats.sampleProducts}
            </div>
            <p className="text-xs text-gray-500">
              À commander
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modules de gestion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {moduleCards.map((module, index) => (
          <Card key={index} className={`hover:shadow-lg transition-shadow ${module.available ? 'cursor-pointer' : 'opacity-60'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${module.color}`}>
                    {module.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg text-black">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                </div>
                <div className="text-2xl font-bold text-black">
                  {loading ? '...' : module.count}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">{module.description}</p>
                {module.available ? (
                  <Link href={module.href}>
                    <Button size="sm">
                      Gérer
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" disabled>
                    Bientôt disponible
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section Catalogue Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-50 border-green-200 text-green-700">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg text-black">Catalogue Principal</CardTitle>
                <CardDescription>Gestion complète du catalogue produits actifs</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Accès au catalogue complet avec outils de recherche, filtrage et gestion
            </p>
            <Link href="/catalogue">
              <Button size="sm">
                Accéder au catalogue
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Activité Récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activité Récente
          </CardTitle>
          <CardDescription>Dernières mises à jour et statistiques</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-blue-50">
              <Search className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-black">{stats.sourcingProducts} produits en sourcing</p>
              <p className="text-xs text-gray-500">En cours de recherche et validation</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-orange-50">
              <Package className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-black">{stats.sampleProducts} échantillons à commander</p>
              <p className="text-xs text-gray-500">Produits nécessitant validation échantillon</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-gray-50">
              <Archive className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-black">{stats.archivedProducts} produits archivés</p>
              <p className="text-xs text-gray-500">Fin de série et produits arrêtés</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Workflow Gestion Produits
          </CardTitle>
          <CardDescription>Processus organisé de gestion du cycle de vie produit</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-black mb-2">Statuts Produits</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Sourcing : Recherche et validation fournisseur</li>
              <li>• Échantillons : Commande et validation qualité</li>
              <li>• Actifs : Disponibles dans le catalogue</li>
              <li>• Archivés : Fin de série et arrêtés</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-black mb-2">Processus</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Sourcing → Échantillon → Validation</li>
              <li>• Intégration catalogue avec images</li>
              <li>• Gestion stock et commandes</li>
              <li>• Archivage et suivi fin de vie</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}