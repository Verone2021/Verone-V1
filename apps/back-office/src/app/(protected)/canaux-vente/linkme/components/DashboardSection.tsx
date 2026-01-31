'use client';

import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Banknote,
  Users,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  FileText,
  UserPlus,
  CreditCard,
  Package,
} from 'lucide-react';

import {
  useLinkMeDashboard,
  useRecentActivity,
  type RecentActivity,
} from '../hooks/use-linkme-dashboard';

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ============================================================================
// KPI Card Component
// ============================================================================

interface KPICardProps {
  title: string;
  value: string;
  subtext: string;
  growth?: number;
  icon: React.ReactNode;
  iconBgColor: string;
}

function KPICard({
  title,
  value,
  subtext,
  growth,
  icon,
  iconBgColor,
}: KPICardProps) {
  const GrowthIcon =
    growth === undefined
      ? null
      : growth > 0
        ? TrendingUp
        : growth < 0
          ? TrendingDown
          : Minus;

  const growthColor =
    growth === undefined
      ? ''
      : growth > 0
        ? 'text-emerald-600'
        : growth < 0
          ? 'text-red-500'
          : 'text-gray-500';

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <div className="flex items-center gap-1.5">
              {growth !== undefined && GrowthIcon && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${growthColor}`}
                >
                  <GrowthIcon className="h-3 w-3" />
                  {growth > 0 ? '+' : ''}
                  {growth}%
                </span>
              )}
              <span className="text-xs text-gray-500">{subtext}</span>
            </div>
          </div>
          <div className={`p-2 rounded-lg ${iconBgColor}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Activity Item Component
// ============================================================================

interface ActivityItemProps {
  activity: RecentActivity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const iconMap = {
    order: <ShoppingCart className="h-3 w-3 text-purple-600" />,
    affiliate: <UserPlus className="h-3 w-3 text-blue-600" />,
    payment: <CreditCard className="h-3 w-3 text-emerald-600" />,
    commission: <DollarSign className="h-3 w-3 text-amber-600" />,
  };

  const bgMap = {
    order: 'bg-purple-100',
    affiliate: 'bg-blue-100',
    payment: 'bg-emerald-100',
    commission: 'bg-amber-100',
  };

  return (
    <div className="flex items-center gap-2 py-2">
      <div className={`p-1.5 rounded ${bgMap[activity.type]}`}>
        {iconMap[activity.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate">
          {activity.title}
        </p>
        <p className="text-[10px] text-gray-500 truncate">
          {activity.description}
        </p>
      </div>
      <div className="text-right shrink-0">
        {activity.amount !== undefined && (
          <p className="text-xs font-semibold text-gray-900">
            {formatCurrency(activity.amount)}
          </p>
        )}
        <p className="text-[10px] text-gray-400">
          {formatRelativeTime(activity.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Quick Action Button
// ============================================================================

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

function QuickAction({ href, icon, label, count }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <div className="p-1.5 bg-gray-100 rounded group-hover:bg-gray-200 transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-900">{label}</p>
        {count !== undefined && count > 0 && (
          <p className="text-[10px] text-gray-500">{count} en attente</p>
        )}
      </div>
      <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
    </Link>
  );
}

// ============================================================================
// Main Dashboard Section
// ============================================================================

export function DashboardSection() {
  const { data: kpis, isLoading: kpisLoading } = useLinkMeDashboard();
  const { data: activities, isLoading: activitiesLoading } =
    useRecentActivity(5);

  // Loading state
  if (kpisLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 4 KPIs Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: CA Généré */}
        <KPICard
          title="CA Généré"
          value={formatCurrency(kpis?.revenue.current ?? 0)}
          subtext="vs moyenne"
          growth={kpis?.revenue.growth}
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          iconBgColor="bg-emerald-100"
        />

        {/* KPI 2: Commissions à payer */}
        <KPICard
          title="Commissions à payer"
          value={formatCurrency(kpis?.pendingCommissions.amount ?? 0)}
          subtext={`${kpis?.pendingCommissions.count ?? 0} demande${(kpis?.pendingCommissions.count ?? 0) > 1 ? 's' : ''}`}
          icon={<Banknote className="h-4 w-4 text-amber-600" />}
          iconBgColor="bg-amber-100"
        />

        {/* KPI 3: Affiliés actifs */}
        <KPICard
          title="Affiliés actifs"
          value={String(kpis?.affiliates.active ?? 0)}
          subtext={`+${kpis?.affiliates.newThisMonth ?? 0} ce mois`}
          icon={<Users className="h-4 w-4 text-blue-600" />}
          iconBgColor="bg-blue-100"
        />

        {/* KPI 4: Commandes ce mois */}
        <KPICard
          title="Commandes ce mois"
          value={String(kpis?.orders.current ?? 0)}
          subtext="vs moyenne"
          growth={kpis?.orders.growth}
          icon={<ShoppingCart className="h-4 w-4 text-purple-600" />}
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Actions rapides + Activité récente */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Actions rapides */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">Actions rapides</CardTitle>
            <CardDescription className="text-xs">
              Accès direct aux tâches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-3">
            <QuickAction
              href="/canaux-vente/linkme/demandes-paiement"
              icon={<Banknote className="h-3.5 w-3.5 text-emerald-600" />}
              label="Demandes de paiement"
              count={kpis?.pendingCommissions.count}
            />
            <QuickAction
              href="/canaux-vente/linkme/utilisateurs"
              icon={<Users className="h-3.5 w-3.5 text-blue-600" />}
              label="Gérer les affiliés"
            />
            <QuickAction
              href="/canaux-vente/linkme/commandes"
              icon={<Package className="h-3.5 w-3.5 text-purple-600" />}
              label="Voir les commandes"
            />
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Activité récente</CardTitle>
                <CardDescription className="text-xs">
                  Dernières actions
                </CardDescription>
              </div>
              <Link
                href="/canaux-vente/linkme/analytics"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {activitiesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !activities || activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <FileText className="h-6 w-6 text-gray-300 mb-1" />
                <p className="text-xs text-gray-500">Aucune activité</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activities.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
