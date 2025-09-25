"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageCircle,
  ShoppingBag,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Euro,
  Calendar,
  Eye,
  Plus,
  Filter,
  BarChart3,
  Star,
  Phone,
  Mail
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function InteractionsDashboardPage() {
  const router = useRouter()

  // Données mock pour le dashboard interactions clients
  const stats = {
    totalConsultations: 156,
    pendingConsultations: 23,
    activeOrders: 42,
    monthlyRevenue: 125890,
    conversionRate: 68,
    averageOrderValue: 2485
  }

  const recentConsultations = [
    {
      id: 1,
      client: { name: 'Marie Dubois', email: 'marie.dubois@email.com', phone: '06.12.34.56.78' },
      subject: 'Aménagement salon 45m²',
      status: 'pending',
      priority: 'high',
      budget: '15000-20000€',
      created_at: '2025-01-18',
      last_contact: '2025-01-18',
      consultant: 'Sophie Martin'
    },
    {
      id: 2,
      client: { name: 'Pierre Laurent', email: 'p.laurent@gmail.com', phone: '07.89.12.34.56' },
      subject: 'Cuisine équipée moderne',
      status: 'in_progress',
      priority: 'medium',
      budget: '25000-30000€',
      created_at: '2025-01-16',
      last_contact: '2025-01-17',
      consultant: 'Thomas Durand'
    },
    {
      id: 3,
      client: { name: 'Julie Chen', email: 'julie.chen@hotmail.fr', phone: '06.45.78.90.12' },
      subject: 'Décoration chambre enfant',
      status: 'quoted',
      priority: 'low',
      budget: '3000-5000€',
      created_at: '2025-01-15',
      last_contact: '2025-01-16',
      consultant: 'Marie Leroy'
    },
    {
      id: 4,
      client: { name: 'Alexandre Roux', email: 'alex.roux@outlook.com', phone: '06.23.45.67.89' },
      subject: 'Bureau professionnel',
      status: 'validated',
      priority: 'high',
      budget: '8000-12000€',
      created_at: '2025-01-14',
      last_contact: '2025-01-17',
      consultant: 'Sophie Martin'
    }
  ]

  const recentOrders = [
    {
      id: 'CMD-2025-045',
      client: 'Famille Rodriguez',
      amount: 18500,
      status: 'production',
      delivery_date: '2025-02-15',
      progress: 65
    },
    {
      id: 'CMD-2025-044',
      client: 'Entreprise Digital Corp',
      amount: 32000,
      status: 'delivered',
      delivery_date: '2025-01-20',
      progress: 100
    },
    {
      id: 'CMD-2025-043',
      client: 'Madame Petit',
      amount: 7250,
      status: 'shipping',
      delivery_date: '2025-01-25',
      progress: 85
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-orange-300 text-orange-600">En attente</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">En cours</Badge>
      case 'quoted':
        return <Badge variant="outline" className="border-purple-300 text-purple-600">Devisé</Badge>
      case 'validated':
        return <Badge variant="outline" className="border-green-300 text-green-600">Validé</Badge>
      case 'production':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">Production</Badge>
      case 'shipping':
        return <Badge variant="outline" className="border-orange-300 text-orange-600">Expédition</Badge>
      case 'delivered':
        return <Badge variant="outline" className="border-green-300 text-green-600">Livré</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>
      case 'medium':
        return <Badge variant="outline" className="border-orange-300 text-orange-600 text-xs">Moyen</Badge>
      case 'low':
        return <Badge variant="outline" className="border-green-300 text-green-600 text-xs">Faible</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Normal</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Dashboard Interactions Clients</h1>
              <p className="text-gray-600 mt-1">Vue d'ensemble des consultations et commandes clients</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/consultations')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Consultations
              </Button>
              <Button
                onClick={() => router.push('/consultations')}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Consultations Actives</CardTitle>
              <MessageCircle className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.totalConsultations}</div>
              <p className="text-xs text-gray-600">
                {stats.pendingConsultations} en attente
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Commandes en Cours</CardTitle>
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.activeOrders}</div>
              <p className="text-xs text-gray-600">
                commandes actives
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">CA Mensuel</CardTitle>
              <Euro className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.monthlyRevenue.toLocaleString()}€</div>
              <p className="text-xs text-gray-600">
                ce mois-ci
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taux Conversion</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.conversionRate}%</div>
              <p className="text-xs text-gray-600">
                consultation → commande
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Panier Moyen</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.averageOrderValue.toLocaleString()}€</div>
              <p className="text-xs text-gray-600">
                valeur moyenne
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">4.8/5</div>
              <p className="text-xs text-gray-600">
                note moyenne clients
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Rapides */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Actions Rapides</CardTitle>
            <CardDescription>Accès rapide aux fonctionnalités client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/consultations')}
              >
                <div className="flex flex-col items-center">
                  <MessageCircle className="h-6 w-6 mb-2" />
                  <span>Consultations</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/commandes/clients')}
              >
                <div className="flex flex-col items-center">
                  <ShoppingBag className="h-6 w-6 mb-2" />
                  <span>Commandes</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/contacts-organisations')}
              >
                <div className="flex flex-col items-center">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Contacts</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Consultations Récentes et Commandes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Consultations récentes */}
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Consultations Récentes</CardTitle>
              <CardDescription>Dernières demandes clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentConsultations.map((consultation) => (
                  <div key={consultation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-black">{consultation.subject}</h4>
                        <p className="text-sm text-gray-600">{consultation.client.name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(consultation.priority)}
                        {getStatusBadge(consultation.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                      <div>Budget: {consultation.budget}</div>
                      <div>Consultant: {consultation.consultant}</div>
                      <div>Créé: {consultation.created_at}</div>
                      <div>Contact: {consultation.last_contact}</div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="border-gray-300">
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-300">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Commandes en cours */}
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Commandes en Cours</CardTitle>
              <CardDescription>Suivi des commandes actives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-black">{order.id}</h4>
                        <p className="text-sm text-gray-600">{order.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-black">{order.amount.toLocaleString()}€</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Avancement</span>
                        <span>{order.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${order.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        Livraison: {order.delivery_date}
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-300">
                        <Eye className="h-3 w-3 mr-1" />
                        Suivre
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}