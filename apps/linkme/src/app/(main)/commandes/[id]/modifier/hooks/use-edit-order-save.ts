import { useMemo, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import {
  useUpdateDraftOrder,
  type UpdateDraftOrderItemInput,
} from '../../../../../../lib/hooks/use-update-draft-order';
import type { EditableItem } from '../types';
import type { FullOrderData } from '../page';

// ============================================================================
// TYPES
// ============================================================================

interface ResolvedContact {
  name: string;
  email: string;
  phone: string;
}

interface ResolvedAddress {
  address: string;
  postalCode: string;
  city: string;
}

interface UseEditOrderSaveParams {
  orderId: string;
  details: FullOrderData['details'];
  items: EditableItem[];
  desiredDeliveryDate: string;
  resolvedResponsable: ResolvedContact;
  resolvedBillingContact: ResolvedContact;
  resolvedDeliveryContact: ResolvedContact;
  resolvedDeliveryAddress: ResolvedAddress;
  isMallDelivery: boolean;
  mallEmail: string;
  semiTrailerAccessible: boolean;
  deliveryNotes: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useEditOrderSave({
  orderId,
  details,
  items,
  desiredDeliveryDate,
  resolvedResponsable,
  resolvedBillingContact,
  resolvedDeliveryContact,
  resolvedDeliveryAddress,
  isMallDelivery,
  mallEmail,
  semiTrailerAccessible,
  deliveryNotes,
}: UseEditOrderSaveParams) {
  const router = useRouter();
  const updateOrder = useUpdateDraftOrder();

  // ---- Computed: Has changes ----
  const hasChanges = useMemo(() => {
    const itemsChanged = items.some(
      item =>
        item.quantity !== item.originalQuantity ||
        item.unit_price_ht !== item.original_unit_price_ht ||
        item._delete ||
        item._isNew
    );

    // For contacts/addresses, compare resolved values against original details
    const d = details;
    const detailsChanged =
      resolvedResponsable.name !== (d?.requester_name ?? '') ||
      resolvedResponsable.email !== (d?.requester_email ?? '') ||
      resolvedResponsable.phone !== (d?.requester_phone ?? '') ||
      resolvedBillingContact.name !== (d?.billing_name ?? '') ||
      resolvedBillingContact.email !== (d?.billing_email ?? '') ||
      resolvedBillingContact.phone !== (d?.billing_phone ?? '') ||
      resolvedDeliveryContact.name !== (d?.delivery_contact_name ?? '') ||
      resolvedDeliveryContact.email !== (d?.delivery_contact_email ?? '') ||
      resolvedDeliveryContact.phone !== (d?.delivery_contact_phone ?? '') ||
      resolvedDeliveryAddress.address !== (d?.delivery_address ?? '') ||
      resolvedDeliveryAddress.postalCode !== (d?.delivery_postal_code ?? '') ||
      resolvedDeliveryAddress.city !== (d?.delivery_city ?? '') ||
      desiredDeliveryDate !== (d?.desired_delivery_date ?? '') ||
      isMallDelivery !== (d?.is_mall_delivery ?? false) ||
      mallEmail !== (d?.mall_email ?? '') ||
      semiTrailerAccessible !== (d?.semi_trailer_accessible ?? true) ||
      deliveryNotes !== (d?.delivery_notes ?? '');

    return itemsChanged || detailsChanged;
  }, [
    items,
    details,
    resolvedResponsable,
    resolvedBillingContact,
    resolvedDeliveryContact,
    resolvedDeliveryAddress,
    desiredDeliveryDate,
    isMallDelivery,
    mallEmail,
    semiTrailerAccessible,
    deliveryNotes,
  ]);

  // ---- Handler: Save ----
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    const itemsInput: UpdateDraftOrderItemInput[] = items
      .filter(item => {
        if (item._isNew) return true;
        if (item._delete) return true;
        if (item.quantity !== item.originalQuantity) return true;
        if (item.unit_price_ht !== item.original_unit_price_ht) return true;
        return false;
      })
      .map(item => ({
        id: item._isNew ? undefined : item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        _delete: item._delete,
      }));

    const finalItems =
      itemsInput.length > 0
        ? itemsInput
        : items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            _delete: item._delete,
          }));

    try {
      const result = await updateOrder.mutateAsync({
        orderId,
        items: finalItems,
        desiredDeliveryDate: desiredDeliveryDate || undefined,
        requesterInfo: {
          name: resolvedResponsable.name,
          email: resolvedResponsable.email,
          phone: resolvedResponsable.phone || undefined,
        },
      });

      if (result.success) {
        const supabase = (
          await import('@verone/utils/supabase/client')
        ).createClient();
        const { error: detailsError } = await supabase
          .from('sales_order_linkme_details')
          .update({
            billing_name: resolvedBillingContact.name || null,
            billing_email: resolvedBillingContact.email || null,
            billing_phone: resolvedBillingContact.phone || null,
            delivery_contact_name: resolvedDeliveryContact.name || null,
            delivery_contact_email: resolvedDeliveryContact.email || null,
            delivery_contact_phone: resolvedDeliveryContact.phone || null,
            delivery_address: resolvedDeliveryAddress.address || null,
            delivery_postal_code: resolvedDeliveryAddress.postalCode || null,
            delivery_city: resolvedDeliveryAddress.city || null,
            is_mall_delivery: isMallDelivery,
            mall_email: mallEmail || null,
            semi_trailer_accessible: semiTrailerAccessible,
            delivery_notes: deliveryNotes || null,
          })
          .eq('sales_order_id', orderId);

        if (detailsError) {
          console.error(
            '[EditOrderPage] Error updating linkme details:',
            detailsError
          );
        }

        toast.success('Commande mise a jour avec succes');
        router.push('/commandes');
      } else {
        toast.error(result.error ?? 'Erreur lors de la mise a jour');
      }
    } catch (err) {
      console.error('[EditOrderPage] Save error:', err);
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [
    hasChanges,
    items,
    orderId,
    desiredDeliveryDate,
    resolvedResponsable,
    resolvedBillingContact,
    resolvedDeliveryContact,
    resolvedDeliveryAddress,
    isMallDelivery,
    mallEmail,
    semiTrailerAccessible,
    deliveryNotes,
    updateOrder,
    router,
  ]);

  return {
    hasChanges,
    handleSave,
    isPending: updateOrder.isPending,
  };
}
