'use client';

import { useState, useEffect, useCallback } from 'react';

import type {
  SalesOrder,
  PacklinkShipment,
  ShipmentStats,
} from './expeditions-types';

export async function fetchPacklinkPendingOrderIds(
  orderIds: string[]
): Promise<Set<string>> {
  if (orderIds.length === 0) return new Set();
  try {
    const { createClient } = await import('@verone/utils/supabase/client');
    const supabase = createClient();
    const { data: shipments } = await supabase
      .from('sales_order_shipments')
      .select('sales_order_id, packlink_status')
      .in('sales_order_id', orderIds)
      .eq('packlink_status', 'a_payer');
    const rows = shipments as unknown as Array<{ sales_order_id: string }>;
    if (rows && rows.length > 0)
      return new Set(rows.map(s => s.sales_order_id));
  } catch {
    // Silently ignore if table doesn't exist or query fails
  }
  return new Set();
}

export async function fetchPacklinkShipments(): Promise<PacklinkShipment[]> {
  const res = await fetch('/api/packlink/shipments/pending');
  if (!res.ok) {
    console.error('[ExpeditionsPage] Load Packlink shipments:', res.status);
    return [];
  }
  const { shipments: rows } = (await res.json()) as {
    shipments: PacklinkShipment[];
  };
  return rows ?? [];
}

interface UseToShipOrdersArgs {
  loadSalesOrdersReadyForShipment: (filters: {
    status?: string;
    search?: string;
    urgent_only?: boolean;
    overdue_only?: boolean;
  }) => Promise<unknown>;
  activeTab: string;
  statusFilter: string;
  searchTerm: string;
  urgencyFilter: string;
}

export function useToShipOrders({
  loadSalesOrdersReadyForShipment,
  activeTab,
  statusFilter,
  searchTerm,
  urgencyFilter,
}: UseToShipOrdersArgs) {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [packlinkPendingOrders, setPacklinkPendingOrders] = useState<
    Set<string>
  >(new Set());

  useEffect(() => {
    if (activeTab !== 'to-ship') return;
    const filters: {
      status?: string;
      search?: string;
      urgent_only?: boolean;
      overdue_only?: boolean;
    } = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (searchTerm) filters.search = searchTerm;
    if (urgencyFilter === 'urgent') filters.urgent_only = true;
    else if (urgencyFilter === 'overdue') filters.overdue_only = true;

    void loadSalesOrdersReadyForShipment(filters)
      .then(async data => {
        const typedOrders = data as SalesOrder[];
        setOrders(typedOrders);
        const pending = await fetchPacklinkPendingOrderIds(
          typedOrders.map(o => o.id)
        );
        setPacklinkPendingOrders(pending);
      })
      .catch((err: unknown) => {
        console.error('[ExpeditionsPage] Load ready orders failed:', err);
      });
  }, [
    loadSalesOrdersReadyForShipment,
    statusFilter,
    searchTerm,
    urgencyFilter,
    activeTab,
  ]);

  return { orders, setOrders, packlinkPendingOrders };
}

interface UsePacklinkShipmentsArgs {
  activeTab: string;
}

export function usePacklinkShipmentsList({
  activeTab,
}: UsePacklinkShipmentsArgs) {
  const [packlinkShipments, setPacklinkShipments] = useState<
    PacklinkShipment[]
  >([]);

  useEffect(() => {
    if (activeTab !== 'packlink') return;
    void fetchPacklinkShipments()
      .then(setPacklinkShipments)
      .catch(console.error);
  }, [activeTab]);

  const handleCancelPacklinkShipment = useCallback(
    async (shipmentId: string) => {
      if (!confirm('Annuler cette expédition Packlink ?')) return;
      try {
        await fetch(`/api/packlink/shipment/${shipmentId}`, {
          method: 'DELETE',
        });
        const { createClient } = await import('@verone/utils/supabase/client');
        const sb = createClient();
        await sb
          .from('sales_order_shipments')
          .delete()
          .eq('packlink_shipment_id', shipmentId);
        setPacklinkShipments(prev =>
          prev.filter(s => s.packlink_shipment_id !== shipmentId)
        );
      } catch (e) {
        console.error('[Packlink] Cancel failed:', e);
      }
    },
    []
  );

  return { packlinkShipments, handleCancelPacklinkShipment };
}

interface UseExpeditionsStatsArgs {
  loadShipmentStats: () => Promise<ShipmentStats>;
}

export function useExpeditionsStats({
  loadShipmentStats,
}: UseExpeditionsStatsArgs) {
  const [stats, setStats] = useState<ShipmentStats | null>(null);

  useEffect(() => {
    void loadShipmentStats()
      .then(setStats)
      .catch((err: unknown) => {
        console.error('[ExpeditionsPage] Load stats failed:', err);
      });
  }, [loadShipmentStats]);

  return { stats, setStats };
}
