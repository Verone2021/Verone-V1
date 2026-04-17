'use client';

import { useState, useEffect, useMemo } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useToast } from '@verone/common';
import { useToggle } from '@verone/hooks';
import { usePurchaseOrders } from '@verone/orders';
import { useStockAlerts } from '@verone/stock';

import type { StockAlert } from './types';

export function useStockAlertesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast: _toast } = useToast(); // Reserved for future toast notifications

  const [filters, setFilters] = useState({
    severity: '',
    category: '',
    acknowledged: false,
    limit: 100,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, toggleShowFilters] = useToggle(false);
  const [
    showQuickPurchaseModal,
    _toggleQuickPurchaseModal,
    setShowQuickPurchaseModal,
  ] = useToggle(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<{
    productId: string;
    shortageQuantity: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'actives' | 'historique'>(
    'actives'
  );

  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [_selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const {
    fetchOrder,
    currentOrder,
    loading: _loadingOrder,
  } = usePurchaseOrders();

  const {
    loading,
    alerts,
    fetchAlerts,
    criticalAlerts,
    warningAlerts,
    alertsInDraft,
    alertsNotInDraft: _alertsNotInDraft,
    isProductInDraft: _isProductInDraft,
    getQuantityInDraft: _getQuantityInDraft,
  } = useStockAlerts();

  const mappedAlerts = useMemo<StockAlert[]>(() => {
    return alerts.map(alert => ({
      id: alert.id,
      severity: alert.severity,
      category: 'stock' as const,
      title:
        alert.alert_type === 'out_of_stock'
          ? 'Rupture de stock'
          : alert.alert_type === 'low_stock'
            ? 'Stock faible'
            : alert.alert_type === 'low_stock_forecast'
              ? 'Stock minimum anticipé'
              : 'Stock commandé sans disponibilité',
      message:
        alert.alert_type === 'out_of_stock'
          ? `${alert.product_name} est en rupture de stock`
          : alert.alert_type === 'low_stock'
            ? `${alert.product_name} approche du seuil minimum (${alert.stock_real}/${alert.min_stock})`
            : alert.alert_type === 'low_stock_forecast'
              ? `${alert.product_name} : le prévisionnel va tomber sous le seuil (${alert.shortage_quantity} manquants apres SO en attente)`
              : `${alert.product_name} : commandes clients sans stock (${alert.stock_forecasted_out} unités)`,
      productId: alert.product_id,
      productName: alert.product_name,
      productSku: alert.sku,
      productImageUrl: null,
      currentStock: alert.stock_real,
      minStock: alert.min_stock,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      is_in_draft: alert.is_in_draft,
      quantity_in_draft: alert.quantity_in_draft,
      draft_order_id: alert.draft_order_id,
      draft_order_number: alert.draft_order_number,
      stock_forecasted_in: alert.stock_forecasted_in,
      stock_forecasted_out: alert.stock_forecasted_out,
      shortage_quantity: alert.shortage_quantity,
      validated: alert.validated,
      validated_at: alert.validated_at,
      alert_type: alert.alert_type,
      action: !alert.is_in_draft
        ? {
            label: 'Commander',
            handler: () => {
              setSelectedProductForOrder({
                productId: alert.product_id,
                shortageQuantity: alert.shortage_quantity,
              });
              setShowQuickPurchaseModal(true);
            },
          }
        : undefined,
    }));
  }, [alerts, setSelectedProductForOrder, setShowQuickPurchaseModal]);

  const alertStats = useMemo(() => {
    const unacknowledged = mappedAlerts.filter(a => !a.acknowledged);
    return {
      total: mappedAlerts.length,
      unacknowledged: unacknowledged.length,
      critical: criticalAlerts.length,
      warning: warningAlerts.length,
      info: 0,
      inDraft: alertsInDraft.length,
    };
  }, [mappedAlerts, criticalAlerts, warningAlerts, alertsInDraft]);

  // AUTO-OPEN MODAL depuis notification (Phase 2.2)
  useEffect(() => {
    const productId = searchParams.get('product_id');

    if (productId && alerts.length > 0) {
      const alert = alerts.find(a => a.product_id === productId);

      if (alert && !alert.is_in_draft) {
        setSelectedProductForOrder({
          productId: alert.product_id,
          shortageQuantity: alert.shortage_quantity,
        });
        setShowQuickPurchaseModal(true);
      }
    }
  }, [
    searchParams,
    alerts,
    setSelectedProductForOrder,
    setShowQuickPurchaseModal,
  ]);

  // Auto-refresh polling (fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchAlerts().catch(error => {
        console.error('[AlertesPage] Auto-refresh failed:', error);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Écouter événements de changement de commandes pour rafraîchissement immédiat
  useEffect(() => {
    const handleStockAlertsRefresh = () => {
      console.warn(
        '📢 [ALERTES] Événement stock-alerts-refresh reçu, rafraîchissement...'
      );
      void fetchAlerts().catch(error => {
        console.error('[AlertesPage] Event refresh failed:', error);
      });
    };

    window.addEventListener('stock-alerts-refresh', handleStockAlertsRefresh);
    return () =>
      window.removeEventListener(
        'stock-alerts-refresh',
        handleStockAlertsRefresh
      );
  }, [fetchAlerts]);

  const handleOpenOrderDetail = async (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = await fetchOrder(orderId);
    if (order) {
      setShowOrderDetailModal(true);
    }
  };

  // ✅ FIX 2025-12-08 - Inclure alertes VERTES (PO validée en transit)
  const activeAlerts = mappedAlerts.filter(alert => {
    const stockPrevisionnel =
      (alert.currentStock ?? 0) +
      (alert.stock_forecasted_in ?? 0) -
      (alert.stock_forecasted_out ?? 0);

    if (stockPrevisionnel < 0) return true;
    if (stockPrevisionnel < (alert.minStock ?? 0)) return true;

    if (
      alert.validated === true &&
      (alert.stock_forecasted_in ?? 0) > 0 &&
      (alert.stock_forecasted_out ?? 0) > 0
    ) {
      return true;
    }

    return false;
  });

  const historiqueAlerts = mappedAlerts.filter(alert => {
    const stockPrevisionnel =
      (alert.currentStock ?? 0) +
      (alert.stock_forecasted_in ?? 0) -
      (alert.stock_forecasted_out ?? 0);

    const isGreenAlert =
      alert.validated === true &&
      (alert.stock_forecasted_in ?? 0) > 0 &&
      (alert.stock_forecasted_out ?? 0) > 0;

    if (isGreenAlert) return false;

    return stockPrevisionnel >= (alert.minStock ?? 0);
  });

  const alertsToFilter =
    activeTab === 'actives' ? activeAlerts : historiqueAlerts;

  const filteredAlerts = alertsToFilter.filter(alert => {
    if (filters.severity && alert.severity !== filters.severity) return false;
    if (filters.category && alert.category !== filters.category) return false;
    if (filters.acknowledged && !alert.acknowledged) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        alert.title.toLowerCase().includes(search) ||
        alert.message.toLowerCase().includes(search) ||
        (alert.productName?.toLowerCase().includes(search) ?? false) ||
        (alert.productSku?.toLowerCase().includes(search) ?? false)
      );
    }
    return true;
  });

  return {
    router,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    showFilters,
    toggleShowFilters,
    showQuickPurchaseModal,
    setShowQuickPurchaseModal,
    selectedProductForOrder,
    setSelectedProductForOrder,
    activeTab,
    setActiveTab,
    showOrderDetailModal,
    setShowOrderDetailModal,
    loading,
    fetchAlerts,
    currentOrder,
    alertStats,
    activeAlerts,
    historiqueAlerts,
    filteredAlerts,
    handleOpenOrderDetail,
  };
}
