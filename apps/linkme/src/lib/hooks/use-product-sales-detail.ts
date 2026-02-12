/**
 * Hook: useProductSalesDetail
 * Récupère le détail de TOUTES les ventes d'un produit spécifique pour l'affilié.
 *
 * Données : commandes, quantités, CA, statuts, clients.
 * Zero commission, zero marge.
 *
 * @module use-product-sales-detail
 * @since 2026-02-10
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type { ProductSource } from './use-all-products-stats';
import { useUserAffiliate } from './use-user-selection';

const supabase = createClient();

// ============================================
// TYPES
// ============================================

export interface ProductSaleDetail {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  quantity: number;
  unitPriceHT: number;
  totalHT: number;
  totalTTC: number;
  orderStatus: string;
}

export interface ProductSalesDetailResult {
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl: string | null;
  productSource: ProductSource;
  sales: ProductSaleDetail[];
  totals: {
    totalOrders: number;
    totalQuantity: number;
    totalRevenueHT: number;
    totalRevenueTTC: number;
  };
}

// ============================================
// HOOK
// ============================================

export function useProductSalesDetail(productId: string | null) {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['product-sales-detail', affiliate?.id, productId],
    queryFn: async (): Promise<ProductSalesDetailResult | null> => {
      if (!affiliate || !productId) return null;

      // 1. Get all order_ids for this affiliate via commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('linkme_commissions')
        .select('order_id')
        .eq('affiliate_id', affiliate.id);

      if (commissionsError) {
        console.error('Erreur fetch commissions:', commissionsError);
        throw commissionsError;
      }

      const orderIds = (commissionsData ?? [])
        .map(c => c.order_id)
        .filter((id): id is string => !!id);

      if (orderIds.length === 0) {
        return buildEmptyResult(productId);
      }

      // 2. Get order items for this product across all affiliate orders
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('linkme_order_items_enriched')
        .select(
          'sales_order_id, product_id, quantity, total_ht, tax_rate, unit_price_ht'
        )
        .eq('product_id', productId)
        .in('sales_order_id', orderIds);

      if (orderItemsError) {
        console.error('Erreur fetch order items:', orderItemsError);
        throw orderItemsError;
      }

      const orderItems = orderItemsData ?? [];

      if (orderItems.length === 0) {
        return buildEmptyResult(productId);
      }

      // 3. Get order details from enriched view
      const relevantOrderIds = [
        ...new Set(
          orderItems
            .map(item => item.sales_order_id)
            .filter((id): id is string => !!id)
        ),
      ];

      const { data: ordersData, error: ordersError } = await supabase
        .from('linkme_orders_enriched')
        .select('id, order_number, status, customer_name, created_at')
        .in('id', relevantOrderIds);

      if (ordersError) {
        console.error('Erreur fetch orders:', ordersError);
        throw ordersError;
      }

      const ordersMap = new Map((ordersData ?? []).map(o => [o.id, o]));

      // 4. Get product info + image + source detection
      const [productResult, imageResult, productTypeResult] = await Promise.all(
        [
          supabase
            .from('products')
            .select('id, name, sku')
            .eq('id', productId)
            .single(),
          supabase
            .from('product_images')
            .select('public_url')
            .eq('product_id', productId)
            .eq('is_primary', true)
            .limit(1),
          supabase
            .from('products')
            .select('created_by_affiliate, enseigne_id, assigned_client_id')
            .eq('id', productId)
            .single(),
        ]
      );

      const productName = productResult.data?.name ?? 'Produit inconnu';
      const productSku = productResult.data?.sku ?? '';
      const productImageUrl = imageResult.data?.[0]?.public_url ?? null;

      // Detect source
      let productSource: ProductSource = 'catalogue';
      if (productTypeResult.data) {
        if (productTypeResult.data.created_by_affiliate !== null) {
          productSource = 'mes-produits';
        } else if (
          productTypeResult.data.enseigne_id !== null ||
          productTypeResult.data.assigned_client_id !== null
        ) {
          productSource = 'sur-mesure';
        }
      }

      // 5. Build sales list
      const sales: ProductSaleDetail[] = orderItems.map(item => {
        const order = ordersMap.get(item.sales_order_id ?? '');
        const qty = item.quantity ?? 0;
        const totalHT = item.total_ht ?? 0;
        const taxRate = item.tax_rate ?? 0;
        const totalTTC = totalHT * (1 + taxRate / 100);
        const unitPriceHT = item.unit_price_ht ?? (qty > 0 ? totalHT / qty : 0);

        return {
          orderId: item.sales_order_id ?? '',
          orderNumber: order?.order_number ?? 'N/A',
          orderDate: order?.created_at ?? '',
          customerName: order?.customer_name ?? 'Client inconnu',
          quantity: qty,
          unitPriceHT,
          totalHT,
          totalTTC,
          orderStatus: order?.status ?? 'pending',
        };
      });

      // Sort by date descending
      sales.sort(
        (a, b) =>
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );

      // 6. Compute totals
      const totals = sales.reduce(
        (acc, s) => ({
          totalOrders: acc.totalOrders,
          totalQuantity: acc.totalQuantity + s.quantity,
          totalRevenueHT: acc.totalRevenueHT + s.totalHT,
          totalRevenueTTC: acc.totalRevenueTTC + s.totalTTC,
        }),
        {
          totalOrders: relevantOrderIds.length,
          totalQuantity: 0,
          totalRevenueHT: 0,
          totalRevenueTTC: 0,
        }
      );

      return {
        productId,
        productName,
        productSku,
        productImageUrl,
        productSource,
        sales,
        totals,
      };
    },
    enabled: !!affiliate && !!productId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

function buildEmptyResult(productId: string): ProductSalesDetailResult {
  return {
    productId,
    productName: '',
    productSku: '',
    productImageUrl: null,
    productSource: 'catalogue',
    sales: [],
    totals: {
      totalOrders: 0,
      totalQuantity: 0,
      totalRevenueHT: 0,
      totalRevenueTTC: 0,
    },
  };
}
