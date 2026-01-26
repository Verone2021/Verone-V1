/**
 * Dashboard Page - Modern Minimalist Version 2026
 * Professional CRM/ERP dashboard inspired by Salesforce, HubSpot
 *
 * Architecture (3 Zones):
 * - Zone 1: Hero Section (4 essential KPIs, always visible)
 * - Zone 2: Collapsible Sections (Sales, Stock, Finance, Activity)
 * - Zone 3: Dynamic Widgets (Roadmap)
 *
 * Design Principles:
 * - Minimalism: Maximum 4-5 KPIs in hero section
 * - Progressive disclosure: Collapsible sections for secondary metrics
 * - Modern aesthetics: Gradients, hover effects, smooth animations
 * - White space: Generous spacing (gap-6)
 *
 * Performance:
 * - Cached data (1 minute TTL)
 * - Client Component for interactivity (icons, collapsible sections)
 * - Data fetching via server action
 *
 * @see CLAUDE.md - Dashboard section
 * @see .tasks/plans/dashboard-refonte-design-moderne.md
 */

'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { Separator } from '@verone/ui/components/ui/separator';
import { Skeleton } from '@verone/ui/components/ui/skeleton';
import {
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  MessageCircle,
  Link2,
  Package,
  PackageX,
  TrendingUp,
  Plus,
  Users,
  FileText,
  Bell,
} from 'lucide-react';

// New Components
import { CompactKPIGrid } from './components/compact-kpi-grid';
import { DashboardSection } from './components/dashboard-section';
import { QuickActionsBar } from './components/quick-actions-bar';

// Legacy Components (reused)
import { DashboardHeader } from './components/dashboard-header';
import { KPIsGrid } from './components/kpis-grid';
import { AlertesWidget } from './components/alertes-widget';
import { ActivityWidget } from './components/activity-widget';
import { RoadmapWidgetWrapper } from './components/roadmap-widget-wrapper';

// Actions
import { getDashboardMetrics, type DashboardMetrics } from './actions/get-dashboard-metrics';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDashboardMetrics()
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <DashboardHeader />
        <HeroKPISkeleton />
      </div>
    );
  }

  // Format revenue for display (EUR with thousands separator)
  const formatRevenue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Hero KPIs (4 essential metrics)
  const heroKPIs = [
    {
      title: 'Commandes en attente',
      value: data.hero.ordersPending,
      icon: ShoppingCart,
      color: 'warning' as const,
      description:
        data.hero.ordersPending > 0
          ? `${data.hero.ordersPending} commande${data.hero.ordersPending > 1 ? 's' : ''} à traiter`
          : 'Toutes traitées',
    },
    {
      title: 'Alertes Stock Critiques',
      value: data.hero.stockAlerts,
      icon: AlertTriangle,
      color: 'danger' as const,
      description:
        data.hero.stockAlerts > 0
          ? `${data.hero.stockAlerts} alerte${data.hero.stockAlerts > 1 ? 's' : ''} urgente${data.hero.stockAlerts > 1 ? 's' : ''}`
          : 'Stock OK',
    },
    {
      title: 'CA 30 derniers jours',
      value: formatRevenue(data.hero.revenue30Days),
      icon: DollarSign,
      color: 'success' as const,
      description: 'Commandes livrées',
    },
    {
      title: 'Consultations actives',
      value: data.hero.consultations,
      icon: MessageCircle,
      color: 'accent' as const,
      description:
        data.hero.consultations > 0
          ? `${data.hero.consultations} RFQ en cours`
          : 'Aucune consultation',
    },
  ];

  // Quick Actions (4 essential actions)
  const quickActions = [
    {
      id: 'new-product',
      label: 'Nouveau Produit',
      icon: Plus,
      href: '/produits/catalogue/nouveau',
    },
    {
      id: 'new-order',
      label: 'Nouvelle Commande',
      icon: ShoppingCart,
      href: '/commandes/clients/nouvelle',
    },
    {
      id: 'new-contact',
      label: 'Créer Contact',
      icon: Users,
      href: '/contacts-organisations/nouveau',
    },
    {
      id: 'view-alerts',
      label: 'Voir Alertes',
      icon: Bell,
      href: '/stocks/alertes',
      variant: 'secondary' as const,
    },
  ];

  // Sales section KPIs
  const salesKPIs = [
    {
      title: 'Commandes LinkMe',
      value: data.sales.ordersLinkme,
      icon: Link2,
      color: 'accent' as const,
      description:
        data.sales.ordersLinkme > 0
          ? `${data.sales.ordersLinkme} commande${data.sales.ordersLinkme > 1 ? 's' : ''} affilié${data.sales.ordersLinkme > 1 ? 's' : ''}`
          : 'Aucune commande',
    },
    {
      title: 'Commissions Pending',
      value: data.sales.commissions,
      icon: DollarSign,
      color: 'warning' as const,
      description:
        data.sales.commissions > 0
          ? `${data.sales.commissions} commission${data.sales.commissions > 1 ? 's' : ''} à valider`
          : 'Toutes validées',
    },
    {
      title: 'Total CA 30j',
      value: formatRevenue(data.finance.revenue30Days),
      icon: TrendingUp,
      color: 'success' as const,
      description: 'Revenus livrés',
    },
  ];

  // Stock section KPIs
  const stockKPIs = [
    {
      title: 'Produits Catalogue',
      value: data.stock.products.total,
      icon: Package,
      color: 'primary' as const,
      description:
        data.stock.products.new_month > 0
          ? `+${data.stock.products.new_month} ce mois`
          : 'Catalogue stable',
    },
    {
      title: 'Rupture de Stock',
      value: data.stock.outOfStock,
      icon: PackageX,
      color: 'danger' as const,
      description:
        data.stock.outOfStock > 0
          ? `${data.stock.outOfStock} produit${data.stock.outOfStock > 1 ? 's' : ''} à réapprovisionner`
          : 'Stock OK',
    },
    {
      title: 'Alertes Critiques',
      value: data.hero.stockAlerts,
      icon: AlertTriangle,
      color: 'danger' as const,
      description: `${data.stock.alerts.length} alerte${data.stock.alerts.length > 1 ? 's' : ''} active${data.stock.alerts.length > 1 ? 's' : ''}`,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ZONE 1: Hero Section (Always Visible) */}
      <DashboardHeader />

      <Suspense fallback={<HeroKPISkeleton />}>
        <CompactKPIGrid kpis={heroKPIs} />
      </Suspense>

      <QuickActionsBar actions={quickActions} />

      <Separator className="my-6" />

      {/* ZONE 2: Collapsible Sections */}
      <div className="space-y-4">
        {/* Sales & Orders Section */}
        <DashboardSection
          title="Ventes & Commandes"
          icon={ShoppingCart}
          defaultOpen={true}
          badge={
            data.hero.ordersPending > 0
              ? {
                  label: `${data.hero.ordersPending} urgentes`,
                  variant: 'warning',
                }
              : undefined
          }
        >
          <CompactKPIGrid kpis={salesKPIs} />
          {/* TODO: Add RevenueChart here when available */}
        </DashboardSection>

        {/* Stock & Inventory Section */}
        <DashboardSection
          title="Stock & Inventaire"
          icon={Package}
          badge={
            data.hero.stockAlerts > 0
              ? {
                  label: `${data.hero.stockAlerts} alertes`,
                  variant: 'danger',
                }
              : undefined
          }
        >
          <CompactKPIGrid kpis={stockKPIs} />
          <Suspense fallback={<WidgetSkeleton />}>
            <AlertesWidget alerts={data.stock.alerts} />
          </Suspense>
        </DashboardSection>

        {/* Activity Section */}
        <DashboardSection
          title="Activité Récente"
          icon={FileText}
          defaultOpen={false}
        >
          <Suspense fallback={<WidgetSkeleton />}>
            <ActivityWidget orders={data.activity.recentOrders} />
          </Suspense>
        </DashboardSection>
      </div>

      {/* ZONE 3: Dynamic Widgets */}
      <Suspense fallback={<WidgetSkeleton />}>
        <RoadmapWidgetWrapper />
      </Suspense>
    </div>
  );
}

/**
 * Hero KPI Grid Skeleton Loader
 */
function HeroKPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[120px] rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Widget Skeleton Loader
 */
function WidgetSkeleton() {
  return <Skeleton className="h-[300px] rounded-lg" />;
}
