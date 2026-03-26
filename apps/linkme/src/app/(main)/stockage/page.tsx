'use client';

/**
 * Page Mon Stockage — LinkMe (Refonte 4 onglets)
 *
 * 4 onglets :
 * - Vue d'ensemble : KPIs + grille tarifaire + produits
 * - Historique mensuel : graphique + table mois par mois
 * - Historique annuel : comparaison année par année
 * - Détail produits : table filtrable avec lignes extensibles
 *
 * @module StockagePage
 * @since 2026-02-25
 */

import { useState, useEffect, Suspense } from 'react';

import { useRouter } from 'next/navigation';
import {
  Warehouse,
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Package,
  RefreshCw,
  AlertCircle,
  Send,
} from 'lucide-react';

import { useAuth, type LinkMeRole } from '@/contexts/AuthContext';
import {
  useAffiliateStorageSummary,
  useAffiliateStorageDetails,
  useStoragePricingTiers,
  useStorageMonthlyHistory,
} from '@/lib/hooks/use-affiliate-storage';

const ALLOWED_ROLES: LinkMeRole[] = ['enseigne_admin', 'organisation_admin'];

import { StorageOverviewTab } from './components/StorageOverviewTab';
import { StorageMonthlyTab } from './components/StorageMonthlyTab';
import { StorageYearlyTab } from './components/StorageYearlyTab';
import { StorageProductsTab } from './components/StorageProductsTab';
import { StorageRequestsTab } from './components/StorageRequestsTab';

// ─── Types ─────────────────────────────────────────────────────────────────────

type StorageTab = 'overview' | 'monthly' | 'yearly' | 'products' | 'requests';

const TABS: { id: StorageTab; label: string; icon: typeof LayoutDashboard }[] =
  [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'monthly', label: 'Mensuel', icon: CalendarDays },
    { id: 'yearly', label: 'Annuel', icon: CalendarRange },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'requests', label: 'Mes demandes', icon: Send },
  ];

// ─── Contenu ──────────────────────────────────────────────────────────────────

function StockageContent(): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, initializing } = useAuth();
  const [activeTab, setActiveTab] = useState<StorageTab>('overview');

  const { data: summary, isLoading: summaryLoading } =
    useAffiliateStorageSummary();
  const { data: products, isLoading: productsLoading } =
    useAffiliateStorageDetails();
  const { data: pricingTiers, isLoading: tiersLoading } =
    useStoragePricingTiers();
  const {
    data: monthlyData,
    isLoading: monthlyLoading,
    error: monthlyError,
  } = useStorageMonthlyHistory(24);

  const isLoading = summaryLoading || productsLoading || tiersLoading;

  useEffect(() => {
    if (!initializing && !user) {
      router.push('/login');
    }
  }, [user, initializing, router]);

  useEffect(() => {
    if (
      !initializing &&
      linkMeRole &&
      !ALLOWED_ROLES.includes(linkMeRole.role)
    ) {
      router.push('/dashboard');
    }
  }, [linkMeRole, initializing, router]);

  if (!user || (linkMeRole && !ALLOWED_ROLES.includes(linkMeRole.role))) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#5DBEBB] to-[#3976BB] rounded-lg shadow-lg">
            <Warehouse className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#183559]">Mon Stockage</h1>
            <p className="text-gray-500 text-sm">
              Suivi de vos produits stockés et historique
            </p>
          </div>
        </div>

        {/* Erreur */}
        {monthlyError && (
          <div className="p-3 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-800">
                Erreur de chargement historique :{' '}
                {monthlyError instanceof Error
                  ? monthlyError.message
                  : 'Erreur inconnue'}
              </p>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1" aria-label="Onglets stockage">
            {TABS.map(tab => {
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
        {activeTab === 'overview' && (
          <StorageOverviewTab
            summary={summary}
            products={products}
            pricingTiers={pricingTiers}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'monthly' && (
          <StorageMonthlyTab
            monthlyData={monthlyData}
            pricingTiers={pricingTiers}
            isLoading={monthlyLoading}
          />
        )}
        {activeTab === 'yearly' && (
          <StorageYearlyTab
            monthlyData={monthlyData}
            pricingTiers={pricingTiers}
            isLoading={monthlyLoading}
          />
        )}
        {activeTab === 'products' && (
          <StorageProductsTab
            products={products}
            pricingTiers={pricingTiers}
            monthlyData={monthlyData}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'requests' && <StorageRequestsTab />}

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

export default function StockagePage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[#5DBEBB]" />
        </div>
      }
    >
      <StockageContent />
    </Suspense>
  );
}
