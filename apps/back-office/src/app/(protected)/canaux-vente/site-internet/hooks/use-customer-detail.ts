'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

import { SITE_INTERNET_CHANNEL_ID } from '../constants';

const supabase = createClient();

export interface CustomerOrder {
  id: string;
  order_number: string | null;
  status: string | null;
  payment_status_v2: string | null;
  total_ttc: number | null;
  created_at: string | null;
}

export interface CustomerAddress {
  id: string;
  label: string | null;
  first_name: string;
  last_name: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}

export interface CustomerActivity {
  wishlistCount: number;
  reviewsCount: number;
}

export interface CustomerDetailData {
  orders: CustomerOrder[];
  totalSpent: number;
  orderCount: number;
  addresses: CustomerAddress[];
  activity: CustomerActivity;
}

async function fetchCustomerDetail(
  customerId: string,
  authUserId: string | null
): Promise<CustomerDetailData> {
  const [ordersResult, addressesResult, wishlistResult, reviewsResult] =
    await Promise.all([
      // Orders for this customer on site-internet channel
      supabase
        .from('sales_orders')
        .select(
          'id, order_number, status, payment_status_v2, total_ttc, created_at'
        )
        .eq('individual_customer_id', customerId)
        .eq('channel_id', SITE_INTERNET_CHANNEL_ID)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(50),

      // Addresses (linked via auth_user_id)
      authUserId
        ? supabase
            .from('customer_addresses')
            .select(
              'id, label, first_name, last_name, address, postal_code, city, country, phone, is_default'
            )
            .eq('user_id', authUserId)
            .order('is_default', { ascending: false })
        : Promise.resolve({ data: [] as CustomerAddress[], error: null }),

      // Wishlist count
      authUserId
        ? supabase
            .from('wishlist_items')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', authUserId)
        : Promise.resolve({ count: 0, error: null }),

      // Reviews count
      authUserId
        ? supabase
            .from('product_reviews')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', authUserId)
        : Promise.resolve({ count: 0, error: null }),
    ]);

  const orders = (ordersResult.data ?? []) as CustomerOrder[];
  const paidOrders = orders.filter(o => o.payment_status_v2 === 'paid');
  const totalSpent = paidOrders.reduce(
    (sum, o) => sum + (Number(o.total_ttc) || 0),
    0
  );

  return {
    orders,
    totalSpent: Math.round(totalSpent * 100) / 100,
    orderCount: orders.length,
    addresses: addressesResult.data ?? [],
    activity: {
      wishlistCount: wishlistResult.count ?? 0,
      reviewsCount: reviewsResult.count ?? 0,
    },
  };
}

export function useCustomerDetail(
  customerId: string | null,
  authUserId: string | null
) {
  return useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: () => fetchCustomerDetail(customerId!, authUserId),
    enabled: !!customerId,
    staleTime: 60_000,
  });
}
