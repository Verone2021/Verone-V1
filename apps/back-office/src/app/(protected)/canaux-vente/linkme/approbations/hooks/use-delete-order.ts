'use client';

import { useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { PendingOrder } from '../../hooks/use-linkme-order-actions';

interface UseDeleteOrderOptions {
  onSuccess: () => void;
}

export function useDeleteOrder({ onSuccess }: UseDeleteOrderOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteOrder = async (order: PendingOrder) => {
    setIsDeleting(true);
    try {
      const supabase = createClient();

      const isNewRestaurant = order.linkme_details?.is_new_restaurant;
      let orgIdToDelete: string | null = null;

      if (isNewRestaurant) {
        const { data: orderData } = await supabase
          .from('sales_orders')
          .select('customer_id, customer_type')
          .eq('id', order.id)
          .single();

        if (
          orderData?.customer_type === 'organization' &&
          orderData.customer_id
        ) {
          const { count } = await supabase
            .from('sales_orders')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', orderData.customer_id)
            .neq('id', order.id);

          if (count === 0) {
            orgIdToDelete = orderData.customer_id;
          }
        }
      }

      await supabase
        .from('sales_order_linkme_details')
        .delete()
        .eq('sales_order_id', order.id);

      await supabase
        .from('linkme_info_requests')
        .delete()
        .eq('sales_order_id', order.id);

      await supabase
        .from('sales_order_items')
        .delete()
        .eq('sales_order_id', order.id);

      const { error } = await supabase
        .from('sales_orders')
        .delete()
        .eq('id', order.id);

      if (error) throw error;

      if (orgIdToDelete) {
        await supabase
          .from('contacts')
          .delete()
          .eq('organisation_id', orgIdToDelete);

        await supabase.from('organisations').delete().eq('id', orgIdToDelete);
      }

      onSuccess();
    } catch (err) {
      console.error('[Approbations] Delete failed:', err);
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteOrder, isDeleting };
}
