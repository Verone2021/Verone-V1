'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useSourcingProducts } from '@verone/products';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
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
  ShoppingCart,
} from 'lucide-react';

export default function SourcingDashboardPage() {
  const router = useRouter();

  // Données réelles via hook Supabase
  const { products: sourcingProducts, loading: sourcingLoading } =
    useSourcingProducts({});

  // État pour compter les produits complétés ce mois-ci
  const [completedThisMonth, setCompletedThisMonth] = useState<number>(0);
  const [completedLoading, setCompletedLoading] = useState(true);

  // Calculs des statistiques basées sur les vraies données
  const stats = {
    totalDrafts:
      sourcingProducts?.filter(p => p.product_status === 'draft').length || 0,
    pendingValidation:
      sourcingProducts?.filter(
        p => p.product_status === 'preorder' || p.requires_sample
      ).length || 0,
    samplesOrdered:
      sourcingProducts?.filter(
        p => p.requires_sample && p.product_status === 'preorder'
      ).length || 0,
    completedThisMonth,
  };

  // Charger le nombre de produits complétés ce mois-ci
  useEffect(() => {
    const fetchCompletedCount = async () => {
      try {
        setCompletedLoading(true);
        const supabase = createClient();

        // Calculer les dates du mois en cours
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        // Requête pour compter les produits validés ce mois-ci
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('creation_mode', 'complete')
          .eq('product_status', 'active')
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());

        if (error) throw error;

        setCompletedThisMonth(count || 0);
      } catch (error) {
        console.error('Erreur chargement produits complétés:', error);
        setCompletedThisMonth(0);
      } finally {
        setCompletedLoading(false);
      }
    };

    fetchCompletedCount();
  }, []);

  // Activité récente basée sur les vraies données (5 plus récents)
  const recentActivity =
    sourcingProducts?.slice(0, 4).map(product => ({
      id: product.id,
      type:
        product.product_status === 'draft'
          ? 'draft'
          : product.requires_sample
            ? 'sample'
            : 'validation',
      title: product.name,
      client: product.assigned_client?.name || 'Interne',
      status:
        product.product_status === 'draft'
          ? 'pending'
          : product.product_status === 'preorder' && product.requires_sample
            ? 'ordered'
            : 'ready',
      date: new Date(product.created_at).toLocaleDateString('fr-FR'),
    })) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-gray-300 text-black">
            En attente
          </Badge>
        );
      case 'ordered':
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-600">
            Commandé
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="outline" className="border-green-300 text-green-600">
            Prêt
          </Badge>
        );
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'draft':
        return <Search className="h-4 w-4 text-black" />;
      case 'sample':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'validation':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Dashboard Sourcing
              </h1>
              <p className="text-gray-600 mt-1">
                Gestion des produits à sourcer et validation catalogue
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <ButtonV2
                variant="outline"
                onClick={() => router.push('/produits/sourcing/produits')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Package className="h-4 w-4 mr-2" />
                Produits Sourcing
              </ButtonV2>
              <ButtonV2
                onClick={() =>
                  router.push('/produits/sourcing/produits/create')
                }
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Sourcing
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8 space-y-8">
        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Brouillons Actifs
              </CardTitle>
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
              <CardTitle className="text-sm font-medium text-gray-600">
                En Validation
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {sourcingLoading ? '...' : stats.pendingValidation}
              </div>
              <p className="text-xs text-gray-600">produits à valider</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Échantillons
              </CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {sourcingLoading ? '...' : stats.samplesOrdered}
              </div>
              <p className="text-xs text-gray-600">commandes en cours</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Complétés
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {sourcingLoading ? '...' : stats.completedThisMonth}
              </div>
              <p className="text-xs text-gray-600">ce mois-ci</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Actions Rapides</CardTitle>
            <CardDescription>
              Accès rapide aux fonctionnalités de sourcing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ButtonV2
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() =>
                  router.push('/produits/sourcing/produits/create')
                }
              >
                <div className="flex flex-col items-center">
                  <Plus className="h-6 w-6 mb-2" />
                  <span>Nouveau Sourcing</span>
                </div>
              </ButtonV2>

              <ButtonV2
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/produits/sourcing/echantillons')}
              >
                <div className="flex flex-col items-center">
                  <Eye className="h-6 w-6 mb-2" />
                  <span>Échantillons</span>
                </div>
              </ButtonV2>

              <ButtonV2
                variant="outline"
                className="h-20 border-black text-black hover:bg-black hover:text-white"
                onClick={() => router.push('/produits/sourcing/produits')}
              >
                <div className="flex flex-col items-center">
                  <Package className="h-6 w-6 mb-2" />
                  <span>Produits Sourcing</span>
                </div>
              </ButtonV2>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="text-black">Activité Récente</CardTitle>
            <CardDescription>
              Dernières actions de sourcing et validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded"
                >
                  <div className="flex items-center space-x-3">
                    {getActivityIcon(activity.type)}
                    <div>
                      <p className="font-medium text-black">{activity.title}</p>
                      <p className="text-sm text-gray-600">
                        Client: {activity.client}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(activity.status)}
                    <span className="text-xs text-gray-500">
                      {activity.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions Prioritaires - 100% Données Réelles */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Prochaines Actions</CardTitle>
              <CardDescription>
                Tâches prioritaires (données réelles)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-black" />
                  <span className="text-sm">
                    {sourcingLoading ? '...' : stats.pendingValidation} produits
                    en attente de validation
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    {sourcingLoading ? '...' : stats.samplesOrdered}{' '}
                    échantillons commandés
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    {sourcingLoading
                      ? '...'
                      : sourcingProducts?.filter(
                          p => p.sourcing_type === 'client'
                        ).length || 0}{' '}
                    demandes clients
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
