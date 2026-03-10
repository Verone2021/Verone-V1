'use client';

/**
 * Page: Mes Commandes
 * Dashboard affilié avec KPIs, pagination server-side et filtre année
 *
 * KPIs:
 * - Commandes, CA TTC, Panier Moyen : depuis useMonthlyKPIs (query directe RLS-aware)
 * - Commissions TTC : depuis useAffiliateCommissionStats (source de vérité)
 *
 * @module CommandesPage
 * @since 2025-12-19
 * @updated 2026-02-25 - Pagination server-side, filtre année, KPIs corrigés
 */

import { useState, useCallback } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  useMonthlyKPIs,
  formatVariation as _formatVariation,
  getVariationColor as _getVariationColor,
} from '@verone/orders/hooks/use-monthly-kpis';
import {
  Loader2,
  Plus,
  Package,
  TrendingUp,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  User,
  MapPin,
  Wallet,
  Pencil,
  Calendar,
} from 'lucide-react';

import { KPICard } from '../../../components/dashboard/KPICard';
import { PageTourTrigger } from '../../../components/onboarding/PageTourTrigger';
import { HelpTooltip } from '../../../components/ui/help-tooltip';
import { OrderDetailModal } from './components/OrderDetailModal';
import {
  useLinkMeOrders,
  type LinkMeOrder,
} from '../../../hooks/use-linkme-orders';
import { useAffiliateCommissionStats } from '../../../lib/hooks/use-affiliate-commission-stats';

// Mapping des statuts DB → Labels
const STATUS_LABELS: Record<string, string> = {
  draft: 'En attente de validation',
  validated: 'Validée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  partially_shipped: 'Expédition partielle',
};

// Couleurs des statuts
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-amber-100', text: 'text-amber-700' },
  validated: { bg: 'bg-blue-100', text: 'text-blue-700' },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-700' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
  partially_shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
};

// Onglets alignes avec Back-Office
type TabType =
  | 'all'
  | 'pending_approval'
  | 'draft'
  | 'validated'
  | 'shipped'
  | 'cancelled';

const ITEMS_PER_PAGE = 20;

// Available years for filter
const YEAR_OPTIONS = [
  { value: 'all', label: 'Toutes les années' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
];

export default function CommandesPage(): JSX.Element {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [page, setPage] = useState(0);
  const [yearFilter, setYearFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<LinkMeOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Data - Commandes avec pagination server-side
  const {
    orders,
    totalCount,
    isLoading: ordersLoading,
    error,
    statusCounts,
  } = useLinkMeOrders({
    page,
    pageSize: ITEMS_PER_PAGE,
    yearFilter,
    statusFilter: activeTab,
  });

  // KPIs mensuels (query directe, RLS-aware)
  const { data: monthlyKPIs, isLoading: kpisLoading } = useMonthlyKPIs({
    enabled: true,
  });

  // SOURCE DE VÉRITÉ: Statistiques commissions depuis linkme_commissions
  const { data: commissionStats, isLoading: commissionStatsLoading } =
    useAffiliateCommissionStats();

  const isLoading = ordersLoading || kpisLoading || commissionStatsLoading;

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Handlers
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setPage(0); // Reset pagination on tab change
  }, []);

  const handleYearChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setYearFilter(e.target.value);
      setPage(0); // Reset pagination on filter change
    },
    []
  );

  const toggleOrder = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const openDetailModal = (order: LinkMeOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  // Tab count helper
  const getTabCount = (tabId: TabType): number => {
    if (tabId === 'all') return statusCounts['all'] ?? 0;
    if (tabId === 'shipped') return statusCounts['shipped_tab'] ?? 0;
    return statusCounts[tabId] ?? 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageTourTrigger tourId="tour_order" />
      {/* Header */}
      <div
        data-tour="orders-header"
        className="bg-gradient-to-b from-white to-gray-50/50 border-b px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#183559]">
                Mes Commandes
              </h1>
              <HelpTooltip content="En approbation = en attente de validation Vérone. Validée = confirmée et en préparation. Expédiée = en cours de livraison. Livrée = commission payable." />
            </div>
            <p className="text-[#183559]/60 mt-1">
              Gérez vos commandes clients et suivez vos ventes
            </p>
          </div>
          <Link
            href="/commandes/nouvelle"
            data-tour="orders-create"
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#5DBEBB] to-[#4AA8A5] text-white rounded-xl hover:from-[#4DA9A6] hover:to-[#3D9895] shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            <Plus className="h-5 w-5" />
            Nouvelle vente
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs Dashboard - Totaux */}
        <div
          data-tour="orders-kpis"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <KPICard
            title="Commandes"
            icon={ShoppingBag}
            variant="turquoise"
            compact
            mainValue={monthlyKPIs?.allTime.ordersCount ?? 0}
            isLoading={kpisLoading}
          />
          <KPICard
            title="CA TTC"
            icon={TrendingUp}
            variant="marine"
            compact
            mainValue={`${(monthlyKPIs?.allTime.caTTC ?? 0).toLocaleString(
              'fr-FR',
              {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }
            )} €`}
            isLoading={kpisLoading}
          />
          <KPICard
            title="Panier Moyen"
            icon={Package}
            variant="turquoise"
            compact
            mainValue={`${
              monthlyKPIs?.allTime.ordersCount
                ? (
                    (monthlyKPIs?.allTime.caTTC ?? 0) /
                    monthlyKPIs.allTime.ordersCount
                  ).toLocaleString('fr-FR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                : 0
            } €`}
            isLoading={kpisLoading}
          />
          <KPICard
            title="Commissions TTC"
            icon={Wallet}
            variant="marine"
            compact
            mainValue={`${(
              commissionStats?.total.amountTTC ?? 0
            ).toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })} €`}
            isLoading={commissionStatsLoading}
          />
        </div>

        {/* Filtre année */}
        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={yearFilter}
              onChange={handleYearChange}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5DBEBB] focus:border-[#5DBEBB]"
            >
              {YEAR_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs de filtrage */}
        <div
          data-tour="orders-filters"
          className="bg-white rounded-xl border shadow-sm"
        >
          <div className="border-b overflow-x-auto">
            <nav className="flex min-w-max">
              {[
                {
                  id: 'all' as const,
                  label: 'Toutes',
                  color: 'blue',
                },
                {
                  id: 'pending_approval' as const,
                  label: 'En approbation',
                  color: 'teal',
                },
                {
                  id: 'draft' as const,
                  label: 'Brouillon',
                  color: 'orange',
                },
                {
                  id: 'validated' as const,
                  label: 'Validée',
                  color: 'blue',
                },
                {
                  id: 'shipped' as const,
                  label: 'Expédiée',
                  color: 'green',
                },
                {
                  id: 'cancelled' as const,
                  label: 'Annulée',
                  color: 'gray',
                },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                const count = getTabCount(tab.id);
                const badgeColor =
                  tab.color === 'orange'
                    ? 'bg-amber-100 text-amber-600'
                    : tab.color === 'teal'
                      ? 'bg-teal-100 text-teal-600'
                      : tab.color === 'green'
                        ? 'bg-green-100 text-green-600'
                        : tab.color === 'gray'
                          ? 'bg-gray-100 text-gray-500'
                          : isActive
                            ? 'bg-[#5DBEBB]/10 text-[#5DBEBB]'
                            : 'bg-gray-100 text-gray-500';

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-[#5DBEBB] text-[#5DBEBB]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs rounded-full ${badgeColor}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Liste des commandes */}
          <div data-tour="orders-list" className="p-4">
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700">
                  Erreur lors du chargement des commandes.
                </p>
              </div>
            )}

            {!isLoading && !error && orders.length === 0 && (
              <div className="text-center py-16">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune commande</p>
                <p className="text-gray-400 text-sm mt-1">
                  {activeTab === 'all'
                    ? 'Créez votre première vente pour commencer'
                    : `Aucune commande dans cette catégorie`}
                </p>
                {activeTab === 'all' && (
                  <Link
                    href="/commandes/nouvelle"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#5DBEBB] to-[#4AA8A5] text-white rounded-xl hover:from-[#4DA9A6] hover:to-[#3D9895] text-sm shadow-md transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle vente
                  </Link>
                )}
              </div>
            )}

            {!isLoading && !error && orders.length > 0 && (
              <div className="space-y-3">
                {orders.map(order => {
                  const isExpanded = expandedOrderId === order.id;
                  const statusColor =
                    STATUS_COLORS[order.status] || STATUS_COLORS.draft;

                  return (
                    <div
                      key={order.id}
                      className="bg-white border rounded-xl overflow-hidden hover:shadow-md hover:border-[#5DBEBB]/30 transition-all"
                    >
                      {/* Header de la commande */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-gray-400">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-[#183559]">
                                {order.linkme_display_number ??
                                  order.order_number}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString(
                                  'fr-FR',
                                  {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  }
                                )}
                              </p>
                            </div>

                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
                            >
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-8 text-right">
                            <div>
                              <p className="text-sm text-gray-500">Client</p>
                              <p className="font-medium text-gray-900">
                                {order.customer_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Total TTC</p>
                              <p className="font-semibold text-gray-900">
                                {order.total_ttc.toFixed(2)} €
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Commission
                              </p>
                              <p className="font-semibold text-[#5DBEBB]">
                                +{order.total_affiliate_margin.toFixed(2)} €
                              </p>
                            </div>

                            {order.status === 'pending_approval' && (
                              <span className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                                En attente validation Vérone
                              </span>
                            )}

                            {order.status === 'draft' && (
                              <Link
                                href={`/commandes/${order.id}/modifier`}
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-white hover:bg-amber-500 border border-amber-400 rounded-lg transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Modifier
                              </Link>
                            )}

                            <button
                              onClick={e => openDetailModal(order, e)}
                              className="px-3 py-1.5 text-sm font-medium text-[#5DBEBB] hover:text-white hover:bg-[#5DBEBB] border border-[#5DBEBB] rounded-lg transition-colors"
                            >
                              Détails
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Détails de la commande (expanded) */}
                      {isExpanded && (
                        <div className="border-t bg-gray-50 px-4 py-3">
                          <div className="flex flex-wrap items-start gap-6 text-sm mb-4">
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div>
                                <span className="font-medium text-gray-900">
                                  {order.customer_name}
                                </span>
                                {order.customer_email && (
                                  <span className="text-gray-500 ml-2">
                                    {order.customer_email}
                                  </span>
                                )}
                              </div>
                            </div>

                            {(Boolean(order.customer_address) ||
                              Boolean(order.customer_city)) && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                <span className="text-gray-600">
                                  {order.customer_address &&
                                    `${order.customer_address}, `}
                                  {order.customer_postal_code}{' '}
                                  {order.customer_city}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-4 ml-auto text-sm">
                              <span className="text-gray-500">
                                HT:{' '}
                                <span className="text-gray-900 font-medium">
                                  {order.total_ht.toFixed(2)} €
                                </span>
                              </span>
                              <span className="text-gray-500">
                                TTC:{' '}
                                <span className="text-gray-900 font-semibold">
                                  {order.total_ttc.toFixed(2)} €
                                </span>
                              </span>
                              <span className="text-[#5DBEBB] font-semibold">
                                +{order.total_affiliate_margin.toFixed(2)} €
                              </span>
                            </div>
                          </div>

                          {order.items && order.items.length > 0 && (
                            <div className="bg-white rounded-lg border overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                  <tr className="text-xs text-gray-500">
                                    <th className="px-3 py-2 text-left">
                                      Produit
                                    </th>
                                    <th className="px-3 py-2 text-center w-16">
                                      Qté
                                    </th>
                                    <th className="px-3 py-2 text-right w-24">
                                      Prix HT
                                    </th>
                                    <th className="px-3 py-2 text-right w-24">
                                      Total HT
                                    </th>
                                    <th className="px-3 py-2 text-right w-24">
                                      Marge
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {order.items.map(item => (
                                    <tr key={item.id}>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-3">
                                          {item.product_image_url ? (
                                            <Image
                                              src={item.product_image_url}
                                              alt={item.product_name}
                                              width={40}
                                              height={40}
                                              className="rounded-md object-cover w-10 h-10 flex-shrink-0"
                                            />
                                          ) : (
                                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                                              <Package className="h-5 w-5 text-gray-400" />
                                            </div>
                                          )}
                                          <div>
                                            <span className="font-medium text-gray-900">
                                              {item.product_name}
                                            </span>
                                            {item.product_sku && (
                                              <p className="text-gray-400 text-xs">
                                                {item.product_sku}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-center text-gray-700">
                                        {item.quantity}
                                      </td>
                                      <td className="px-3 py-2 text-right text-gray-700">
                                        {item.unit_price_ht.toFixed(2)} €
                                      </td>
                                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                                        {item.total_ht.toFixed(2)} €
                                      </td>
                                      <td className="px-3 py-2 text-right font-medium text-[#5DBEBB]">
                                        {item.affiliate_margin > 0
                                          ? `+${item.affiliate_margin.toFixed(2)} €`
                                          : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !error && totalCount > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <p className="text-sm text-gray-500">
                  {totalCount} commande{totalCount > 1 ? 's' : ''} au total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    Page {page + 1} sur {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage(p => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal detail commande */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
      />
    </div>
  );
}
