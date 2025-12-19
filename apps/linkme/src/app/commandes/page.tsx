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

import {
  Loader2,
  Plus,
  Package,
  Clock,
  CheckCircle,
  TrendingUp,
  ShoppingBag,
  Truck,
  ChevronDown,
  ChevronRight,
  User,
  MapPin,
  Wallet,
} from 'lucide-react';

import { CreateOrderModal } from './components/CreateOrderModal';
import { useLinkMeOrders } from '../../hooks/use-linkme-orders';
import { useAffiliateAnalytics } from '../../lib/hooks/use-affiliate-analytics';
import { useUserAffiliate } from '../../lib/hooks/use-user-selection';

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
type TabType = 'all' | 'draft' | 'validated' | 'shipped' | 'cancelled';

export default function CommandesPage(): JSX.Element {
  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Data - Commandes
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const {
    data: orders,
    isLoading: ordersLoading,
    error,
  } = useLinkMeOrders(affiliate?.id ?? null);

  // Data - Analytics pour les statuts des commissions (source de verite)
  const { data: analyticsData, isLoading: analyticsLoading } =
    useAffiliateAnalytics('year');

  const isLoading = affiliateLoading || ordersLoading || analyticsLoading;

  // KPIs alignes avec Back-Office (source de verite)
  const kpis = useMemo(() => {
    // Valeurs par defaut
    const defaults = {
      total: 0,
      draft: 0, // Brouillon
      validated: 0, // Validee
      shipped: 0, // Expediee (shipped + partially_shipped + delivered)
      cancelled: 0, // Annulee
      commissionsPending: 0,
      totalMargin: 0,
    };

    if (!orders) return defaults;

    // Comptages par statut - aligne avec Back-Office
    const total = orders.length;
    const draft = orders.filter(o => o.status === 'draft').length;
    const validated = orders.filter(o => o.status === 'validated').length;
    const shipped = orders.filter(o =>
      ['shipped', 'partially_shipped', 'delivered'].includes(o.status)
    ).length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalMargin = orders.reduce(
      (sum, o) => sum + (o.total_affiliate_margin || 0),
      0
    );

    // Commissions en attente - depuis analytics
    const commissionsPending =
      analyticsData?.commissionsByStatus?.pending?.count || 0;

    return {
      total,
      draft,
      validated,
      shipped,
      cancelled,
      commissionsPending,
      totalMargin,
    };
  }, [orders, analyticsData]);

  // Filtrer les commandes selon l'onglet actif - aligne avec Back-Office
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    switch (activeTab) {
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Nouvelle vente
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs Dashboard - Alignes avec Back-Office */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total commandes */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.total}</p>
                <p className="text-xs text-gray-400">commandes</p>
              </div>
            </div>
          </div>

          {/* Expediees (shipped + delivered) */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Expediees</p>
                <p className="text-2xl font-bold text-green-600">
                  {kpis.shipped}
                </p>
                <p className="text-xs text-gray-400">commandes</p>
              </div>
            </div>
          </div>

          {/* Commissions en attente (client n'a pas paye) */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">En attente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {kpis.commissionsPending}
                </p>
                <p className="text-xs text-gray-400">commissions</p>
              </div>
            </div>
          </div>

          {/* Commissions totales */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Commissions HT</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {kpis.totalMargin.toFixed(2)} €
                </p>
                <p className="text-xs text-gray-400">total gagne</p>
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
                  count: kpis.total,
                  color: 'blue',
                },
                {
                  id: 'draft' as const,
                  label: 'Brouillon',
                  count: kpis.draft,
                  color: 'orange',
                },
                {
                  id: 'validated' as const,
                  label: 'Validée',
                  count: kpis.validated,
                  color: 'blue',
                },
                {
                  id: 'shipped' as const,
                  label: 'Expédiée',
                  count: kpis.shipped,
                  color: 'green',
                },
                {
                  id: 'cancelled' as const,
                  label: 'Annulée',
                  count: kpis.cancelled,
                  color: 'gray',
                },
              ].map(tab => {
                const isActive = activeTab === tab.id;
                // Couleur du badge selon le type - aligne avec Back-Office
                const badgeColor =
                  tab.color === 'orange'
                    ? 'bg-amber-100 text-amber-600'
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
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle vente
                  </button>
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
                            {(order.customer_address ||
                              order.customer_city) && (
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
                                        <span className="font-medium text-gray-900">
                                          {item.product_name}
                                        </span>
                                        {item.product_sku && (
                                          <span className="text-gray-400 ml-2 text-xs">
                                            {item.product_sku}
                                          </span>
                                        )}
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

      {/* Modal création commande */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
