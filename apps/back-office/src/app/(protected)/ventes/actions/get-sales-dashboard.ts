'use server';

import { createServerClient } from '@verone/utils/supabase/server';

export interface SalesDashboardData {
  alerts: {
    draftOrders: number;
    validatedOrders: number;
    consultationsEnAttente: number;
    commissionsAPayer: number;
    commissionsAPayer_montant: number;
  };
  kpis: {
    caMois: number;
    caAnnee: number;
    ordersShipped: number;
    panierMoyen: number;
  };
  recentConsultations: Array<{
    id: string;
    clientName: string;
    descriptif: string;
    budget: string;
    imageUrl: string | null;
    status: string;
    statusLabel: string;
    date: string;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    channel: 'linkme' | 'direct';
    totalTtc: number;
    status: string;
    statusLabel: string;
    date: string;
  }>;
  recentShipments: Array<{
    id: string;
    orderNumber: string;
    deliveryMethod: string;
    deliveryMethodLabel: string;
    carrierName: string | null;
    packlinkStatus: string | null;
    packlinkStatusLabel: string;
    shippedAt: string | null;
    isExpedied: boolean;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  terminee: 'Terminee',
  annulee: 'Annulee',
  draft: 'Brouillon',
  pending_approval: 'En approbation',
  validated: 'Validee',
  partially_shipped: 'Partiellement expediee',
  shipped: 'Expediee',
  delivered: 'Livree',
  cancelled: 'Annulee',
  pending: 'En attente',
};

function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export async function getSalesDashboard(): Promise<SalesDashboardData> {
  const supabase = await createServerClient();

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      draftOrders,
      validatedOrders,
      consultationsActive,
      commissionsPending,
      caMoisResult,
      caAnneeResult,
      shippedCount,
      recentConsultationsResult,
      recentOrdersResult,
      recentShipmentsResult,
    ] = await Promise.all([
      // Alerts
      supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft')
        .is('cancelled_at', null),
      supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'validated')
        .is('cancelled_at', null),
      supabase
        .from('client_consultations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'en_attente')
        .is('archived_at', null)
        .is('deleted_at', null),
      supabase
        .from('linkme_commissions')
        .select('id, total_payout_ttc, status')
        .is('paid_at', null),
      // KPIs
      supabase
        .from('sales_orders')
        .select('total_ttc')
        .gte('created_at', startOfMonth.toISOString())
        .is('cancelled_at', null),
      supabase
        .from('sales_orders')
        .select('total_ttc')
        .eq('status', 'shipped')
        .gte('created_at', startOfYear.toISOString())
        .is('cancelled_at', null),
      supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'shipped')
        .is('cancelled_at', null),
      // Recent consultations (with joins + descriptif + image)
      supabase
        .from('client_consultations')
        .select(
          `id, client_email, status, created_at, tarif_maximum, descriptif, image_url,
          organisation_id, enseigne_id,
          organisations!client_consultations_organisation_id_fkey(legal_name, trade_name),
          enseignes!client_consultations_enseigne_id_fkey(name)`
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5),
      // Recent orders
      supabase
        .from('sales_orders')
        .select(
          'id, order_number, customer_id, customer_type, individual_customer_id, status, total_ttc, created_at, created_by_affiliate_id'
        )
        .is('cancelled_at', null)
        .in('status', ['draft', 'validated', 'partially_shipped', 'shipped'])
        .order('created_at', { ascending: false })
        .limit(5),
      // Recent shipments (all, not just shipped)
      supabase
        .from('sales_order_shipments')
        .select(
          'id, shipped_at, carrier_name, tracking_number, sales_order_id, delivery_method, packlink_status'
        )
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // CA calculations
    const caMois =
      caMoisResult.data?.reduce((s, o) => s + (o.total_ttc ?? 0), 0) ?? 0;
    const caAnnee =
      caAnneeResult.data?.reduce((s, o) => s + (o.total_ttc ?? 0), 0) ?? 0;
    const shipped = shippedCount.count ?? 0;
    const panierMoyen = shipped > 0 ? caAnnee / shipped : 0;

    // Map consultations
    interface ConsultRow {
      id: string;
      client_email: string;
      status: string;
      created_at: string;
      tarif_maximum: number | null;
      descriptif: string | null;
      image_url: string | null;
      organisation_id: string | null;
      enseigne_id: string | null;
      organisations: { legal_name: string; trade_name: string | null } | null;
      enseignes: { name: string } | null;
    }
    const consultRows = (recentConsultationsResult.data ??
      []) as unknown as ConsultRow[];
    const recentConsultations = consultRows.map(c => {
      let clientName = c.client_email;
      if (c.organisations) {
        clientName = c.organisations.trade_name ?? c.organisations.legal_name;
      } else if (c.enseignes) {
        clientName = c.enseignes.name;
      }
      // Truncate descriptif to ~60 chars
      let descriptif = c.descriptif ?? '';
      if (descriptif.length > 60) descriptif = descriptif.slice(0, 57) + '...';

      return {
        id: c.id,
        clientName,
        descriptif,
        budget: c.tarif_maximum ? `${c.tarif_maximum} €` : '',
        imageUrl: c.image_url ?? null,
        status: c.status,
        statusLabel: formatStatus(c.status),
        date: formatDate(c.created_at),
      };
    });

    // Map orders - resolve customer names
    interface OrderRow {
      id: string;
      order_number: string;
      customer_id: string | null;
      customer_type: string;
      individual_customer_id: string | null;
      status: string;
      total_ttc: number;
      created_at: string;
      created_by_affiliate_id: string | null;
    }
    const orderRows = (recentOrdersResult.data ?? []) as unknown as OrderRow[];

    const orgIds = orderRows
      .filter(o => o.customer_type === 'organization' && o.customer_id)
      .map(o => o.customer_id as string);
    const indivIds = orderRows
      .filter(o => o.individual_customer_id)
      .map(o => o.individual_customer_id as string);

    const [orgsRes, indivsRes] = await Promise.all([
      orgIds.length > 0
        ? supabase
            .from('organisations')
            .select('id, legal_name, trade_name')
            .in('id', orgIds)
        : { data: [] },
      indivIds.length > 0
        ? supabase
            .from('individual_customers')
            .select('id, first_name, last_name')
            .in('id', indivIds)
        : { data: [] },
    ]);

    const orgMap = new Map(
      (
        (orgsRes.data ?? []) as Array<{
          id: string;
          legal_name: string;
          trade_name: string | null;
        }>
      ).map(o => [o.id, o.trade_name ?? o.legal_name])
    );
    const indivMap = new Map(
      (
        (indivsRes.data ?? []) as Array<{
          id: string;
          first_name: string;
          last_name: string;
        }>
      ).map(i => [i.id, `${i.first_name} ${i.last_name}`])
    );

    const recentOrders = orderRows.map(o => {
      let customerName = 'Client inconnu';
      if (o.customer_type === 'organization' && o.customer_id)
        customerName = orgMap.get(o.customer_id) ?? 'Organisation inconnue';
      if (o.individual_customer_id)
        customerName = indivMap.get(o.individual_customer_id) ?? customerName;
      return {
        id: o.id,
        orderNumber: o.order_number,
        customerName,
        channel: o.created_by_affiliate_id
          ? ('linkme' as const)
          : ('direct' as const),
        totalTtc: o.total_ttc,
        status: o.status,
        statusLabel: formatStatus(o.status),
        date: formatDate(o.created_at),
      };
    });

    // Map shipments - resolve order numbers
    interface ShipRow {
      id: string;
      shipped_at: string | null;
      carrier_name: string | null;
      tracking_number: string | null;
      sales_order_id: string;
      delivery_method: string | null;
      packlink_status: string | null;
    }
    const DELIVERY_LABELS: Record<string, string> = {
      packlink: 'Packlink',
      hand_delivery: 'Remise en main propre',
      manual: 'Expedition manuelle',
      pickup: 'Retrait sur place',
      parcel: 'Expedition manuelle',
    };
    const PACKLINK_STATUS_LABELS: Record<string, string> = {
      a_payer: 'Transport a payer',
      paye: 'Transport paye',
      in_transit: 'En transit',
      incident: 'Incident',
    };

    const shipRows = (recentShipmentsResult.data ?? []) as unknown as ShipRow[];
    const shipOrderIds = [...new Set(shipRows.map(s => s.sales_order_id))];
    const shipOrdersRes =
      shipOrderIds.length > 0
        ? await supabase
            .from('sales_orders')
            .select('id, order_number')
            .in('id', shipOrderIds)
        : { data: [] };
    const shipOrderMap = new Map(
      (
        (shipOrdersRes.data ?? []) as Array<{
          id: string;
          order_number: string;
        }>
      ).map(o => [o.id, o.order_number])
    );

    // Deduplicate shipments by order (one entry per order)
    const seenOrders = new Set<string>();
    const recentShipments = shipRows
      .filter(s => {
        if (seenOrders.has(s.sales_order_id)) return false;
        seenOrders.add(s.sales_order_id);
        return true;
      })
      .map(s => ({
        id: s.id,
        orderNumber: shipOrderMap.get(s.sales_order_id) ?? 'N/A',
        deliveryMethod: s.delivery_method ?? 'parcel',
        deliveryMethodLabel:
          DELIVERY_LABELS[s.delivery_method ?? 'parcel'] ??
          s.delivery_method ??
          'Non defini',
        carrierName: s.carrier_name,
        packlinkStatus: s.packlink_status,
        packlinkStatusLabel: s.packlink_status
          ? (PACKLINK_STATUS_LABELS[s.packlink_status] ?? s.packlink_status)
          : '',
        shippedAt: s.shipped_at ? formatDate(s.shipped_at) : null,
        isExpedied: s.shipped_at !== null,
      }));

    return {
      alerts: {
        draftOrders: draftOrders.count ?? 0,
        validatedOrders: validatedOrders.count ?? 0,
        consultationsEnAttente: consultationsActive.count ?? 0,
        commissionsAPayer: (commissionsPending.data ?? []).filter(
          c => c.status === 'validated'
        ).length,
        commissionsAPayer_montant:
          Math.round(
            (commissionsPending.data ?? [])
              .filter(c => c.status === 'validated')
              .reduce((s, c) => s + (Number(c.total_payout_ttc) || 0), 0) * 100
          ) / 100,
      },
      kpis: {
        caMois: Math.round(caMois * 100) / 100,
        caAnnee: Math.round(caAnnee * 100) / 100,
        ordersShipped: shipped,
        panierMoyen: Math.round(panierMoyen),
      },
      recentConsultations,
      recentOrders,
      recentShipments,
    };
  } catch (error) {
    console.error('[getSalesDashboard] Error:', error);
    return {
      alerts: {
        draftOrders: 0,
        validatedOrders: 0,
        consultationsEnAttente: 0,
        commissionsAPayer: 0,
        commissionsAPayer_montant: 0,
      },
      kpis: { caMois: 0, caAnnee: 0, ordersShipped: 0, panierMoyen: 0 },
      recentConsultations: [],
      recentOrders: [],
      recentShipments: [],
    };
  }
}
