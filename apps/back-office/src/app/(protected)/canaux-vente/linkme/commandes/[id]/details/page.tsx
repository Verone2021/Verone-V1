/* eslint-disable max-lines */
'use client';

/**
 * Page: Gestion complète Commande LinkMe
 *
 * Layout 2 colonnes:
 * - Gauche: Restaurant, Items (éditables), Livraison, Historique, Frais, Totaux
 * - Droite: Statut + Actions, Contacts (Responsable, Facturation), Paiement, Rapprochement, Factures, Notes
 *
 * Différences vs page approbation ([id]/page.tsx):
 * - PAS de dialogs approve/reject/request info
 * - Gestion statut (draft→validated→shipped→delivered, cancel)
 * - FeesSection + InvoicesSection
 * - Items éditables (quantités en draft)
 */

import { useCallback, useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Badge, Button, Skeleton } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { ArrowLeft, AlertCircle, Lock } from 'lucide-react';

import {
  useUpdateLinkMeDetails,
  type LinkMeOrderDetails,
} from '../../../hooks/use-linkme-order-actions';

import {
  useOrganisationContactsBO,
  useEnseigneContactsBO,
  useCreateContactBO,
  type ContactBO,
} from '../../../hooks/use-organisation-contacts-bo';

import { isOrderLocked, useOrderHistory } from '@verone/orders';
import { updateSalesOrderStatus } from '@/app/actions/sales-orders';
import type { NewContactFormData } from '../../../components/contacts/NewContactForm';

import type {
  OrderWithDetails,
  EnrichedOrderItem,
  ContactRef,
  FusedContactGroup,
  SalesOrderItemRaw,
  LinkmeOrderItemEnrichedRaw,
  CreatedByProfile,
  InfoRequest,
} from './components/types';
import { getOrderChannel } from './components/types';
import { LeftColumn } from './components/LeftColumn';
import { RightColumn } from './components/RightColumn';
import { EditDialogs } from './components/EditDialogs';

// ============================================
// PAGE COMPONENT
// ============================================

export default function LinkMeOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Order history timeline
  const { events: historyEvents, loading: historyLoading } =
    useOrderHistory(orderId);

  // Status management
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Editable items
  const [editedQuantities, setEditedQuantities] = useState<
    Record<string, number>
  >({});
  const [isSavingItems, setIsSavingItems] = useState(false);

  // Dialogs édition par section
  const [editingStep, setEditingStep] = useState<
    'responsable' | 'billing' | 'delivery_address' | 'delivery_options' | null
  >(null);
  const [editForm, setEditForm] = useState<Partial<LinkMeOrderDetails>>({});

  // Dialog sélection contact
  const [contactDialogFor, setContactDialogFor] = useState<
    'responsable' | 'billing' | 'delivery' | null
  >(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );

  // Mutations
  const updateDetails = useUpdateLinkMeDetails();
  const createContactBO = useCreateContactBO();

  // Contacts hooks
  const enseigneId = order?.organisation?.enseigne_id ?? null;
  const organisationId = order?.organisation?.id ?? null;
  const ownerType = order?.linkmeDetails?.owner_type;
  const isSuccursale = ownerType === 'propre' || ownerType === 'succursale';

  const { data: enseigneContactsData } = useEnseigneContactsBO(
    isSuccursale ? enseigneId : null
  );
  const { data: orgContactsData } = useOrganisationContactsBO(
    !isSuccursale ? organisationId : null
  );

  const availableContacts: ContactBO[] =
    (isSuccursale
      ? enseigneContactsData?.contacts
      : orgContactsData?.contacts) ?? [];

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      // Main query WITHOUT contacts FK JOINs (avoids heavy RLS evaluation)
      const { data: orderData, error: orderError } = await supabase
        .from('sales_orders')
        .select(
          `
          id, order_number, linkme_display_number, created_at, status, total_ht, total_ttc, notes,
          customer_id, customer_type, expected_delivery_date, pending_admin_validation,
          created_by_affiliate_id, linkme_selection_id, created_by,
          payment_status_v2, payment_terms, currency, tax_rate,
          shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate,
          responsable_contact_id, billing_contact_id, delivery_contact_id,
          organisations!sales_orders_customer_id_fkey (
            id, trade_name, legal_name, approval_status, enseigne_id,
            address_line1, address_line2, postal_code, city,
            billing_address_line1, billing_address_line2, billing_city, billing_postal_code,
            shipping_address_line1, shipping_address_line2, shipping_city, shipping_postal_code,
            has_different_shipping_address, phone, email, siret, country, vat_number
          ),
          sales_order_linkme_details (
            id, sales_order_id, requester_type, requester_name, requester_email,
            requester_phone, requester_position, is_new_restaurant, owner_type,
            owner_contact_same_as_requester, owner_name, owner_email, owner_phone,
            owner_company_legal_name, owner_company_trade_name, owner_kbis_url,
            billing_contact_source, billing_name, billing_email, billing_phone,
            delivery_terms_accepted, delivery_date, desired_delivery_date,
            mall_form_required, mall_form_email,
            delivery_contact_name, delivery_contact_email, delivery_contact_phone,
            delivery_address, delivery_postal_code, delivery_city, delivery_notes,
            is_mall_delivery, mall_email, semi_trailer_accessible,
            access_form_required, access_form_url,
            step4_token, step4_token_expires_at, step4_completed_at,
            reception_contact_name, reception_contact_email, reception_contact_phone,
            confirmed_delivery_date, created_at, updated_at
          ),
          linkme_info_requests (
            id, token, recipient_email, recipient_type, sent_at,
            completed_at, cancelled_at, cancelled_reason
          ),
          sales_order_items (
            id, product_id, quantity, unit_price_ht, total_ht,
            products ( name, sku )
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch contacts separately by PK (fast, avoids heavy RLS on FK JOINs)
      const respContactId = (orderData as Record<string, unknown>)
        .responsable_contact_id as string | null;
      const billContactId = (orderData as Record<string, unknown>)
        .billing_contact_id as string | null;
      const delContactId = (orderData as Record<string, unknown>)
        .delivery_contact_id as string | null;

      const uniqueContactIds = [
        ...new Set(
          [respContactId, billContactId, delContactId].filter(Boolean)
        ),
      ] as string[];

      const contactFields = 'id, first_name, last_name, email, phone, title';

      // Organisation data comes from the JOIN in the main query (no separate fetch needed)
      const orgJoinData = (orderData as Record<string, unknown>).organisations;
      const organisation = (orgJoinData ??
        null) as OrderWithDetails['organisation'];

      const linkmeDetailsRaw: unknown = orderData.sales_order_linkme_details;
      const linkmeData = (
        Array.isArray(linkmeDetailsRaw)
          ? (linkmeDetailsRaw[0] ?? null)
          : (linkmeDetailsRaw ?? null)
      ) as LinkMeOrderDetails | null;

      const infoRequestsRaw: unknown = (orderData as Record<string, unknown>)
        .linkme_info_requests;
      const infoRequests = (
        Array.isArray(infoRequestsRaw) ? infoRequestsRaw : []
      ) as InfoRequest[];

      // Fetch contacts, user profile + bank transaction match in parallel
      const createdByUserId = (orderData as Record<string, unknown>)
        .created_by as string | null;
      const [contactResults, profileResult, linkResult] = await Promise.all([
        Promise.all(
          uniqueContactIds.map(id =>
            supabase
              .from('contacts')
              .select(contactFields)
              .eq('id', id)
              .single()
              .then(r => ({ id, data: r.data as ContactRef | null }))
          )
        ),
        createdByUserId
          ? supabase
              .from('user_profiles')
              .select('first_name, last_name, email')
              .eq('user_id', createdByUserId)
              .single()
          : Promise.resolve({ data: null }),
        supabase
          .from('transaction_document_links')
          .select(
            `
            sales_order_id,
            transaction_id,
            bank_transactions!inner (
              id, label, amount, emitted_at, attachment_ids
            )
          `
          )
          .eq('sales_order_id', orderId)
          .eq('link_type', 'sales_order')
          .limit(1),
      ]);

      // Build contact map from parallel results
      const contactMap = new Map<string, ContactRef>();
      for (const cr of contactResults) {
        if (cr.data) contactMap.set(cr.id, cr.data);
      }

      const respContact = respContactId
        ? (contactMap.get(respContactId) ?? null)
        : null;
      const billContact = billContactId
        ? (contactMap.get(billContactId) ?? null)
        : null;
      const delContact = delContactId
        ? (contactMap.get(delContactId) ?? null)
        : null;

      const createdByProfile = (profileResult.data as CreatedByProfile) ?? null;

      let matchInfo: {
        transaction_id: string;
        label: string;
        amount: number;
        emitted_at: string | null;
        attachment_ids: string[] | null;
      } | null = null;
      const linkData = linkResult.data;
      if (linkData && linkData.length > 0) {
        const link = linkData[0];
        if (link.bank_transactions) {
          const bt = link.bank_transactions as Record<string, unknown>;
          matchInfo = {
            transaction_id: (bt.id as string) || '',
            label: (bt.label as string) || '',
            amount: (bt.amount as number) || 0,
            emitted_at: (bt.emitted_at as string) || null,
            attachment_ids: (bt.attachment_ids as string[]) || null,
          };
        }
      }

      setOrder({
        id: orderData.id,
        order_number: orderData.order_number,
        linkme_display_number:
          (orderData as unknown as { linkme_display_number?: string | null })
            .linkme_display_number ?? null,
        created_at: orderData.created_at,
        status: orderData.status,
        total_ht: orderData.total_ht,
        total_ttc: orderData.total_ttc,
        notes: orderData.notes,
        customer_id: orderData.customer_id,
        expected_delivery_date: orderData.expected_delivery_date,
        pending_admin_validation: orderData.pending_admin_validation ?? null,
        created_by_affiliate_id: orderData.created_by_affiliate_id ?? null,
        linkme_selection_id: orderData.linkme_selection_id ?? null,
        created_by: createdByUserId,
        payment_status: null,
        payment_status_v2: orderData.payment_status_v2 ?? null,
        payment_terms: orderData.payment_terms ?? null,
        currency: orderData.currency ?? null,
        tax_rate: orderData.tax_rate ?? null,
        shipping_cost_ht: orderData.shipping_cost_ht ?? null,
        handling_cost_ht: orderData.handling_cost_ht ?? null,
        insurance_cost_ht: orderData.insurance_cost_ht ?? null,
        fees_vat_rate: orderData.fees_vat_rate ?? null,
        createdByProfile,
        organisation,
        responsable_contact_id: respContactId,
        billing_contact_id: billContactId,
        delivery_contact_id: delContactId,
        responsable_contact: respContact,
        billing_contact: billContact,
        delivery_contact: delContact,
        items: ((orderData.sales_order_items ?? []) as SalesOrderItemRaw[]).map(
          (item: SalesOrderItemRaw) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price_ht: item.unit_price_ht,
            total_ht: item.total_ht,
            product: item.products,
          })
        ),
        linkmeDetails: linkmeData,
        infoRequests,
        is_matched: !!matchInfo,
        matched_transaction_id: matchInfo?.transaction_id ?? null,
        matched_transaction_label: matchInfo?.label ?? null,
        matched_transaction_amount: matchInfo?.amount ?? null,
        matched_transaction_emitted_at: matchInfo?.emitted_at ?? null,
        matched_transaction_attachment_ids: matchInfo?.attachment_ids ?? null,
      });

      // Enriched items with commission info (view now includes created_by_affiliate + affiliate_commission_rate)
      const { data: enrichedData } = await supabase
        .from('linkme_order_items_enriched')
        .select(
          'id, product_id, product_name, product_sku, product_image_url, quantity, unit_price_ht, total_ht, base_price_ht, margin_rate, commission_rate, selling_price_ht, affiliate_margin, retrocession_rate, created_by_affiliate, affiliate_commission_rate'
        )
        .eq('sales_order_id', orderId);

      if (enrichedData && enrichedData.length > 0) {
        const typedEnrichedData = enrichedData as LinkmeOrderItemEnrichedRaw[];

        setEnrichedItems(
          typedEnrichedData.map((item: LinkmeOrderItemEnrichedRaw) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name ?? 'Produit inconnu',
            product_sku: item.product_sku ?? '-',
            product_image_url: item.product_image_url,
            quantity: item.quantity ?? 0,
            unit_price_ht: item.unit_price_ht ?? 0,
            total_ht: item.total_ht ?? 0,
            base_price_ht: item.base_price_ht ?? 0,
            margin_rate: item.margin_rate ?? 0,
            commission_rate: item.commission_rate ?? 0,
            selling_price_ht: item.selling_price_ht ?? 0,
            affiliate_margin: item.affiliate_margin ?? 0,
            retrocession_rate: item.retrocession_rate ?? 0,
            created_by_affiliate: item.created_by_affiliate ?? null,
          }))
        );
      }
    } catch (err) {
      console.error('Erreur fetch commande:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      void fetchOrder().catch(error => {
        console.error('[LinkMeOrderDetails] Initial fetch failed:', error);
      });
    }
  }, [orderId, fetchOrder]);

  // ============================================
  // HANDLERS
  // ============================================

  // Status change
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
      void fetchOrder().catch(err => {
        console.error(
          '[LinkMeOrderDetails] Refetch after status change failed:',
          err
        );
      });
    } catch (err) {
      console.error('[LinkMeOrderDetails] Status change failed:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Save edited item quantities
  const handleSaveItems = async () => {
    setIsSavingItems(true);
    try {
      const supabase = createClient();
      for (const [itemId, quantity] of Object.entries(editedQuantities)) {
        const item = order!.items.find(i => i.id === itemId);
        if (!item) continue;
        const newTotalHt = quantity * item.unit_price_ht;
        await supabase
          .from('sales_order_items')
          .update({ quantity, total_ht: newTotalHt })
          .eq('id', itemId);
      }
      setEditedQuantities({});
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

  const hasItemChanges = Object.keys(editedQuantities).length > 0;

  // Edit dialogs
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
        delivery_terms_accepted: d.delivery_terms_accepted,
        desired_delivery_date: d.desired_delivery_date,
        is_mall_delivery: d.is_mall_delivery,
        mall_email: d.mall_email,
        semi_trailer_accessible: d.semi_trailer_accessible,
        reception_contact_name: d.reception_contact_name,
        reception_contact_email: d.reception_contact_email,
        reception_contact_phone: d.reception_contact_phone,
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
      void fetchOrder().catch(error => {
        console.error(
          '[LinkMeOrderDetails] Refetch after save edit failed:',
          error
        );
      });
    } catch (err) {
      console.error('Erreur mise à jour:', err);
    }
  };

  const handleConfirmContact = async () => {
    if (!contactDialogFor || !selectedContactId) return;

    // Mettre à jour le FK sur sales_orders (source de vérité)
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
    // 1. Créer le contact en BD
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

    // 2. Mettre à jour le FK sur sales_orders (source de vérité)
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

  // Helpers
  const isStep4Complete = () => {
    if (!order?.linkmeDetails) return false;
    return !!order.linkmeDetails.step4_completed_at;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      draft: 'secondary',
      validated: 'default',
      cancelled: 'destructive',
    };
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      validated: 'Validée',
      cancelled: 'Annulée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
    };
    return (
      <Badge variant={variants[status] ?? 'outline'}>
        {labels[status] ?? status}
      </Badge>
    );
  };

  // ============================================
  // LOADING / ERROR
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error ?? 'Commande non trouvée'}</span>
        </div>
      </div>
    );
  }

  const details = order.linkmeDetails;
  const org = order.organisation;
  const locked = isOrderLocked(order.status);

  // Contact fusion logic: group by contact_id when same contact has multiple roles
  const respContact = order.responsable_contact;
  const billContact = order.billing_contact;
  const delContact = order.delivery_contact;

  // Build fused contact groups
  type ContactRoleLocal = 'responsable' | 'billing' | 'delivery';

  const fusedContacts: FusedContactGroup[] = [];
  const seenIds = new Set<string>();

  // Helper to add or merge a contact
  const addOrMerge = (contact: ContactRef | null, role: ContactRoleLocal) => {
    if (!contact) return;
    if (seenIds.has(contact.id)) {
      const existing = fusedContacts.find(g => g.contact.id === contact.id);
      if (existing && !existing.roles.includes(role)) {
        existing.roles.push(role);
      }
    } else {
      seenIds.add(contact.id);
      fusedContacts.push({ contact, roles: [role] });
    }
  };

  addOrMerge(respContact, 'responsable');
  addOrMerge(billContact, 'billing');
  addOrMerge(delContact, 'delivery');

  // Address matching
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
  const deliveryAddressMatchesOrg =
    deliveryNorm.length > 0 &&
    orgNorm.length > 0 &&
    deliveryNorm.includes(orgNorm) &&
    cityMatch;

  const handleUseOrgAddress = async () => {
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

  return (
    <div className="space-y-4 p-4">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push('/canaux-vente/linkme/commandes')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">
              {order.order_number}
            </h1>
            {order.linkme_display_number && (
              <span className="text-sm font-normal text-gray-500">
                ({order.linkme_display_number})
              </span>
            )}
            {getStatusBadge(order.status)}
            {locked && (
              <span className="flex items-center gap-1.5 text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded-md">
                <Lock className="h-3 w-3" />
                Informations verrouillées
              </span>
            )}
            {(() => {
              const channel = getOrderChannel(
                order.created_by_affiliate_id,
                order.linkme_selection_id
              );
              return (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${channel.bg} ${channel.color}`}
                >
                  {channel.label}
                </span>
              );
            })()}
            <span className="text-gray-400 text-xs">
              {new Date(order.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            {order.createdByProfile && (
              <span className="text-xs text-blue-600">
                par{' '}
                {[
                  order.createdByProfile.first_name,
                  order.createdByProfile.last_name,
                ]
                  .filter(Boolean)
                  .join(' ') || 'Inconnu'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* LAYOUT 2 COLONNES */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* COLONNE GAUCHE (2/3) */}
        <LeftColumn
          order={order}
          enrichedItems={enrichedItems}
          locked={locked}
          details={details}
          fusedContacts={fusedContacts}
          editedQuantities={editedQuantities}
          setEditedQuantities={setEditedQuantities}
          hasItemChanges={hasItemChanges}
          isSavingItems={isSavingItems}
          onSaveItems={() => {
            void handleSaveItems().catch(err => console.error(err));
          }}
          onOpenEditDialog={openEditDialog}
          onOpenContactDialog={handleOpenContactDialog}
          deliveryAddressMatchesOrg={deliveryAddressMatchesOrg}
          onUseOrgAddress={() => {
            void handleUseOrgAddress().catch((err: unknown) => {
              console.error(
                '[LinkMeOrderDetails] Use org address failed:',
                err
              );
            });
          }}
          updateDetailsPending={updateDetails.isPending}
          isStep4Complete={isStep4Complete()}
        />

        {/* COLONNE DROITE - SIDEBAR (1/3) */}
        <RightColumn
          order={order}
          locked={locked}
          fusedContacts={fusedContacts}
          details={details}
          isUpdatingStatus={isUpdatingStatus}
          onStatusChange={(newStatus: string) => {
            void handleStatusChange(newStatus).catch(err => console.error(err));
          }}
          onOpenContactDialog={handleOpenContactDialog}
          historyEvents={historyEvents}
          historyLoading={historyLoading}
        />
      </div>

      {/* DIALOGS */}
      <EditDialogs
        order={order}
        editingStep={editingStep}
        setEditingStep={setEditingStep}
        editForm={editForm}
        setEditForm={setEditForm}
        onSaveEdit={() => {
          void handleSaveEdit().catch(error => {
            console.error('[LinkMeOrderDetails] Save edit failed:', error);
          });
        }}
        updateDetailsPending={updateDetails.isPending}
        contactDialogFor={contactDialogFor}
        setContactDialogFor={setContactDialogFor}
        selectedContactId={selectedContactId}
        setSelectedContactId={setSelectedContactId}
        availableContacts={availableContacts}
        onConfirmContact={() => {
          void handleConfirmContact().catch(err => {
            console.error('[LinkMeOrderDetails] Confirm contact failed:', err);
          });
        }}
        onCreateAndSelectContact={async (data: NewContactFormData) => {
          await handleCreateAndSelectContact(data).catch(err => {
            console.error('[LinkMeOrderDetails] Create contact failed:', err);
          });
        }}
        createContactPending={createContactBO.isPending}
      />
    </div>
  );
}
