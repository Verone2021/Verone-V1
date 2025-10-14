"use client"

import { useRouter } from 'next/navigation'
import {
  ShoppingBag,
  MessageCircle,
  TrendingUp,
  Euro,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Package
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function VentesDashboardPage() {
  const router = useRouter()

  // Statistiques mockées (à remplacer par vraies données)
  const stats = {
    consultationsActives: 8,
    commandesEnCours: 5,
    chiffreAffaireMois: 45680,
    tauxConversion: 62
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold text-black flex items-center gap-3">
              <ShoppingBag className="h-8 w-8" />
              Dashboard Ventes
            </h1>
            <p className="text-gray-600 mt-1">
              Gestion des consultations clients et commandes
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Consultations Actives
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.consultationsActives}</div>
              <p className="text-xs text-gray-600 mt-1">
                En attente de réponse
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Commandes en Cours
              </CardTitle>
              <Package className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.commandesEnCours}</div>
              <p className="text-xs text-gray-600 mt-1">
                À préparer ou expédier
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                CA ce mois
              </CardTitle>
              <Euro className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {stats.chiffreAffaireMois.toLocaleString('fr-FR')} €
              </div>
              <p className="text-xs text-green-600 mt-1">
                +12% vs mois dernier
              </p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Taux de Conversion
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">{stats.tauxConversion}%</div>
              <p className="text-xs text-gray-600 mt-1">
                Consultations → Commandes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pages Ventes */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Pages Ventes</CardTitle>
            <CardDescription>
              Accès rapide aux différentes sections de vente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Consultations */}
              <Button
                variant="outline"
                className="h-24 border-black text-black hover:bg-black hover:text-white justify-start"
                onClick={() => router.push('/consultations')}
              >
                <div className="flex items-center w-full gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-base">Consultations</div>
                    <div className="text-sm opacity-70">Demandes clients et devis</div>
                  </div>
                  {stats.consultationsActives > 0 && (
                    <Badge variant="default" className="bg-blue-600">
                      {stats.consultationsActives}
                    </Badge>
                  )}
                </div>
              </Button>

              {/* Commandes Clients */}
              <Button
                variant="outline"
                className="h-24 border-black text-black hover:bg-black hover:text-white justify-start"
                onClick={() => router.push('/commandes/clients')}
              >
                <div className="flex items-center w-full gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-base">Commandes Clients</div>
                    <div className="text-sm opacity-70">Ventes et suivi livraisons</div>
                  </div>
                  {stats.commandesEnCours > 0 && (
                    <Badge variant="default" className="bg-green-600">
                      {stats.commandesEnCours}
                    </Badge>
                  )}
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activité Récente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Consultations récentes */}
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Consultations Récentes
              </CardTitle>
              <CardDescription>Dernières demandes clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { client: 'Sophie Durand', produit: 'Canapé 3 places', status: 'pending', date: '2025-01-15' },
                  { client: 'Pierre Martin', produit: 'Table chêne massif', status: 'quoted', date: '2025-01-14' },
                  { client: 'Marie Leclerc', produit: 'Suspension design', status: 'pending', date: '2025-01-13' }
                ].map((consult, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-sm text-black">{consult.client}</div>
                        <div className="text-xs text-gray-600">{consult.produit}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {consult.status === 'pending' ? (
                        <Badge variant="outline" className="border-orange-300 text-orange-600 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-blue-300 text-blue-600 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Devis envoyé
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">{consult.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/consultations')}
              >
                Voir toutes les consultations
              </Button>
            </CardContent>
          </Card>

          {/* Commandes récentes */}
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Commandes Récentes
              </CardTitle>
              <CardDescription>Dernières ventes clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { numero: 'CMD-2025-087', client: 'Jean Dupont', montant: 2450, status: 'processing' },
                  { numero: 'CMD-2025-086', client: 'Alice Bernard', montant: 1890, status: 'shipped' },
                  { numero: 'CMD-2025-085', client: 'Marc Dubois', montant: 3200, status: 'processing' }
                ].map((cmd, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-sm text-black">{cmd.numero}</div>
                        <div className="text-xs text-gray-600">{cmd.client}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-black">{cmd.montant} €</div>
                      {cmd.status === 'processing' ? (
                        <Badge variant="outline" className="border-blue-300 text-blue-600 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          En cours
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-300 text-green-600 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Expédiée
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/commandes/clients')}
              >
                Voir toutes les commandes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Actions Rapides */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Actions Rapides</CardTitle>
            <CardDescription>Fonctionnalités fréquentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/consultations/create')}
              >
                <div className="flex flex-col items-center gap-1">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm">Nouvelle Consultation</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/commandes/clients')}
              >
                <div className="flex flex-col items-center gap-1">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">Calendrier Livraisons</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/consultations')}
              >
                <div className="flex flex-col items-center gap-1">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">Relances à Faire</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
