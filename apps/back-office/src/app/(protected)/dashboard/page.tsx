/**
 * Dashboard Page - Modern Version
 * Comprehensive dashboard with 9 KPIs, 8 Quick Actions, and 2 Widgets
 *
 * Architecture:
 * - Zone 1: Quick Actions (8 buttons, top)
 * - Zone 2: KPIs Grid (9 metrics, center)
 * - Zone 3: Widgets (Stock Alerts + Recent Activity, bottom)
 *
 * @see CLAUDE.md - Dashboard section
 */

import { Suspense } from 'react';
import { Separator } from '@verone/ui/components/ui/separator';
import { Skeleton } from '@verone/ui/components/ui/skeleton';
import { DashboardHeader } from './components/dashboard-header';
import { QuickActionsGrid } from './components/quick-actions-grid';
import { KPIsGrid } from './components/kpis-grid';
import { AlertesWidget } from './components/alertes-widget';
import { ActivityWidget } from './components/activity-widget';
import { getDashboardMetrics } from './actions/get-dashboard-metrics';

export default async function DashboardPage() {
  const data = await getDashboardMetrics();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <DashboardHeader />

      {/* ZONE 1: Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">
          Actions Rapides
        </h2>
        <QuickActionsGrid />
      </section>

      <Separator />

      {/* ZONE 2: KPIs Grid */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">
          Métriques Clés
        </h2>
        <Suspense fallback={<KPIsGridSkeleton />}>
          <KPIsGrid data={data.kpis} />
        </Suspense>
      </section>

      <Separator />

      {/* ZONE 3: Widgets */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">
          Vue d'ensemble
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<WidgetSkeleton />}>
            <AlertesWidget alerts={data.widgets.stockAlerts} />
          </Suspense>
          <Suspense fallback={<WidgetSkeleton />}>
            <ActivityWidget orders={data.widgets.recentOrders} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

/**
 * KPIs Grid Skeleton Loader
 */
function KPIsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="h-[96px] rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Widget Skeleton Loader
 */
function WidgetSkeleton() {
  return <Skeleton className="h-[400px] rounded-lg" />;
}
