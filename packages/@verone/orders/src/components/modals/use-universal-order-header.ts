'use client';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { OrderHeader } from './universal-order-modal.types';

interface UseUniversalOrderHeaderProps {
  orderId: string | null;
  orderType: 'sales' | 'purchase' | null;
  open: boolean;
}

export function useUniversalOrderHeader({
  orderId,
  orderType,
  open,
}: UseUniversalOrderHeaderProps) {
  const [orderHeader, setOrderHeader] = useState<OrderHeader | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !orderType || !open) {
      setOrderHeader(null);
      return;
    }

    const fetchOrderHeader = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        if (orderType === 'sales') {
          const { data: order, error: orderError } = (await supabase
            .from('sales_orders')
            .select(
              'id, order_number, status, created_at, expected_delivery_date, total_ht, total_ttc, customer_id, customer_type, billing_address, shipping_address, payment_terms, payment_status_v2, tax_rate, currency, eco_tax_vat_rate, shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate, created_by, channel_id, sales_channels!left(id, name, code)'
            )
            .eq('id', orderId)
            .single()) as any;

          if (orderError) throw orderError;

          let customerName = 'Client inconnu';
          let customerTradeName: string | null = null;

          if (order.customer_type === 'organization' && order.customer_id) {
            const { data: org } = await supabase
              .from('organisations')
              .select('legal_name, trade_name')
              .eq('id', order.customer_id)
              .single();
            customerName = org?.legal_name || 'Organisation inconnue';
            customerTradeName =
              org?.trade_name && org.trade_name !== org?.legal_name
                ? org.trade_name
                : null;
          } else if (
            order.customer_type === 'individual' &&
            order.individual_customer_id
          ) {
            const { data: individual } = await supabase
              .from('individual_customers')
              .select('first_name, last_name')
              .eq('id', order.individual_customer_id)
              .single();
            customerName = individual
              ? `${individual.first_name} ${individual.last_name}`
              : 'Particulier inconnu';
          }

          let creatorName = '';
          let creatorEmail = '';

          if (order.created_by) {
            const { data: creatorInfo } = await (supabase.rpc as any)(
              'get_user_info',
              { p_user_id: order.created_by }
            );

            if (creatorInfo && creatorInfo.length > 0) {
              const firstName = creatorInfo[0].first_name || 'Utilisateur';
              const lastName = creatorInfo[0].last_name || '';
              creatorName = `${firstName} ${lastName}`.trim();
              creatorEmail = creatorInfo[0].email || '';
            }
          }

          const channelName = order.sales_channels?.name || '';

          setOrderHeader({
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            created_at: order.created_at,
            expected_delivery_date: order.expected_delivery_date,
            total_ht: order.total_ht ?? 0,
            total_ttc: order.total_ttc,
            customer_id: order.customer_id,
            customer_name: customerName,
            customer_trade_name: customerTradeName,
            customer_type:
              order.customer_type === 'individual'
                ? 'individual'
                : 'organization',
            billing_address: order.billing_address ?? null,
            shipping_address: order.shipping_address ?? null,
            payment_terms: order.payment_terms,
            payment_status_v2: order.payment_status_v2,
            tax_rate: order.tax_rate,
            currency: order.currency ?? 'EUR',
            eco_tax_vat_rate: order.eco_tax_vat_rate,
            shipping_cost_ht: order.shipping_cost_ht,
            handling_cost_ht: order.handling_cost_ht,
            insurance_cost_ht: order.insurance_cost_ht,
            fees_vat_rate: order.fees_vat_rate,
            creator_name: creatorName,
            creator_email: creatorEmail,
            channel_name: channelName,
          });
        } else if (orderType === 'purchase') {
          const { data: order, error: orderError } = (await supabase
            .from('purchase_orders')
            .select(
              'id, po_number, status, created_at, expected_delivery_date, total_ttc, supplier_id, delivery_address, payment_terms, tax_rate, eco_tax_vat_rate'
            )
            .eq('id', orderId)
            .single()) as any;

          if (orderError) throw orderError;

          let supplierName = 'Fournisseur inconnu';

          if (order.supplier_id) {
            const { data: supplier } = await supabase
              .from('organisations')
              .select('legal_name, trade_name')
              .eq('id', order.supplier_id)
              .single();
            supplierName =
              supplier?.trade_name ||
              supplier?.legal_name ||
              'Fournisseur inconnu';
          }

          setOrderHeader({
            id: order.id,
            order_number: order.po_number,
            status: order.status,
            created_at: order.created_at,
            expected_delivery_date: order.expected_delivery_date,
            total_ttc: order.total_ttc,
            supplier_name: supplierName,
            delivery_address: order.delivery_address
              ? JSON.stringify(order.delivery_address)
              : null,
            payment_terms: order.payment_terms,
            tax_rate: order.tax_rate,
            eco_tax_vat_rate: order.eco_tax_vat_rate,
          });
        }
      } catch (err: unknown) {
        const supaError = err as {
          message?: string;
          code?: string;
          details?: string;
          hint?: string;
        };
        console.error(
          '[UniversalOrderDetailsModal] Erreur chargement en-tête commande:',
          {
            orderId,
            orderType,
            errorMessage: supaError.message,
            errorCode: supaError.code,
            errorDetails: supaError.details,
            errorHint: supaError.hint,
            fullError: err,
          }
        );

        const errorMessage =
          supaError.message ??
          `Impossible de charger la commande ${orderType === 'sales' ? 'client' : 'fournisseur'}`;

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrderHeader();
  }, [orderId, orderType, open]);

  return { orderHeader, setOrderHeader, loading, error };
}

/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-explicit-any */
