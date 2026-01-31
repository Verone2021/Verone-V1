'use client';

import { useRouter } from 'next/navigation';

import { useSalesDashboard } from '@verone/orders';
import { Badge } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  ShoppingBag,
  MessageCircle,
  TrendingUp,
  Euro,
  Calendar,
  Clock,
  AlertCircle,
  Users,
  Package,
  Loader2,
} from 'lucide-react';

export default function VentesDashboardPage() {
  const router = useRouter();
  const { metrics, loading, error } = useSalesDashboard();

  // Extraction avec fallbacks si pas de données
  const stats = metrics?.stats ?? {
    consultationsActives: 0,
    commandesEnCours: 0,
    chiffreAffaireMois: 0,
    tauxConversion: 0,
  };

  const recentConsultations = metrics?.recentConsultations ?? [];
  const recentOrders = metrics?.recentOrders ?? [];

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

      <div className="w-full px-4 py-8 space-y-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Chargement...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Erreur</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Contenu principal (si pas loading) */}
        {!loading && (
          <>
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
                  <div className="text-2xl font-bold text-black">
                    {stats.consultationsActives}
                  </div>
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
                  <div className="text-2xl font-bold text-black">
                    {stats.commandesEnCours}
                  </div>
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
                  <p className="text-xs text-gray-600 mt-1">Mois en cours</p>
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
                  <div className="text-2xl font-bold text-black">
                    {stats.tauxConversion}%
                  </div>
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
                  <ButtonUnified
                    variant="outline"
                    className="h-24 border-black text-black hover:bg-black hover:text-white justify-start"
                    onClick={() => router.push('/consultations')}
                  >
                    <div className="flex items-center w-full gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <MessageCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-base">
                          Consultations
                        </div>
                        <div className="text-sm opacity-70">
                          Demandes clients et devis
                        </div>
                      </div>
                      {stats.consultationsActives > 0 && (
                        <Badge variant="secondary" className="bg-blue-600">
                          {stats.consultationsActives}
                        </Badge>
                      )}
                    </div>
                  </ButtonUnified>

                  {/* Commandes Clients */}
                  <ButtonUnified
                    variant="outline"
                    className="h-24 border-black text-black hover:bg-black hover:text-white justify-start"
                    onClick={() => router.push('/commandes/clients')}
                  >
                    <div className="flex items-center w-full gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <ShoppingBag className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-base">
                          Commandes Clients
                        </div>
                        <div className="text-sm opacity-70">
                          Ventes et suivi livraisons
                        </div>
                      </div>
                      {stats.commandesEnCours > 0 && (
                        <Badge variant="secondary" className="bg-green-600">
                          {stats.commandesEnCours}
                        </Badge>
                      )}
                    </div>
                  </ButtonUnified>
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
                    {recentConsultations.length === 0 ? (
                      <div className="text-center py-6">
                        <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          Aucune consultation récente
                        </p>
                      </div>
                    ) : (
                      recentConsultations.map(consult => (
                        <div
                          key={consult.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-sm text-black">
                                {consult.organisation_name ||
                                  consult.client_email}
                              </div>
                              <div className="text-xs text-gray-600">
                                {consult.tarif_maximum
                                  ? `Budget max: ${consult.tarif_maximum}€`
                                  : 'Budget non défini'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-orange-300 text-orange-600 text-xs"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {consult.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(consult.created_at).toLocaleDateString(
                                'fr-FR',
                                { day: '2-digit', month: '2-digit' }
                              )}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <ButtonUnified
                    variant="outline"
                    className="w-full mt-4 border-black text-black hover:bg-black hover:text-white"
                    onClick={() => router.push('/consultations')}
                  >
                    Voir toutes les consultations
                  </ButtonUnified>
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
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-6">
                        <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          Aucune commande récente
                        </p>
                      </div>
                    ) : (
                      recentOrders.map(cmd => (
                        <div
                          key={cmd.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-sm text-black">
                                {cmd.order_number}
                              </div>
                              <div className="text-xs text-gray-600">
                                {cmd.customer_name}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-black">
                              {cmd.total_ttc.toLocaleString('fr-FR')} €
                            </div>
                            <Badge
                              variant="outline"
                              className="border-blue-300 text-blue-600 text-xs"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {cmd.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <ButtonUnified
                    variant="outline"
                    className="w-full mt-4 border-black text-black hover:bg-black hover:text-white"
                    onClick={() => router.push('/commandes/clients')}
                  >
                    Voir toutes les commandes
                  </ButtonUnified>
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
                  <ButtonUnified
                    variant="outline"
                    className="h-16 border-black text-black hover:bg-black hover:text-white"
                    onClick={() => router.push('/consultations/create')}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm">Nouvelle Consultation</span>
                    </div>
                  </ButtonUnified>

                  <ButtonUnified
                    variant="outline"
                    className="h-16 border-black text-black hover:bg-black hover:text-white"
                    onClick={() => router.push('/commandes/clients')}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Calendar className="h-5 w-5" />
                      <span className="text-sm">Calendrier Livraisons</span>
                    </div>
                  </ButtonUnified>

                  <ButtonUnified
                    variant="outline"
                    className="h-16 border-black text-black hover:bg-black hover:text-white"
                    onClick={() => router.push('/consultations')}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm">Relances à Faire</span>
                    </div>
                  </ButtonUnified>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
