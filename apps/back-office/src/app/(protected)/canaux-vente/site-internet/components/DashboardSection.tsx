'use client';

import {
  ShoppingBag,
  Package,
  FileText,
  Tag,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

import { useSiteInternetCollections } from '../hooks/use-site-internet-collections';
import { useSiteInternetDashboard } from '../hooks/use-site-internet-dashboard';
import { useSiteInternetProducts } from '../hooks/use-site-internet-products';

interface DashboardSectionProps {
  onNavigate: (tab: string) => void;
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? '+' : ''}
      {value}%
    </span>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DashboardSection({ onNavigate }: DashboardSectionProps) {
  const { data: products } = useSiteInternetProducts();
  const { data: collections } = useSiteInternetCollections();
  const { kpis, isLoading } = useSiteInternetDashboard();

  const publishedCount = products?.filter(p => p.is_published).length ?? 0;
  const totalCount = products?.length ?? 0;
  const unpublishedCount = totalCount - publishedCount;
  const activeCollections = collections?.filter(c => c.is_active).length ?? 0;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Produits publies
          </p>
          <p className="text-2xl font-bold text-gray-900">{publishedCount}</p>
          <p className="text-xs text-gray-400">sur {totalCount} au catalogue</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Collections
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {activeCollections}
          </p>
          <p className="text-xs text-gray-400">actives sur le site</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Commandes site
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-green-600">
              {isLoading ? '...' : (kpis?.ordersThisMonth ?? 0)}
            </p>
            {!isLoading && kpis && <TrendBadge value={kpis.ordersTrend} />}
          </div>
          <p className="text-xs text-gray-400">ce mois</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            CA site
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-purple-600">
              {isLoading ? '...' : formatCurrency(kpis?.revenueThisMonth ?? 0)}
            </p>
            {!isLoading && kpis && <TrendBadge value={kpis.revenueTrend} />}
          </div>
          <p className="text-xs text-gray-400">ce mois</p>
        </div>
      </div>

      {/* A traiter */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-semibold text-amber-900">
            A traiter
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          <button
            onClick={() => onNavigate('produits')}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-sm text-gray-900">
                <strong>{unpublishedCount}</strong> produits non publies sur le
                site
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
          </button>
          <button
            onClick={() => onNavigate('avis')}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-900">
                <strong>
                  {isLoading ? '...' : (kpis?.reviewsPending ?? 0)}
                </strong>{' '}
                avis en attente de moderation
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
          </button>
          {(kpis?.ordersPending ?? 0) > 0 && (
            <button
              onClick={() => onNavigate('commandes')}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-sm text-gray-900">
                  <strong>{kpis?.ordersPending}</strong> commandes en attente
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => onNavigate('config')}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-900">
                Configurer le domaine et le SEO
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Grille 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QuickCard
          icon={<ShoppingBag className="h-5 w-5 text-blue-600" />}
          title="Catalogue"
          onManage={() => onNavigate('produits')}
          items={[
            { label: `${publishedCount} produits publies`, tab: 'produits' },
            {
              label: `${activeCollections} collections actives`,
              tab: 'collections',
            },
            { label: 'Categories et taxonomie', tab: 'categories' },
          ]}
          onNavigate={onNavigate}
        />
        <QuickCard
          icon={<Package className="h-5 w-5 text-green-600" />}
          title="Commerce"
          onManage={() => onNavigate('commandes')}
          items={[
            { label: 'Commandes du site', tab: 'commandes' },
            { label: 'Clients du site', tab: 'clients' },
          ]}
          onNavigate={onNavigate}
        />
        <QuickCard
          icon={<FileText className="h-5 w-5 text-orange-600" />}
          title="Contenu & SEO"
          onManage={() => onNavigate('contenu')}
          items={[
            { label: 'Pages CMS', tab: 'contenu' },
            { label: 'Avis clients', tab: 'avis' },
          ]}
          onNavigate={onNavigate}
        />
        <QuickCard
          icon={<Tag className="h-5 w-5 text-purple-600" />}
          title="Promotions"
          onManage={() => onNavigate('promos')}
          items={[
            { label: 'Codes promo et reductions', tab: 'promos' },
            { label: 'Configuration site', tab: 'config' },
          ]}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

function QuickCard({
  icon,
  title,
  onManage,
  items,
  onNavigate,
}: {
  icon: React.ReactNode;
  title: string;
  onManage: () => void;
  items: Array<{ label: string; tab: string }>;
  onNavigate: (tab: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        <button
          onClick={onManage}
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          Gerer →
        </button>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <button
            key={item.tab + item.label}
            onClick={() => onNavigate(item.tab)}
            className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
          >
            <span>{item.label}</span>
            <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
