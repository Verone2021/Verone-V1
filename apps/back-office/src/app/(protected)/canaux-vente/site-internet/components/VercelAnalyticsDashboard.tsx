/**
 * Composant: VercelAnalyticsDashboard
 * Dashboard avec métriques Vercel Analytics + KPI produits
 */

'use client';

import { useMemo } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import { Progress } from '@verone/ui';
import {
  BarChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Eye,
  Clock,
  CheckCircle,
  Package,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';

// Hooks
import { useSiteInternetProductsStats } from '../hooks/use-site-internet-products';
import {
  useVercelAnalytics,
  getWebVitalRating,
  formatDuration,
} from '../hooks/use-vercel-analytics';

/**
 * KPI Card Component
 */
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    purple:
      'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    orange:
      'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend && trendValue && (
                <div className="flex items-center gap-1">
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Web Vital Badge
 */
function WebVitalBadge({
  label,
  value,
  unit,
  metric,
}: {
  label: string;
  value: number;
  unit: string;
  metric: 'lcp' | 'fid' | 'cls';
}) {
  const { rating, color: _color } = getWebVitalRating(metric, value);

  const ratingColors = {
    good: 'bg-green-100 text-green-700 border-green-200',
    'needs-improvement': 'bg-orange-100 text-orange-700 border-orange-200',
    poor: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <Badge variant="outline" className={ratingColors[rating]}>
        {rating === 'good'
          ? 'Bon'
          : rating === 'needs-improvement'
            ? 'Moyen'
            : 'Faible'}
      </Badge>
    </div>
  );
}

/**
 * Dashboard Principal
 */
export function VercelAnalyticsDashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useVercelAnalytics();
  const { data: productsStats, isLoading: statsLoading } =
    useSiteInternetProductsStats();

  // Chart data (time series simplifié)
  const chartData = useMemo(() => {
    if (!analytics?.timeSeries) return [];
    return analytics.timeSeries.slice(-7); // 7 derniers jours
  }, [analytics]);

  if (analyticsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-24 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Guard: analytics data must be present
  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune donnée analytics disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Produits Publiés"
          value={productsStats?.published ?? 0}
          subtitle={`sur ${productsStats?.total ?? 0} total`}
          icon={Package}
          color="blue"
        />
        <KPICard
          title="Produits Éligibles"
          value={productsStats?.eligible ?? 0}
          subtitle={`${productsStats?.publishedPercentage.toFixed(0)}% publiés`}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="Visiteurs Uniques"
          value={analytics.uniqueVisitors.toLocaleString()}
          subtitle="30 derniers jours"
          icon={Users}
          trend="up"
          trendValue="+12.5%"
          color="purple"
        />
        <KPICard
          title="Pages Vues"
          value={analytics.pageviews.toLocaleString()}
          subtitle="30 derniers jours"
          icon={Eye}
          trend="up"
          trendValue="+8.3%"
          color="orange"
        />
      </div>

      {/* Section 2: Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Web Vitals - Performance Site
          </CardTitle>
          <CardDescription>
            Métriques de performance Core Web Vitals (Google)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <WebVitalBadge
              label="LCP"
              value={analytics?.lcp ?? 0}
              unit="s"
              metric="lcp"
            />
            <WebVitalBadge
              label="FID"
              value={analytics?.fid ?? 0}
              unit="ms"
              metric="fid"
            />
            <WebVitalBadge
              label="CLS"
              value={analytics?.cls ?? 0}
              unit=""
              metric="cls"
            />
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card">
              <p className="text-xs text-muted-foreground uppercase">TTFB</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {analytics?.ttfb ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">ms</span>
              </div>
              <Badge variant="outline">Time to First Byte</Badge>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card">
              <p className="text-xs text-muted-foreground uppercase">FCP</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {analytics?.fcp ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">s</span>
              </div>
              <Badge variant="outline">First Contentful Paint</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Top Pages + Devices */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Top 5 Pages
            </CardTitle>
            <CardDescription>Pages les plus visitées (30j)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topPages.map((page, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{page.path}</span>
                    <span className="text-muted-foreground">
                      {page.pageviews.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={
                      (page.pageviews /
                        (analytics.topPages[0]?.pageviews || 1)) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Devices Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Répartition Devices
            </CardTitle>
            <CardDescription>Types d'appareils (30j)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mobile */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Mobile</span>
                  </div>
                  <span className="text-muted-foreground">
                    {analytics.devices.mobile.toLocaleString()} (
                    {(
                      (analytics.devices.mobile /
                        (analytics.devices.mobile +
                          analytics.devices.desktop +
                          analytics.devices.tablet)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
                <Progress
                  value={
                    (analytics.devices.mobile /
                      (analytics.devices.mobile +
                        analytics.devices.desktop +
                        analytics.devices.tablet)) *
                    100
                  }
                  className="h-2"
                />
              </div>

              {/* Desktop */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Desktop</span>
                  </div>
                  <span className="text-muted-foreground">
                    {analytics.devices.desktop.toLocaleString()} (
                    {(
                      (analytics.devices.desktop /
                        (analytics.devices.mobile +
                          analytics.devices.desktop +
                          analytics.devices.tablet)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
                <Progress
                  value={
                    (analytics.devices.desktop /
                      (analytics.devices.mobile +
                        analytics.devices.desktop +
                        analytics.devices.tablet)) *
                    100
                  }
                  className="h-2"
                />
              </div>

              {/* Tablet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Tablet className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Tablet</span>
                  </div>
                  <span className="text-muted-foreground">
                    {analytics.devices.tablet.toLocaleString()} (
                    {(
                      (analytics.devices.tablet /
                        (analytics.devices.mobile +
                          analytics.devices.desktop +
                          analytics.devices.tablet)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
                <Progress
                  value={
                    (analytics.devices.tablet /
                      (analytics.devices.mobile +
                        analytics.devices.desktop +
                        analytics.devices.tablet)) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 4: Traffic Trend (7 derniers jours) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Trafic (7 derniers jours)
          </CardTitle>
          <CardDescription>
            Pages vues et visiteurs uniques quotidiens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {/* TODO: Intégrer Recharts ou Chart.js */}
            <div className="text-center">
              <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Graphique trafic (Recharts à intégrer)</p>
              <p className="text-sm mt-2">
                Données disponibles: {chartData.length} jours
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Métriques Engagement */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de Rebond</p>
                <p className="text-3xl font-bold mt-2">
                  {analytics?.bounceRate.toFixed(1)}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durée Moyenne</p>
                <p className="text-3xl font-bold mt-2">
                  {formatDuration(analytics?.avgSessionDuration ?? 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Produits avec Variantes
                </p>
                <p className="text-3xl font-bold mt-2">
                  {productsStats?.withVariants ?? 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
