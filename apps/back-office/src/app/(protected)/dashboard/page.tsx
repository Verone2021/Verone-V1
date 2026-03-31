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

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Building2,
  Truck,
  BarChart3,
  Warehouse,
} from 'lucide-react';

// New Components
import { CompactKPIGrid } from './components/compact-kpi-grid';
import { DashboardSection } from './components/dashboard-section';
import { QuickActionsBar } from './components/quick-actions-bar';
import { TopProductsWidget } from './components/top-products-widget';

// Legacy Components (reused)
import { DashboardHeader } from './components/dashboard-header';
import { AlertesWidget } from './components/alertes-widget';
import { ActivityWidget } from './components/activity-widget';
import { RoadmapWidgetWrapper } from './components/roadmap-widget-wrapper';

// Actions
import {
  getDashboardMetrics,
  type DashboardMetrics,
} from './actions/get-dashboard-metrics';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void getDashboardMetrics()
      .then(setData)
      .catch(error => {
        console.error('[DashboardPage] getDashboardMetrics failed:', error);
      })
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

  // Hero KPIs (4 essential metrics — all clickable)
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
      onClick: () => router.push('/commandes/clients'),
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
      onClick: () => router.push('/stocks'),
    },
    {
      title: 'CA 30 derniers jours',
      value: formatRevenue(data.hero.revenue30Days),
      icon: DollarSign,
      color: 'success' as const,
      description: 'Commandes livrées',
      onClick: () => router.push('/ventes'),
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
      onClick: () => router.push('/consultations'),
    },
  ];

  // Quick Actions (7 essential actions)
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
      id: 'new-organisation',
      label: 'Créer Organisation',
      icon: Building2,
      href: '/contacts-organisations/nouveau?type=organisation',
    },
    {
      id: 'new-supplier-order',
      label: 'Commande Fournisseur',
      icon: Truck,
      href: '/commandes/fournisseurs',
    },
    {
      id: 'new-invoice',
      label: 'Nouvelle Facture',
      icon: FileText,
      href: '/factures',
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
      title: 'Commandes LinkMe actives',
      value: data.sales.ordersLinkme,
      icon: Link2,
      color: 'accent' as const,
      description:
        data.sales.ordersLinkme > 0
          ? `${data.sales.ordersLinkme} commande${data.sales.ordersLinkme > 1 ? 's' : ''} en cours`
          : 'Aucune commande active',
      onClick: () => router.push('/canaux-vente/linkme/commandes'),
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
      onClick: () => router.push('/canaux-vente/linkme/commissions'),
    },
    {
      title: 'Marge brute moy.',
      value:
        data.sales.avgMarginPct !== null ? `${data.sales.avgMarginPct}%` : '-',
      icon: BarChart3,
      color:
        data.sales.avgMarginPct !== null && data.sales.avgMarginPct >= 35
          ? ('success' as const)
          : ('warning' as const),
      description: 'Sur les ventes du mois',
    },
  ];

  // Revenue by channel KPIs
  const channelKPIs = data.sales.revenueByChannel.map(ch => ({
    title: ch.channel,
    value: formatRevenue(ch.revenueTtc),
    icon:
      ch.channel === 'LinkMe'
        ? Link2
        : ch.channel === 'Site Internet'
          ? ShoppingCart
          : TrendingUp,
    color: 'primary' as const,
    description: `${ch.orders} commande${ch.orders > 1 ? 's' : ''} · ${formatRevenue(ch.revenueHt)} HT`,
    onClick: () => router.push('/ventes'),
  }));

  // Stock section KPIs
  const stockKPIs = [
    {
      title: 'Valeur Stock',
      value: formatRevenue(data.stock.stockValue),
      icon: Warehouse,
      color: 'primary' as const,
      description: `${data.stock.totalUnits.toLocaleString('fr-FR')} unités en stock`,
      onClick: () => router.push('/stocks'),
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
      onClick: () => router.push('/stocks'),
    },
    {
      title: 'Mouvements 30j',
      value: data.stock.movements30d,
      icon: TrendingUp,
      color: 'accent' as const,
      description: `${data.stock.alerts.length} alerte${data.stock.alerts.length > 1 ? 's' : ''} active${data.stock.alerts.length > 1 ? 's' : ''}`,
      onClick: () => router.push('/stocks'),
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
          defaultOpen
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
          {channelKPIs.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-neutral-500 mt-4 mb-2">
                CA par canal (30j)
              </h4>
              <CompactKPIGrid kpis={channelKPIs} />
            </>
          )}
          <Suspense fallback={<WidgetSkeleton />}>
            <TopProductsWidget products={data.sales.topProducts} />
          </Suspense>
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
