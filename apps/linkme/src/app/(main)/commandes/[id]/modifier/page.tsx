'use client';

/**
 * Page: Modifier une commande brouillon
 *
 * Route: /commandes/[id]/modifier
 *
 * Guards:
 * - Commande doit exister
 * - Commande doit etre en statut 'draft'
 * - Commande doit appartenir a l'affilie connecte
 *
 * @module ModifierCommandePage
 * @since 2026-02-16
 */

import { useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { createClient } from '@verone/utils/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';

import { EditOrderPage } from './EditOrderPage';

// ============================================================================
// TYPES
// ============================================================================

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  customer_id: string;
  total_ht: number;
  total_ttc: number;
  shipping_cost_ht: number;
  insurance_cost_ht: number;
  handling_cost_ht: number;
  tax_rate: number;
  billing_address: Record<string, string> | null;
  shipping_address: Record<string, string> | null;
  linkme_selection_id: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  customer: {
    id: string;
    trade_name: string | null;
    legal_name: string;
    type: string;
    enseigne_id: string | null;
    ownership_type: string | null;
  } | null;
  sales_order_items: OrderItemData[];
  sales_order_linkme_details: LinkmeDetailsData[];
}

export interface OrderItemData {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  tax_rate: number;
  base_price_ht_locked: number;
  retrocession_rate: number;
  retrocession_amount: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
}

export interface LinkmeDetailsData {
  id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  requester_position: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  delivery_contact_name: string | null;
  delivery_contact_email: string | null;
  delivery_contact_phone: string | null;
  delivery_address: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  desired_delivery_date: string | null;
  is_mall_delivery: boolean | null;
  mall_email: string | null;
  semi_trailer_accessible: boolean | null;
  delivery_notes: string | null;
}

export interface FullOrderData {
  order: OrderData;
  details: LinkmeDetailsData | null;
  selectionId: string | null;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ModifierCommandePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [data, setData] = useState<FullOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      const supabase = createClient();

      // 1. Fetch order with items and details
      const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          status,
          customer_id,
          total_ht,
          total_ttc,
          shipping_cost_ht,
          insurance_cost_ht,
          handling_cost_ht,
          tax_rate,
          billing_address,
          shipping_address,
          linkme_selection_id,
          created_at,
          updated_at,
          customer:organisations!sales_orders_customer_id_fkey (
            id,
            trade_name,
            legal_name,
            type,
            enseigne_id,
            ownership_type
          ),
          sales_order_items (
            id,
            product_id,
            quantity,
            unit_price_ht,
            tax_rate,
            base_price_ht_locked,
            retrocession_rate,
            retrocession_amount,
            product:products!sales_order_items_product_id_fkey (
              id,
              name,
              sku
            )
          ),
          sales_order_linkme_details (
            id,
            requester_name,
            requester_email,
            requester_phone,
            requester_position,
            billing_name,
            billing_email,
            billing_phone,
            delivery_contact_name,
            delivery_contact_email,
            delivery_contact_phone,
            delivery_address,
            delivery_postal_code,
            delivery_city,
            desired_delivery_date,
            is_mall_delivery,
            mall_email,
            semi_trailer_accessible,
            delivery_notes
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        setError('Commande non trouvee');
        setIsLoading(false);
        return;
      }

      // 2. Guard: draft status only
      if (order.status !== 'draft') {
        setError(
          'Cette commande ne peut pas etre modifiee (statut: ' +
            order.status +
            ')'
        );
        setIsLoading(false);
        return;
      }

      const typedOrder = order as unknown as OrderData;
      const details = typedOrder.sales_order_linkme_details?.[0] ?? null;

      setData({
        order: typedOrder,
        details,
        selectionId: typedOrder.linkme_selection_id ?? null,
      });
      setIsLoading(false);
    }

    void fetchOrder().catch(err => {
      console.error('[ModifierCommandePage] Fetch error:', err);
      setError('Erreur lors du chargement de la commande');
      setIsLoading(false);
    });
  }, [orderId]);

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5DBEBB] mx-auto mb-4" />
          <p className="text-gray-500">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Impossible de modifier cette commande
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/commandes')}
            className="px-4 py-2 bg-[#5DBEBB] text-white rounded-lg hover:bg-[#4DAEAB] transition-colors"
          >
            Retour aux commandes
          </button>
        </div>
      </div>
    );
  }

  return <EditOrderPage data={data} />;
}
