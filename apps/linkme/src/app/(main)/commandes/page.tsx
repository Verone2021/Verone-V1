'use client';

/**
 * Page: Mes Commandes
 * Dashboard affilié avec KPIs et historique des commandes
 *
 * KPIs alignes avec le Back-Office (source de verite):
 * - Total commandes
 * - Livrees (status = delivered)
 * - Commissions en attente (commission status = pending)
 * - Commissions totales
 *
 * @module CommandesPage
 * @since 2025-12-19
 * @updated 2025-12-19 - Alignement KPIs avec Back-Office
 */

import { useState, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

// Import direct du hook pour éviter les exports problématiques
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
  User,
  MapPin,
  Wallet,
  Pencil,
} from 'lucide-react';

import { OrderDetailModal } from './components/OrderDetailModal';
import {
  useLinkMeOrders,
  type LinkMeOrder,
} from '../../../hooks/use-linkme-orders';
import { useAffiliateCommissionStats } from '../../../lib/hooks/use-affiliate-commission-stats';
import { useUserAffiliate } from '../../../lib/hooks/use-user-selection';

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

// Onglets alignes avec Back-Office (source de verite)
type TabType =
  | 'all'
  | 'pending_approval'
  | 'draft'
  | 'validated'
  | 'shipped'
  | 'cancelled';

export default function CommandesPage(): JSX.Element {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<LinkMeOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Data - Affilié et ses commandes
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const {
    data: orders,
    isLoading: ordersLoading,
    error,
  } = useLinkMeOrders(affiliate?.id ?? null, false); // false = commandes de l'affilié uniquement

  // KPIs mensuels avec variations (hook partagé avec le back-office)
  const { data: monthlyKPIs, isLoading: kpisLoading } = useMonthlyKPIs({
    affiliateId: affiliate?.id,
    enabled: !!affiliate?.id,
  });

  // SOURCE DE VÉRITÉ: Statistiques commissions depuis linkme_commissions
  const { data: commissionStats, isLoading: commissionStatsLoading } =
    useAffiliateCommissionStats();

  const isLoading =
    affiliateLoading || ordersLoading || kpisLoading || commissionStatsLoading;

  // KPIs par statut (comptages locaux depuis les commandes)
  const statusKpis = useMemo(() => {
    const defaults = {
      total: 0,
      pendingApproval: 0,
      draft: 0,
      validated: 0,
      shipped: 0,
      cancelled: 0,
    };

    if (!orders) return defaults;

    return {
      total: orders.length,
      pendingApproval: orders.filter(o => o.pending_admin_validation === true)
        .length,
      draft: orders.filter(o => o.status === 'draft').length,
      validated: orders.filter(o => o.status === 'validated').length,
      shipped: orders.filter(o =>
        ['shipped', 'partially_shipped', 'delivered'].includes(o.status)
      ).length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders]);

  // Filtrer les commandes selon l'onglet actif - aligne avec Back-Office
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    switch (activeTab) {
      case 'pending_approval':
        return orders.filter(o => o.pending_admin_validation === true);
      case 'draft':
        return orders.filter(o => o.status === 'draft');
      case 'validated':
        return orders.filter(o => o.status === 'validated');
      case 'shipped':
        return orders.filter(o =>
          ['shipped', 'partially_shipped', 'delivered'].includes(o.status)
        );
      case 'cancelled':
        return orders.filter(o => o.status === 'cancelled');
      default:
        return orders;
    }
  }, [orders, activeTab]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const openDetailModal = (order: LinkMeOrder, e: React.MouseEvent) => {
    e.stopPropagation(); // Empecher le toggle expand
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes Commandes</h1>
            <p className="text-gray-500 mt-1">
              Gérez vos commandes clients et suivez vos ventes
            </p>
          </div>
          <Link
            href="/commandes/nouvelle"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Nouvelle vente
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs Dashboard - Totaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Commandes totales */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Commandes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monthlyKPIs?.allTime.ordersCount ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* CA TTC total */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">CA TTC</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {(monthlyKPIs?.allTime.caTTC ?? 0).toLocaleString('fr-FR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}{' '}
                  €
                </p>
              </div>
            </div>
          </div>

          {/* Panier Moyen */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Panier Moyen</p>
                <p className="text-2xl font-bold text-purple-600">
                  {monthlyKPIs?.allTime.ordersCount
                    ? (
                        (monthlyKPIs?.allTime.caTTC ?? 0) /
                        monthlyKPIs.allTime.ordersCount
                      ).toLocaleString('fr-FR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })
                    : 0}{' '}
                  €
                </p>
              </div>
            </div>
          </div>

          {/* Commissions totales (TTC) - SOURCE DE VÉRITÉ: linkme_commissions */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Commissions TTC</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {(commissionStats?.total.amountTTC ?? 0).toLocaleString(
                    'fr-FR',
                    {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }
                  )}{' '}
                  €
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de filtrage - Alignes avec Back-Office */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="border-b overflow-x-auto">
            <nav className="flex min-w-max">
              {[
                {
                  id: 'all' as const,
                  label: 'Toutes',
                  count: statusKpis.total,
                  color: 'blue',
                },
                {
                  id: 'pending_approval' as const,
                  label: 'En approbation',
                  count: statusKpis.pendingApproval,
                  color: 'teal',
                },
                {
                  id: 'draft' as const,
                  label: 'Brouillon',
                  count: statusKpis.draft,
                  color: 'orange',
                },
                {
                  id: 'validated' as const,
                  label: 'Validée',
                  count: statusKpis.validated,
                  color: 'blue',
                },
                {
                  id: 'shipped' as const,
                  label: 'Expédiée',
                  count: statusKpis.shipped,
                  color: 'green',
                },
                {
                  id: 'cancelled' as const,
                  label: 'Annulée',
                  count: statusKpis.cancelled,
                  color: 'gray',
                },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                // Couleur du badge selon le type - aligne avec Back-Office
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
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-500';

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs rounded-full ${badgeColor}`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Liste des commandes */}
          <div className="p-4">
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

            {!isLoading && !error && filteredOrders.length === 0 && (
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
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle vente
                  </Link>
                )}
              </div>
            )}

            {!isLoading && !error && filteredOrders.length > 0 && (
              <div className="space-y-3">
                {filteredOrders.map(order => {
                  const isExpanded = expandedOrderId === order.id;
                  const statusColor =
                    STATUS_COLORS[order.status] || STATUS_COLORS.draft;

                  return (
                    <div
                      key={order.id}
                      className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Header de la commande */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Chevron */}
                            <div className="text-gray-400">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </div>

                            {/* Numéro commande */}
                            <div>
                              <p className="font-semibold text-gray-900">
                                {order.order_number}
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

                            {/* Badge statut */}
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
                            >
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                          </div>

                          {/* Montants */}
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
                              <p className="font-semibold text-emerald-600">
                                +{order.total_affiliate_margin.toFixed(2)} €
                              </p>
                            </div>

                            {/* Badge En attente validation (si en attente) */}
                            {order.pending_admin_validation && (
                              <span className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                                En attente validation Vérone
                              </span>
                            )}

                            {/* Bouton Modifier (brouillon uniquement) */}
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

                            {/* Bouton Details */}
                            <button
                              onClick={e => openDetailModal(order, e)}
                              className="px-3 py-1.5 text-sm font-medium text-[#5DBEBB] hover:text-white hover:bg-[#5DBEBB] border border-[#5DBEBB] rounded-lg transition-colors"
                            >
                              Détails
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Détails de la commande (expanded) - Version compacte */}
                      {isExpanded && (
                        <div className="border-t bg-gray-50 px-4 py-3">
                          {/* Info client + adresse en ligne */}
                          <div className="flex flex-wrap items-start gap-6 text-sm mb-4">
                            {/* Client */}
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

                            {/* Adresse */}
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

                            {/* Totaux inline */}
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
                              <span className="text-emerald-600 font-semibold">
                                +{order.total_affiliate_margin.toFixed(2)} €
                              </span>
                            </div>
                          </div>

                          {/* Lignes de commande - compact */}
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
                                      <td className="px-3 py-2 text-right font-medium text-emerald-600">
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
