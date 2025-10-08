'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, Truck, UserCheck, Plus, TrendingUp, Phone, Mail, Settings } from 'lucide-react'
import Link from 'next/link'
import { useOrganisations } from '@/hooks/use-organisations'

interface OrganisationStats {
  totalOrganisations: number
  suppliers: number
  customersProfessional: number
  partners: number
}

export default function OrganisationPage() {
  const { organisations, loading } = useOrganisations()

  // Calculer les statistiques des organisations uniquement (excluant les particuliers)
  const organisationsOnly = organisations.filter(o =>
    o.type !== 'customer' || (o.type === 'customer' && o.customer_type !== 'individual')
  )

  const stats: OrganisationStats = {
    totalOrganisations: organisationsOnly.length,
    suppliers: organisations.filter(o => o.type === 'supplier').length,
    // Si customer_type n'existe pas, on considère tous les customers comme professionnels par défaut
    customersProfessional: organisations.filter(o =>
      o.type === 'customer' && (!o.customer_type || o.customer_type === 'professional')
    ).length,
    partners: organisations.filter(o => o.type === 'partner').length,
  }

  const moduleCards = [
    {
      title: 'Fournisseurs',
      description: 'Gestion des partenaires commerciaux',
      count: stats.suppliers,
      href: '/contacts-organisations/suppliers',
      icon: <Truck className="h-6 w-6" />,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      available: true
    },
    {
      title: 'Clients Professionnels',
      description: 'Clients B2B et entreprises',
      count: stats.customersProfessional,
      href: '/contacts-organisations/customers?type=professional',
      icon: <Building2 className="h-6 w-6" />,
      color: 'bg-green-50 border-green-200 text-green-700',
      available: true
    },
    {
      title: 'Prestataires',
      description: 'Partenaires de services',
      count: stats.partners,
      href: '/contacts-organisations/partners',
      icon: <Settings className="h-6 w-6" />,
      color: 'bg-gray-50 border-gray-200 text-gray-800',
      available: true
    }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-black">Organisation</h1>
          <p className="text-gray-600 mt-2">
            Hub central pour la gestion de l'écosystème relationnel Vérone
          </p>
        </div>
      </div>

      {/* Statistiques Organisations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Organisations
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {loading ? '...' : stats.totalOrganisations}
            </div>
            <p className="text-xs text-gray-500">
              Toutes organisations confondues
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Fournisseurs
            </CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : stats.suppliers}
            </div>
            <p className="text-xs text-gray-500">
              Partenaires commerciaux
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clients Pro
            </CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : stats.customersProfessional}
            </div>
            <p className="text-xs text-gray-500">
              Clients professionnels B2B
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Prestataires
            </CardTitle>
            <Settings className="h-4 w-4 text-gray-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {loading ? '...' : stats.partners}
            </div>
            <p className="text-xs text-gray-500">
              Partenaires de services
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

      {/* Section Contacts (déplacée vers le bas avec bouton) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-50 border-indigo-200 text-indigo-700">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg text-black">Contacts Professionnels</CardTitle>
                <CardDescription>Annuaire des contacts fournisseurs et clients B2B</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Gestion centralisée des contacts avec rôles spécialisés (Commercial, Technique, Facturation)
            </p>
            <Link href="/contacts-organisations/contacts">
              <Button size="sm">
                Accéder aux contacts
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Activité Récente - Organisations uniquement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activité Récente
          </CardTitle>
          <CardDescription>Dernières interactions et mises à jour</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-blue-50">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-black">{stats.suppliers} fournisseurs actifs</p>
              <p className="text-xs text-gray-500">Prêts pour création de commandes</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-green-50">
              <Building2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-black">{stats.customersProfessional} clients professionnels</p>
              <p className="text-xs text-gray-500">Entreprises et organisations B2B</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-gray-50">
              <Settings className="h-4 w-4 text-black" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-black">{stats.partners} prestataires actifs</p>
              <p className="text-xs text-gray-500">Partenaires de services</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Architecture Multi-Tenant
          </CardTitle>
          <CardDescription>Système de gestion relationnel avec sécurité RLS et isolation des données</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-black mb-2">Organisations</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Fournisseurs : Gestion commandes et catalogue</li>
              <li>• Clients Pro : Contacts multiples et facturation</li>
              <li>• Prestataires : Services et sous-traitance</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-black mb-2">Contacts</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Rôles spécialisés (Commercial, Technique, Facturation)</li>
              <li>• Historique des interactions</li>
              <li>• Préférences de communication</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}