'use client';

import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  Users,
  Layers,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface DashboardStats {
  totalAffiliates: number;
  activeAffiliates: number;
  pendingAffiliates: number;
  totalSelections: number;
  activeSelections: number;
  totalOrders: number;
  totalRevenue: number;
  pendingCommissions: number;
  paidCommissions: number;
}

/**
 * Dashboard Section - KPIs LinkMe
 *
 * Affiche:
 * - Affiliés actifs, en attente, total
 * - Sélections publiées
 * - Commandes via LinkMe
 * - CA généré
 * - Commissions en attente vs payées
 */
export function DashboardSection() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      try {
        // Fetch affiliates stats
        const { data: affiliates } = await (supabase as any)
          .from('linkme_affiliates')
          .select('id, status');

        const totalAffiliates = affiliates?.length || 0;
        const activeAffiliates =
          affiliates?.filter(a => a.status === 'active').length || 0;
        const pendingAffiliates =
          affiliates?.filter(a => a.status === 'pending').length || 0;

        // Fetch selections stats
        const { data: selections } = await (supabase as any)
          .from('linkme_selections')
          .select('id, status');

        const totalSelections = selections?.length || 0;
        const activeSelections =
          selections?.filter(s => s.status === 'active').length || 0;

        // Fetch commissions stats
        const { data: commissions } = await (supabase as any)
          .from('linkme_commissions')
          .select('id, status, order_amount_ht, affiliate_commission');

        const totalOrders = commissions?.length || 0;
        const totalRevenue =
          commissions?.reduce((sum, c) => sum + Number(c.order_amount_ht), 0) ||
          0;
        const pendingCommissions =
          commissions
            ?.filter(c => c.status === 'pending')
            .reduce((sum, c) => sum + Number(c.affiliate_commission), 0) || 0;
        const paidCommissions =
          commissions
            ?.filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + Number(c.affiliate_commission), 0) || 0;

        setStats({
          totalAffiliates,
          activeAffiliates,
          pendingAffiliates,
          totalSelections,
          activeSelections,
          totalOrders,
          totalRevenue,
          pendingCommissions,
          paidCommissions,
        });
      } catch (error) {
        console.error('Error fetching LinkMe stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Affiliés Actifs',
      value: stats?.activeAffiliates || 0,
      description: `${stats?.totalAffiliates || 0} total`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'En Attente Validation',
      value: stats?.pendingAffiliates || 0,
      description: 'Demandes à traiter',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Sélections Actives',
      value: stats?.activeSelections || 0,
      description: `${stats?.totalSelections || 0} total`,
      icon: Layers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Commandes LinkMe',
      value: stats?.totalOrders || 0,
      description: 'Toutes commandes',
      icon: ShoppingBag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'CA Généré',
      value: `${(stats?.totalRevenue || 0).toLocaleString('fr-FR')} €`,
      description: "Chiffre d'affaires HT",
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Commissions en Attente',
      value: `${(stats?.pendingCommissions || 0).toLocaleString('fr-FR')} €`,
      description: 'À valider/payer',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Commissions Payées',
      value: `${(stats?.paidCommissions || 0).toLocaleString('fr-FR')} €`,
      description: 'Total versé',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <div className={`p-2 rounded-full ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder pour graphiques futurs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Commandes</CardTitle>
            <CardDescription>
              Commandes et commissions sur les 30 derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Graphique à venir
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Affiliés</CardTitle>
            <CardDescription>Meilleurs apporteurs ce mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              {stats?.totalAffiliates === 0
                ? 'Aucun affilié pour le moment'
                : 'Classement à venir'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
