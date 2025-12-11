'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import {
  Activity,
  Eye,
  ShoppingCart,
  TrendingUp,
  Euro,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

import {
  useTrackingStats,
  useTrackingKPIs,
  useRecentConversions,
  type SelectionStats,
  type RecentConversion,
} from '../../hooks/use-tracking-stats';

// ============================================================================
// Helpers
// ============================================================================

function formatPrice(amount: number): string {
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
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ============================================================================
// KPI Card
// ============================================================================

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
  isLoading?: boolean;
}

function KPICard({
  title,
  value,
  change,
  icon,
  iconBg,
  isLoading,
}: KPICardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div
                className={`flex items-center gap-1 text-xs font-medium ${
                  change >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {change >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {change >= 0 ? '+' : ''}
                {change}% vs mois dernier
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Selection Stats Row
// ============================================================================

interface SelectionRowProps {
  selection: SelectionStats;
}

function SelectionRow({ selection }: SelectionRowProps) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {selection.name}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate">
          {selection.affiliate_name} • {selection.products_count} produits
        </p>
      </div>
      <div className="flex items-center gap-6 shrink-0 text-right">
        <div>
          <p className="text-xs text-gray-500">Vues</p>
          <p className="text-sm font-semibold text-gray-900">
            {selection.views_count.toLocaleString('fr-FR')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Commandes</p>
          <p className="text-sm font-semibold text-emerald-600">
            {selection.orders_count}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">CA</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatPrice(selection.total_revenue)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Conversion</p>
          <p
            className={`text-sm font-semibold ${
              selection.conversion_rate >= 5
                ? 'text-emerald-600'
                : selection.conversion_rate >= 2
                  ? 'text-amber-600'
                  : 'text-gray-600'
            }`}
          >
            {selection.conversion_rate}%
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Conversion Row
// ============================================================================

interface ConversionRowProps {
  conversion: RecentConversion;
}

function ConversionRow({ conversion }: ConversionRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="p-2 rounded-lg bg-emerald-100">
        <ShoppingCart className="h-4 w-4 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {conversion.order_number}
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700">
            Conversion
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate">
          {conversion.selection_name} • {conversion.affiliate_name}
        </p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {formatPrice(conversion.order_amount_ht)}
          </p>
          <p className="text-xs text-emerald-600">
            +{formatPrice(conversion.affiliate_commission)} commission
          </p>
        </div>
        <div className="text-xs text-gray-400">
          {formatRelativeTime(conversion.created_at)}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function TrackingPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useTrackingStats();
  const {
    data: kpis,
    isLoading: kpisLoading,
    refetch: refetchKpis,
  } = useTrackingKPIs();
  const {
    data: conversions,
    isLoading: conversionsLoading,
    refetch: refetchConversions,
  } = useRecentConversions(10);

  const handleRefresh = () => {
    refetchStats();
    refetchKpis();
    refetchConversions();
  };

  const isLoading = statsLoading || kpisLoading || conversionsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tracking</h1>
          <p className="text-sm text-gray-500">
            Suivi des vues et conversions des sélections LinkMe
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Vues totales"
          value={kpis?.total_views.toLocaleString('fr-FR') || '0'}
          icon={<Eye className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
          isLoading={kpisLoading}
        />
        <KPICard
          title="Commandes"
          value={kpis?.total_orders || 0}
          icon={<ShoppingCart className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-100"
          isLoading={kpisLoading}
        />
        <KPICard
          title="Chiffre d'affaires"
          value={formatPrice(kpis?.total_revenue || 0)}
          icon={<Euro className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-100"
          isLoading={kpisLoading}
        />
        <KPICard
          title="Taux conversion"
          value={`${kpis?.avg_conversion_rate || 0}%`}
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-100"
          isLoading={kpisLoading}
        />
      </div>

      {/* Selection Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Performance par sélection</CardTitle>
              <CardDescription>
                Statistiques de vues et conversions pour chaque sélection
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : stats && stats.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {stats.map(selection => (
                <SelectionRow key={selection.id} selection={selection} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune sélection active</p>
              <p className="text-sm text-gray-400">
                Les statistiques apparaîtront ici quand des sélections seront
                créées
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Conversions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Dernières conversions</CardTitle>
              <CardDescription>
                Commandes récentes générées via LinkMe
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {conversionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : conversions && conversions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {conversions.map(conversion => (
                <ConversionRow key={conversion.id} conversion={conversion} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune conversion récente</p>
              <p className="text-sm text-gray-400">
                Les conversions apparaîtront ici quand des commandes seront
                validées
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Tracking automatique</p>
          <p className="text-blue-700 mt-1">
            Les vues sont comptabilisées automatiquement quand un visiteur
            consulte une sélection. Les conversions (commandes) sont
            enregistrées quand une commande LinkMe est validée. Ces données
            proviennent directement de la base de données.
          </p>
        </div>
      </div>
    </div>
  );
}
