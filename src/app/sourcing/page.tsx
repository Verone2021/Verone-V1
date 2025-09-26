"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Eye,
  CheckCircle,
  BarChart3,
  Package,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  Users,
  ShoppingCart
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSourcingProducts } from '@/hooks/use-sourcing-products'

export default function SourcingDashboardPage() {
  const router = useRouter()

  // Données réelles via hook Supabase
  const { products: sourcingProducts, loading: sourcingLoading } = useSourcingProducts({})

  // Calculs des statistiques basées sur les vraies données
  const stats = {
    totalDrafts: sourcingProducts?.filter(p => p.status === 'sourcing').length || 0,
    pendingValidation: sourcingProducts?.filter(p => p.status === 'echantillon_a_commander').length || 0,
    samplesOrdered: sourcingProducts?.filter(p => p.status === 'echantillon_commande').length || 0,
    completedThisMonth: sourcingProducts?.filter(p => {
      if (p.status === 'in_stock' && p.created_at) {
        const createdDate = new Date(p.created_at)
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
      }
      return false
    }).length || 0
  }

  // Activité récente basée sur les vraies données (5 plus récents)
  const recentActivity = sourcingProducts?.slice(0, 4).map(product => ({
    id: product.id,
    type: product.status === 'sourcing' ? 'draft' : product.requires_sample ? 'sample' : 'validation',
    title: product.name,
    client: product.assigned_client?.name || 'Interne',
    status: product.status === 'sourcing' ? 'pending' :
            product.status === 'echantillon_commande' ? 'ordered' : 'ready',
    date: new Date(product.created_at).toLocaleDateString('fr-FR')
  })) || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-orange-300 text-orange-600">En attente</Badge>
      case 'ordered':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">Commandé</Badge>
      case 'ready':
        return <Badge variant="outline" className="border-green-300 text-green-600">Prêt</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'draft':
        return <Search className="h-4 w-4 text-orange-600" />
      case 'sample':
        return <Eye className="h-4 w-4 text-blue-600" />
      case 'validation':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Dashboard Sourcing</h1>
              <p className="text-gray-600 mt-1">Gestion des produits à sourcer et validation catalogue</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/sourcing/validation')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Validation
              </Button>
              <Button
                onClick={() => router.push('/sourcing/produits')}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Sourcing
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
              <CardTitle className="text-sm font-medium text-gray-600">Brouillons Actifs</CardTitle>
              <Search className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {sourcingLoading ? '...' : stats.totalDrafts}
              </div>
              <p className="text-xs text-gray-600">
                produits en cours de sourcing
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En Validation</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {sourcingLoading ? '...' : stats.pendingValidation}
              </div>
              <p className="text-xs text-gray-600">
                produits à valider
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Échantillons</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {sourcingLoading ? '...' : stats.samplesOrdered}
              </div>
              <p className="text-xs text-gray-600">
                commandes en cours
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Complétés</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {sourcingLoading ? '...' : stats.completedThisMonth}
              </div>
              <p className="text-xs text-gray-600">
                ce mois-ci
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Actions Rapides</CardTitle>
            <CardDescription>Accès rapide aux fonctionnalités de sourcing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/sourcing/produits')}
              >
                <div className="flex flex-col items-center">
                  <Search className="h-6 w-6 mb-2" />
                  <span>Produits à Sourcer</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/sourcing/echantillons')}
              >
                <div className="flex flex-col items-center">
                  <Eye className="h-6 w-6 mb-2" />
                  <span>Échantillons</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/sourcing/validation')}
              >
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  <span>Validation</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Activité Récente</CardTitle>
            <CardDescription>Dernières actions de sourcing et validation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-200 rounded">
                  <div className="flex items-center space-x-3">
                    {getActivityIcon(activity.type)}
                    <div>
                      <p className="font-medium text-black">{activity.title}</p>
                      <p className="text-sm text-gray-600">Client: {activity.client}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(activity.status)}
                    <span className="text-xs text-gray-500">{activity.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Performance Sourcing</CardTitle>
              <CardDescription>Métriques et tendances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taux de conversion</span>
                  <span className="font-medium text-green-600">78%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Temps moyen sourcing</span>
                  <span className="font-medium text-black">5.2 jours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Satisfaction client</span>
                  <span className="font-medium text-green-600">4.6/5</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Prochaines Actions</CardTitle>
              <CardDescription>Tâches prioritaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">12 produits en attente de validation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">3 échantillons attendus cette semaine</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm">5 demandes clients à traiter</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}