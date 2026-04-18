'use client';

/**
 * Page Statistiques — 4 onglets : Commandes, Commissions, Produits, Sélections
 *
 * Source de données unique : useAffiliateAnalytics
 * Chaque onglet réutilise les composants analytics existants
 *
 * @module StatistiquesPage
 * @since 2026-02-25
 */

import { useState, Suspense } from 'react';

import { Card } from '@tremor/react';
import {
  BarChart3,
  RefreshCw,
  AlertCircle,
  Filter,
  Calendar,
  ShoppingCart,
  Coins,
  Package,
  Star,
} from 'lucide-react';

import { useAffiliateAnalytics } from '@/lib/hooks/use-affiliate-analytics';
import { usePermissions } from '@/hooks/use-permissions';
import type { AnalyticsPeriod } from '@/types/analytics';

import { StatsCommissionsTab } from './components/StatsCommissionsTab';
import { StatsOrdersTab } from './components/StatsOrdersTab';
import { StatsProductsTab } from './components/StatsProductsTab';
import { StatsSelectionsTab } from './components/StatsSelectionsTab';

// ─── Types ─────────────────────────────────────────────────────────────────────

type FilterPreset =
  | 'all'
  | 'this_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

type StatsTab = 'orders' | 'commissions' | 'products' | 'selections';

interface PeriodFilter {
  preset: FilterPreset;
  startDate?: Date;
  endDate?: Date;
}

const PRESET_TO_PERIOD: Record<FilterPreset, AnalyticsPeriod> = {
  all: 'all',
  this_month: 'month',
  this_quarter: 'quarter',
  this_year: 'year',
  custom: 'year',
};

const ALL_TABS: {
  id: StatsTab;
  label: string;
  icon: typeof ShoppingCart;
  permission?: 'viewCommissions' | 'manageSelections';
}[] = [
  { id: 'orders', label: 'Commandes', icon: ShoppingCart },
  {
    id: 'commissions',
    label: 'Commissions',
    icon: Coins,
    permission: 'viewCommissions',
  },
  { id: 'products', label: 'Produits', icon: Package },
  {
    id: 'selections',
    label: 'Sélections',
    icon: Star,
    permission: 'manageSelections',
  },
];

// ─── Contenu ──────────────────────────────────────────────────────────────────

function StatistiquesContent(): JSX.Element {
  const [filter, setFilter] = useState<PeriodFilter>({ preset: 'all' });
  const [activeTab, setActiveTab] = useState<StatsTab>('orders');
  const { can, canViewCommissions } = usePermissions();

  const tabs = ALL_TABS.filter(tab => !tab.permission || can(tab.permission));

  const apiPeriod = PRESET_TO_PERIOD[filter.preset];
  const { data, isLoading, error, refetch } = useAffiliateAnalytics(apiPeriod);

  const formatDateInput = (date: Date): string =>
    date.toISOString().split('T')[0];

  const handlePresetChange = (preset: FilterPreset): void => {
    if (preset === 'custom') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      setFilter({ preset: 'custom', startDate, endDate });
    } else {
      setFilter({ preset });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#5DBEBB] to-[#3976BB] rounded-lg shadow-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#183559]">Statistiques</h1>
            <p className="text-gray-500 text-sm">
              {canViewCommissions
                ? 'Performances commandes, commissions et produits'
                : 'Performances commandes et produits'}
            </p>
          </div>
        </div>

        {/* Filtres période */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Période :</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  'all',
                  'this_month',
                  'this_quarter',
                  'this_year',
                ] as FilterPreset[]
              ).map(preset => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter.preset === preset
                      ? 'bg-[#5DBEBB] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {preset === 'all' && 'Tout'}
                  {preset === 'this_month' && 'Ce mois'}
                  {preset === 'this_quarter' && 'Ce trimestre'}
                  {preset === 'this_year' && 'Cette année'}
                </button>
              ))}
              <button
                onClick={() => handlePresetChange('custom')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  filter.preset === 'custom'
                    ? 'bg-[#5DBEBB] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Personnalisé
              </button>
            </div>

            {filter.preset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={
                    filter.startDate ? formatDateInput(filter.startDate) : ''
                  }
                  onChange={e =>
                    setFilter(f => ({
                      ...f,
                      startDate: new Date(e.target.value),
                    }))
                  }
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5DBEBB] focus:border-transparent"
                />
                <span className="text-gray-400">&rarr;</span>
                <input
                  type="date"
                  value={filter.endDate ? formatDateInput(filter.endDate) : ''}
                  onChange={e =>
                    setFilter(f => ({
                      ...f,
                      endDate: new Date(e.target.value),
                    }))
                  }
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5DBEBB] focus:border-transparent"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Erreur */}
        {error && (
          <Card className="p-3 border-l-4 border-red-500 bg-red-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="font-medium text-red-800 text-sm">
                  Erreur de chargement
                </p>
                <p className="text-xs text-red-600">{error.message}</p>
              </div>
              <button
                onClick={() => {
                  void refetch().catch(err => {
                    console.error('[Statistiques] Refetch failed:', err);
                  });
                }}
                className="ml-auto px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
              >
                Réessayer
              </button>
            </div>
          </Card>
        )}

        {/* Onglets */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav
            className="flex gap-1 min-w-max"
            aria-label="Onglets statistiques"
          >
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-[#5DBEBB] text-[#183559]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`h-4 w-4 ${isActive ? 'text-[#5DBEBB]' : ''}`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu onglet */}
        {activeTab === 'orders' && (
          <StatsOrdersTab data={data} isLoading={isLoading} />
        )}
        {activeTab === 'commissions' && (
          <StatsCommissionsTab data={data} isLoading={isLoading} />
        )}
        {activeTab === 'products' && (
          <StatsProductsTab data={data} isLoading={isLoading} />
        )}
        {activeTab === 'selections' && (
          <StatsSelectionsTab data={data} isLoading={isLoading} />
        )}

        <div className="text-center text-xs text-gray-400 pb-2">
          <p suppressHydrationWarning>
            Données actualisées en temps réel · Dernière mise à jour :{' '}
            {new Date().toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────

export default function StatistiquesPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[#5DBEBB]" />
        </div>
      }
    >
      <StatistiquesContent />
    </Suspense>
  );
}
