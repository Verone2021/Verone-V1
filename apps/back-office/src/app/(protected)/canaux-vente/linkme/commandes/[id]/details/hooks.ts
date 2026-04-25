'use client';

import { useCallback, useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { createClient } from '@verone/utils/supabase/client';
import { isOrderLocked, useOrderHistory } from '@verone/orders';

import { updateSalesOrderStatus } from '@/app/actions/sales-orders';
import type { NewContactFormData } from '../../../components/contacts/NewContactForm';
import {
  useUpdateLinkMeDetails,
  type LinkMeOrderDetails,
} from '../../../hooks/use-linkme-order-actions';
import {
  useContactsForOrder,
  useCreateContactBO,
} from '../../../hooks/use-organisation-contacts-bo';
import type { ContactRef, FusedContactGroup } from './components/types';
import { useFetchOrder } from './use-fetch-order';

export function useOrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { order, setOrder, enrichedItems, isLoading, error, fetchOrder } =
    useFetchOrder(orderId);

  const { events: historyEvents, loading: historyLoading } =
    useOrderHistory(orderId);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState<
    Record<string, number>
  >({});
  const [isSavingItems, setIsSavingItems] = useState(false);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [editedMargins, setEditedMargins] = useState<Record<string, number>>(
    {}
  );
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const [editingStep, setEditingStep] = useState<
    'responsable' | 'billing' | 'delivery_address' | 'delivery_options' | null
  >(null);
  const [editForm, setEditForm] = useState<Partial<LinkMeOrderDetails>>({});

  const [contactDialogFor, setContactDialogFor] = useState<
    'responsable' | 'billing' | 'delivery' | null
  >(null);
  const [editOrderDateOpen, setEditOrderDateOpen] = useState(false);
  const [editOrderDateValue, setEditOrderDateValue] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );

  const updateDetails = useUpdateLinkMeDetails();
  const createContactBO = useCreateContactBO();

  const enseigneId = order?.organisation?.enseigne_id ?? null;
  const organisationId = order?.organisation?.id ?? null;
  const ownerType =
    order?.linkmeDetails?.owner_type ??
    order?.organisation?.ownership_type ??
    null;
  const isSuccursale = ownerType === 'succursale' || ownerType === 'propre';

  const { allContacts: availableContacts, enseigneName } = useContactsForOrder(
    organisationId,
    enseigneId
  );

  useEffect(() => {
    if (orderId) {
      void fetchOrder().catch(err => {
        console.error('[LinkMeOrderDetails] Initial fetch failed:', err);
      });
    }
  }, [orderId, fetchOrder]);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const result = await updateSalesOrderStatus(
        order!.id,
        newStatus as 'validated' | 'shipped' | 'cancelled' | 'draft',
        user.id
      );
      if (!result.success) throw new Error(result.error ?? 'Update failed');
      void fetchOrder().catch(err =>
        console.error(
          '[LinkMeOrderDetails] Refetch after status change failed:',
          err
        )
      );
    } catch (err) {
      console.error('[LinkMeOrderDetails] Status change failed:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveItems = async () => {
    setIsSavingItems(true);
    try {
      const supabase = createClient();
      // Collect all item IDs that have any changes
      const allChangedIds = new Set([
        ...Object.keys(editedQuantities),
        ...Object.keys(editedPrices),
        ...Object.keys(editedMargins),
      ]);
      for (const itemId of allChangedIds) {
        const item = order!.items.find(i => i.id === itemId);
        if (!item) continue;
        const enriched = enrichedItems.find(e => e.id === itemId);
        const quantity = editedQuantities[itemId] ?? item.quantity;
        const unit_price_ht = editedPrices[itemId] ?? item.unit_price_ht;
        const retrocession_rate =
          editedMargins[itemId] !== undefined
            ? editedMargins[itemId] / 100
            : (enriched?.retrocession_rate ?? 0);
        // total_ht est une colonne GENERATED ALWAYS (quantity * unit_price_ht *
        // (1 - discount/100)) — Postgres rejette tout UPDATE explicite (428C9).
        // retrocession_amount est recalcule par le trigger DB
        // trg_calculate_retrocession sur (unit_price_ht, quantity, retrocession_rate).
        // On envoie donc uniquement les inputs.
        await supabase
          .from('sales_order_items')
          .update({
            quantity,
            unit_price_ht,
            retrocession_rate,
          })
          .eq('id', itemId);
      }
      setEditedQuantities({});
      setEditedPrices({});
      setEditedMargins({});
      void fetchOrder().catch(err => {
        console.error(
          '[LinkMeOrderDetails] Refetch after save items failed:',
          err
        );
      });
    } catch (err) {
      console.error('[LinkMeOrderDetails] Save items failed:', err);
    } finally {
      setIsSavingItems(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from('sales_order_items')
      .delete()
      .eq('id', itemId);
    if (deleteError) {
      console.error('[LinkMeOrderDetails] Delete item failed:', deleteError);
      return;
    }
    const cleanState = (prev: Record<string, number>) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    };
    setEditedQuantities(cleanState);
    setEditedPrices(cleanState);
    setEditedMargins(cleanState);
    void fetchOrder().catch(err => {
      console.error(
        '[LinkMeOrderDetails] Refetch after delete item failed:',
        err
      );
    });
  };

  type NewItemInput = {
    product_id: string;
    quantity: number;
    unit_price_ht: number;
    base_price_ht: number;
    retrocession_rate: number;
    linkme_selection_item_id?: string;
  };
  const handleAddItems = async (newItems: NewItemInput[]) => {
    if (!order) return;
    const supabase = createClient();
    // Idem handleSaveItems : total_ht (GENERATED ALWAYS) et retrocession_amount
    // (trigger trg_calculate_retrocession) sont calcules par la DB. Les envoyer
    // depuis le client provoque une erreur 428C9 sur INSERT comme sur UPDATE.
    const inserts = newItems.map(item => ({
      sales_order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      tax_rate: order.tax_rate ?? 0.2,
      retrocession_rate: item.retrocession_rate,
      base_price_ht_locked: item.base_price_ht,
      selling_price_ht_locked: item.unit_price_ht,
      linkme_selection_item_id: item.linkme_selection_item_id ?? null,
    }));
    const { error: insertError } = await supabase
      .from('sales_order_items')
      .insert(inserts);
    if (insertError) {
      console.error('[LinkMeOrderDetails] Add items failed:', insertError);
      return;
    }
    setShowAddProductModal(false);
    void fetchOrder().catch(err =>
      console.error('[LinkMeOrderDetails] Refetch after add items failed:', err)
    );
  };

  const openEditDialog = (
    step: 'responsable' | 'billing' | 'delivery_address' | 'delivery_options'
  ) => {
    if (!order?.linkmeDetails) return;
    const d = order.linkmeDetails;
    if (step === 'responsable') {
      setEditForm({
        requester_type: d.requester_type,
        requester_name: d.requester_name,
        requester_email: d.requester_email,
        requester_phone: d.requester_phone,
        requester_position: d.requester_position,
      });
    } else if (step === 'billing') {
      setEditForm({
        billing_contact_source: d.billing_contact_source,
        billing_name: d.billing_name,
        billing_email: d.billing_email,
        billing_phone: d.billing_phone,
      });
    } else if (step === 'delivery_address') {
      setEditForm({
        delivery_address: d.delivery_address,
        delivery_postal_code: d.delivery_postal_code,
        delivery_city: d.delivery_city,
      });
    } else if (step === 'delivery_options') {
      setEditForm({
        delivery_notes: d.delivery_notes,
        desired_delivery_date: d.desired_delivery_date,
        is_mall_delivery: d.is_mall_delivery,
        mall_email: d.mall_email,
        semi_trailer_accessible: d.semi_trailer_accessible,
        confirmed_delivery_date: d.confirmed_delivery_date,
      });
    }
    setEditingStep(step);
  };

  const handleSaveEdit = async () => {
    if (!editingStep) return;
    try {
      await updateDetails.mutateAsync({ orderId, updates: editForm });
      setEditingStep(null);
      setEditForm({});
      void fetchOrder().catch(err => {
        console.error(
          '[LinkMeOrderDetails] Refetch after save edit failed:',
          err
        );
      });
    } catch (err) {
      console.error('Erreur mise à jour:', err);
    }
  };

  const handleConfirmContact = async () => {
    if (!contactDialogFor || !selectedContactId) return;
    const supabase = createClient();
    const fkField =
      contactDialogFor === 'responsable'
        ? 'responsable_contact_id'
        : contactDialogFor === 'billing'
          ? 'billing_contact_id'
          : 'delivery_contact_id';
    try {
      const { error: updateError } = await supabase
        .from('sales_orders')
        .update({ [fkField]: selectedContactId })
        .eq('id', orderId);
      if (updateError) throw updateError;
      setContactDialogFor(null);
      setSelectedContactId(null);
      void fetchOrder().catch(err => {
        console.error(
          '[LinkMeOrderDetails] Refetch after contact select failed:',
          err
        );
      });
    } catch (err) {
      console.error('Erreur mise à jour contact:', err);
    }
  };

  const handleCreateAndSelectContact = async (
    contactData: NewContactFormData
  ) => {
    const isDeliveryOnly =
      contactDialogFor === 'delivery' && !organisationId && !enseigneId;
    const result = await createContactBO.mutateAsync({
      organisationId:
        isDeliveryOnly || isSuccursale
          ? undefined
          : (organisationId ?? undefined),
      enseigneId: isSuccursale ? (enseigneId ?? undefined) : undefined,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone || undefined,
      title: contactData.title || undefined,
      isPrimaryContact: contactDialogFor === 'responsable',
      isBillingContact: contactDialogFor === 'billing',
    });
    const supabase = createClient();
    const fkField =
      contactDialogFor === 'responsable'
        ? 'responsable_contact_id'
        : contactDialogFor === 'billing'
          ? 'billing_contact_id'
          : 'delivery_contact_id';
    await supabase
      .from('sales_orders')
      .update({ [fkField]: result.id })
      .eq('id', orderId);
    setContactDialogFor(null);
    setSelectedContactId(null);
    void fetchOrder().catch(err => {
      console.error(
        '[LinkMeOrderDetails] Refetch after create contact failed:',
        err
      );
    });
  };

  const handleUpdateOrganisation = useCallback(
    async (orgId: string, updates: Record<string, unknown>) => {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('organisations')
        .update(updates)
        .eq('id', orgId);
      if (updateError) {
        console.error('[Organisation] Update failed:', updateError);
        return;
      }
      if (order?.organisation) {
        setOrder(prev =>
          prev
            ? {
                ...prev,
                organisation: {
                  ...prev.organisation,
                  ...updates,
                } as typeof prev.organisation,
              }
            : prev
        );
      }
    },
    [order, setOrder]
  );

  const handleUseOrgAddress = async () => {
    const org = order?.organisation;
    if (!org) return;
    const useShipping = org.has_different_shipping_address;
    const updates: Partial<LinkMeOrderDetails> = {
      delivery_address: useShipping
        ? [org.shipping_address_line1, org.shipping_address_line2]
            .filter(Boolean)
            .join(', ')
        : [org.address_line1, org.address_line2].filter(Boolean).join(', '),
      delivery_postal_code: useShipping
        ? org.shipping_postal_code
        : org.postal_code,
      delivery_city: useShipping ? org.shipping_city : org.city,
    };
    await updateDetails.mutateAsync({ orderId, updates });
    void fetchOrder().catch((err: unknown) => {
      console.error(
        '[LinkMeOrderDetails] Refetch after use org address failed:',
        err
      );
    });
  };

  const handleOpenContactDialog = (
    role: 'responsable' | 'billing' | 'delivery'
  ) => {
    setSelectedContactId(null);
    setContactDialogFor(role);
  };

  const locked = order ? isOrderLocked(order.status) : false;

  const fusedContacts: FusedContactGroup[] = (() => {
    if (!order) return [];
    const groups: FusedContactGroup[] = [];
    const seenIds = new Set<string>();
    const addOrMerge = (
      contact: ContactRef | null,
      role: 'responsable' | 'billing' | 'delivery'
    ) => {
      if (!contact) return;
      if (seenIds.has(contact.id)) {
        const existing = groups.find(g => g.contact.id === contact.id);
        if (existing && !existing.roles.includes(role))
          existing.roles.push(role);
      } else {
        seenIds.add(contact.id);
        groups.push({ contact, roles: [role] });
      }
    };
    addOrMerge(order.responsable_contact, 'responsable');
    addOrMerge(order.billing_contact, 'billing');
    addOrMerge(order.delivery_contact, 'delivery');
    return groups;
  })();

  const deliveryAddressMatchesOrg = (() => {
    if (!order) return false;
    const org = order.organisation;
    const details = order.linkmeDetails;
    const orgAddress = org?.has_different_shipping_address
      ? org.shipping_address_line1
      : org?.address_line1;
    const orgCity = org?.has_different_shipping_address
      ? org.shipping_city
      : org?.city;
    const deliveryNorm = (details?.delivery_address ?? '').toLowerCase().trim();
    const orgNorm = (orgAddress ?? '').toLowerCase().trim();
    const cityMatch =
      (details?.delivery_city ?? '').toLowerCase().trim() ===
      (orgCity ?? '').toLowerCase().trim();
    return (
      deliveryNorm.length > 0 &&
      orgNorm.length > 0 &&
      deliveryNorm.includes(orgNorm) &&
      cityMatch
    );
  })();

  return {
    order,
    setOrder,
    enrichedItems,
    isLoading,
    error,
    historyEvents,
    historyLoading,
    isUpdatingStatus,
    editedQuantities,
    setEditedQuantities,
    editedPrices,
    setEditedPrices,
    editedMargins,
    setEditedMargins,
    showAddProductModal,
    setShowAddProductModal,
    isSavingItems,
    hasItemChanges:
      Object.keys(editedQuantities).length > 0 ||
      Object.keys(editedPrices).length > 0 ||
      Object.keys(editedMargins).length > 0,
    editingStep,
    setEditingStep,
    editForm,
    setEditForm,
    contactDialogFor,
    setContactDialogFor,
    editOrderDateOpen,
    setEditOrderDateOpen,
    editOrderDateValue,
    setEditOrderDateValue,
    showQuoteModal,
    setShowQuoteModal,
    selectedContactId,
    setSelectedContactId,
    availableContacts,
    orgLabel:
      order?.organisation?.trade_name ??
      order?.organisation?.legal_name ??
      null,
    enseigneLabel: enseigneName,
    locked,
    fusedContacts,
    deliveryAddressMatchesOrg,
    updateDetails,
    createContactBO,
    orderId,
    fetchOrder,
    handleStatusChange,
    handleSaveItems,
    handleDeleteItem,
    handleAddItems,
    openEditDialog,
    handleSaveEdit,
    handleConfirmContact,
    handleCreateAndSelectContact,
    handleUpdateOrganisation,
    handleUseOrgAddress,
    handleOpenContactDialog,
  };
}
