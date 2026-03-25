'use client';

/**
 * Page: Detail Commande Enseigne LinkMe
 *
 * Affiche tous les details d'une commande Enseigne B2B avec 6 sections miroir du formulaire:
 * - Section 1: Restaurant (org, adresse, type)
 * - Section 2: Selection (nom, nb produits)
 * - Section 3: Produits (tableau articles avec commissions)
 * - Section 4: Responsable (contact: nom, email, phone, poste)
 * - Section 5: Facturation (contact + adresse)
 * - Section 6: Livraison (contact + adresse + options, TOUJOURS visible)
 *
 * + Encart "Demandeur" = user de la session (created_by)
 *
 * Actions:
 * - Approuver (pas de blocage proprietaire)
 * - Demander complements
 * - Refuser
 */

import { useCallback, useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { Badge, Button, Skeleton } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import {
  useApproveOrder,
  useRequestInfo,
  useRejectOrder,
  useUpdateLinkMeDetails,
  type LinkMeOrderDetails,
} from '../../hooks/use-linkme-order-actions';

import { useOrderHistory, OrderTimeline } from '@verone/orders';

import {
  getOrderMissingFields,
  type MissingFieldCategory,
} from '../../utils/order-missing-fields';

import {
  useOrganisationContactsBO,
  useEnseigneContactsBO,
  useCreateContactBO,
  type ContactBO,
} from '../../hooks/use-organisation-contacts-bo';

import type { NewContactFormData } from '../../components/contacts/NewContactForm';
import { PaymentSection } from '@/components/orders/PaymentSection';

// Sub-components
import { RestaurantSection } from './components/RestaurantSection';
import { ProductsSection } from './components/ProductsSection';
import { TotalsSection } from './components/TotalsSection';
import { DeliverySection } from './components/DeliverySection';
import { StatusActionsCard } from './components/StatusActionsCard';
import { ContactsPanel } from './components/ContactsPanel';
import { DemandeurCard } from './components/DemandeurCard';
import { InfoRequestsCard } from './components/InfoRequestsCard';
import { ContactSelectionDialog } from './components/ContactSelectionDialog';
import {
  ApproveDialog,
  RequestInfoDialog,
  RejectDialog,
} from './components/ApprovalActionDialogs';
import { EditDialogs } from './components/EditDialogs';

// Types
import type {
  OrderWithDetails,
  EnrichedOrderItem,
  ContactRef,
  ContactRole,
  FusedContactGroup,
  CreatedByProfile,
  InfoRequest,
} from './components/types';
import { getOrderChannel } from './components/types';

// Types for intermediate Supabase data
interface SalesOrderItemRaw {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  products: { name: string; sku: string } | null;
}

interface LinkmeOrderItemEnrichedRaw {
  id: string;
  product_id: string;
  product_name: string | null;
  product_sku: string | null;
  product_image_url: string | null;
  quantity: number | null;
  unit_price_ht: number | null;
  total_ht: number | null;
  base_price_ht: number | null;
  margin_rate: number | null;
  commission_rate: number | null;
  selling_price_ht: number | null;
  affiliate_margin: number | null;
  retrocession_rate?: number | null;
  created_by_affiliate: string | null;
  affiliate_commission_rate: number | null;
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function LinkMeOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs actions
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<
    Set<MissingFieldCategory>
  >(new Set());
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRejectReason, setSelectedRejectReason] = useState<
    string | null
  >(null);

  // Edit dialogs per section
  const [editingStep, setEditingStep] = useState<
    'responsable' | 'billing' | 'delivery_address' | 'delivery_options' | null
  >(null);
  const [editForm, setEditForm] = useState<Partial<LinkMeOrderDetails>>({});

  // Contact selection dialog (responsable / billing / delivery)
  const [contactDialogFor, setContactDialogFor] = useState<
    'responsable' | 'billing' | 'delivery' | null
  >(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );

  // Order history timeline
  const { events: historyEvents, loading: historyLoading } =
    useOrderHistory(orderId);

  // Mutations
  const approveOrder = useApproveOrder();
  const requestInfo = useRequestInfo();
  const rejectOrder = useRejectOrder();
  const updateDetails = useUpdateLinkMeDetails();
  const createContactBO = useCreateContactBO();

  // Contacts hooks - depend on restaurant type (propre = enseigne, franchise = org)
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

  // Available contacts depending on type
  const availableContacts: ContactBO[] =
    (isSuccursale
      ? enseigneContactsData?.contacts
      : orgContactsData?.contacts) ?? [];

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      // Single query with joins (perf fix: avoid 3 sequential queries)
      const { data: orderData, error: orderError } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          linkme_display_number,
          created_at,
          status,
          total_ht,
          total_ttc,
          notes,
          customer_id,
          customer_type,
          expected_delivery_date,
          created_by_affiliate_id,
          linkme_selection_id,
          created_by,
          payment_status_v2,
          payment_terms,
          currency,
          tax_rate,
          shipping_cost_ht,
          handling_cost_ht,
          insurance_cost_ht,
          fees_vat_rate,
          responsable_contact_id, billing_contact_id, delivery_contact_id,
          responsable_contact:contacts!sales_orders_responsable_contact_id_fkey (
            id, first_name, last_name, email, phone, title
          ),
          billing_contact:contacts!sales_orders_billing_contact_id_fkey (
            id, first_name, last_name, email, phone, title
          ),
          delivery_contact:contacts!sales_orders_delivery_contact_id_fkey (
            id, first_name, last_name, email, phone, title
          ),
          organisations!sales_orders_customer_id_fkey (
            id,
            trade_name,
            legal_name,
            approval_status,
            enseigne_id,
            address_line1,
            address_line2,
            postal_code,
            city,
            billing_address_line1,
            billing_address_line2,
            billing_city,
            billing_postal_code,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_postal_code,
            has_different_shipping_address,
            phone,
            email,
            siret,
            country,
            vat_number
          ),
          sales_order_linkme_details (
            id,
            sales_order_id,
            requester_type,
            requester_name,
            requester_email,
            requester_phone,
            requester_position,
            is_new_restaurant,
            owner_type,
            owner_contact_same_as_requester,
            owner_name,
            owner_email,
            owner_phone,
            owner_company_legal_name,
            owner_company_trade_name,
            owner_kbis_url,
            billing_contact_source,
            billing_name,
            billing_email,
            billing_phone,
            delivery_terms_accepted,
            delivery_date,
            desired_delivery_date,
            mall_form_required,
            mall_form_email,
            delivery_contact_name,
            delivery_contact_email,
            delivery_contact_phone,
            delivery_address,
            delivery_postal_code,
            delivery_city,
            delivery_notes,
            is_mall_delivery,
            mall_email,
            semi_trailer_accessible,
            access_form_required,
            access_form_url,
            step4_token,
            step4_token_expires_at,
            step4_completed_at,
            reception_contact_name,
            reception_contact_email,
            reception_contact_phone,
            confirmed_delivery_date,
            created_at,
            updated_at
          ),
          linkme_info_requests (
            id,
            token,
            recipient_email,
            recipient_type,
            sent_at,
            completed_at,
            cancelled_at,
            cancelled_reason
          ),
          sales_order_items (
            id,
            product_id,
            quantity,
            unit_price_ht,
            total_ht,
            products (
              name,
              sku
            )
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Extract organisation from FK join
      const orgRaw: unknown = (orderData as Record<string, unknown>)
        .organisations;
      const organisation = (orgRaw ?? null) as OrderWithDetails['organisation'];

      // Extract linkme details from join (can be array or object depending on Supabase)
      const linkmeDetailsRaw: unknown = orderData.sales_order_linkme_details;
      const linkmeData = (
        Array.isArray(linkmeDetailsRaw)
          ? (linkmeDetailsRaw[0] ?? null)
          : (linkmeDetailsRaw ?? null)
      ) as LinkMeOrderDetails | null;

      // Extract info requests from join
      const infoRequestsRaw: unknown = (orderData as Record<string, unknown>)
        .linkme_info_requests;
      const infoRequests = (
        Array.isArray(infoRequestsRaw) ? infoRequestsRaw : []
      ) as InfoRequest[];

      // Fetch creator (created_by -> user_profiles)
      let createdByProfile: CreatedByProfile | null = null;
      const createdByUserId = (orderData as Record<string, unknown>)
        .created_by as string | null;
      if (createdByUserId) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, email')
          .eq('user_id', createdByUserId)
          .single();
        if (profileData) {
          createdByProfile = profileData as CreatedByProfile;
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
        organisation: organisation,
        // Contacts via FK
        responsable_contact_id: (orderData as Record<string, unknown>)
          .responsable_contact_id as string | null,
        billing_contact_id: (orderData as Record<string, unknown>)
          .billing_contact_id as string | null,
        delivery_contact_id: (orderData as Record<string, unknown>)
          .delivery_contact_id as string | null,
        responsable_contact:
          ((orderData as Record<string, unknown>)
            .responsable_contact as ContactRef | null) ?? null,
        billing_contact:
          ((orderData as Record<string, unknown>)
            .billing_contact as ContactRef | null) ?? null,
        delivery_contact:
          ((orderData as Record<string, unknown>)
            .delivery_contact as ContactRef | null) ?? null,
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
        console.error('[LinkMeOrderDetail] Initial fetch failed:', error);
      });
    }
  }, [orderId, fetchOrder]);

  // Handlers Actions
  const handleApprove = async () => {
    try {
      await approveOrder.mutateAsync({ orderId });
      setShowApproveDialog(false);
      void fetchOrder().catch(error => {
        console.error(
          '[LinkMeOrderDetail] Refetch after approve failed:',
          error
        );
      });
    } catch (err) {
      console.error('Erreur approbation:', err);
    }
  };

  const handleRequestInfo = async () => {
    if (!requestMessage.trim()) return;
    try {
      const missingFields = getOrderMissingFields({
        details,
        organisationSiret: order?.organisation?.siret,
        organisationCountry: order?.organisation?.country,
        organisationVatNumber: order?.organisation?.vat_number,
        ownerType: details?.owner_type,
      });
      await requestInfo.mutateAsync({
        orderId,
        customMessage: requestMessage || undefined,
        missingFields: missingFields.fields.map(f => ({
          key: f.key,
          label: f.label,
          category: f.category,
          inputType: f.inputType,
        })),
      });
      setShowRequestInfoDialog(false);
      setRequestMessage('');
      setSelectedCategories(new Set());
      void fetchOrder().catch(error => {
        console.error(
          '[LinkMeOrderDetail] Refetch after request info failed:',
          error
        );
      });
    } catch (err) {
      console.error('Erreur demande info:', err);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await rejectOrder.mutateAsync({ orderId, reason: rejectReason });
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedRejectReason(null);
      void fetchOrder().catch(error => {
        console.error(
          '[LinkMeOrderDetail] Refetch after reject failed:',
          error
        );
      });
    } catch (err) {
      console.error('Erreur refus:', err);
    }
  };

  // Handlers Edit
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
      await updateDetails.mutateAsync({
        orderId,
        updates: editForm,
      });
      setEditingStep(null);
      setEditForm({});
      void fetchOrder().catch(error => {
        console.error(
          '[LinkMeOrderDetail] Refetch after save edit failed:',
          error
        );
      });
    } catch (err) {
      console.error('Erreur mise a jour:', err);
    }
  };

  // Confirm contact selection -> update FK on sales_orders
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
          '[LinkMeOrderDetail] Refetch after contact select failed:',
          err
        );
      });
    } catch (err) {
      console.error('Erreur mise a jour contact:', err);
    }
  };

  // Create a new contact AND update the order
  const handleCreateAndSelectContact = async (
    contactData: NewContactFormData
  ) => {
    // 1. Create the contact in DB (linked to org or enseigne depending on type)
    const result = await createContactBO.mutateAsync({
      organisationId: isSuccursale ? undefined : (organisationId ?? undefined),
      enseigneId: isSuccursale ? (enseigneId ?? undefined) : undefined,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone || undefined,
      title: contactData.title || undefined,
      isPrimaryContact: contactDialogFor === 'responsable',
      isBillingContact: contactDialogFor === 'billing',
    });

    // 2. Update FK on sales_orders (source of truth)
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

    // 3. Close dialog + refetch
    setContactDialogFor(null);
    setSelectedContactId(null);
    void fetchOrder().catch(err => {
      console.error(
        '[LinkMeOrderDetail] Refetch after create contact failed:',
        err
      );
    });
  };

  // Handler: replace delivery address with restaurant address
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
        '[LinkMeOrderDetail] Refetch after use org address failed:',
        err
      );
    });
  };

  // Helper badge status
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      pending_approval: 'outline',
      draft: 'secondary',
      validated: 'default',
      cancelled: 'destructive',
    };
    const labels: Record<string, string> = {
      pending_approval: "En attente d'approbation",
      draft: 'Brouillon',
      validated: 'Validee',
      cancelled: 'Annulee',
      shipped: 'Expediee',
      delivered: 'Livree',
    };
    return (
      <Badge variant={variants[status] ?? 'outline'}>
        {labels[status] ?? status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error ?? 'Commande non trouvee'}</span>
        </div>
      </div>
    );
  }

  const details = order.linkmeDetails;

  // Contact fusion logic: group by contact_id when same contact has multiple roles
  const fusedContacts: FusedContactGroup[] = [];
  const seenIds = new Set<string>();
  const addOrMerge = (contact: ContactRef | null, role: ContactRole) => {
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
  addOrMerge(order.responsable_contact, 'responsable');
  addOrMerge(order.billing_contact, 'billing');
  addOrMerge(order.delivery_contact, 'delivery');

  // Compute missing fields (reused for button badge + dialog)
  const missingFieldsResult = details
    ? getOrderMissingFields({
        details,
        organisationSiret: order.organisation?.siret,
        organisationCountry: order.organisation?.country,
        organisationVatNumber: order.organisation?.vat_number,
        ownerType: details?.owner_type,
      })
    : null;

  // Compute delivery address match vs organisation (reused in badge + blue block)
  const org = order.organisation;
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

  return (
    <div className="space-y-4 p-4">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              void router.push('/canaux-vente/linkme/commandes');
            }
          }}
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
            {(order.linkmeDetails?.requester_name ??
              order.createdByProfile) && (
              <span className="text-xs text-blue-600">
                par{' '}
                {(() => {
                  if (order.linkmeDetails?.requester_name)
                    return order.linkmeDetails.requester_name;
                  if (order.createdByProfile) {
                    const name = [
                      order.createdByProfile.first_name,
                      order.createdByProfile.last_name,
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return name.length > 0 ? name : 'Inconnu';
                  }
                  return 'Visiteur anonyme';
                })()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* LAYOUT 2 COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <RestaurantSection
            organisation={order.organisation}
            details={details}
          />

          <ProductsSection items={order.items} enrichedItems={enrichedItems} />

          <TotalsSection
            totalHt={order.total_ht}
            totalTtc={order.total_ttc}
            notes={order.notes}
          />

          <DeliverySection
            order={order}
            details={details}
            deliveryAddressMatchesOrg={deliveryAddressMatchesOrg}
            updateDetailsIsPending={updateDetails.isPending}
            onEditDeliveryAddress={() => openEditDialog('delivery_address')}
            onEditDeliveryOptions={() => openEditDialog('delivery_options')}
            onChangeDeliveryContact={() => {
              setSelectedContactId(null);
              setContactDialogFor('delivery');
            }}
            onUseOrgAddress={() => {
              void handleUseOrgAddress().catch((err: unknown) => {
                console.error(
                  '[LinkMeOrderDetail] Use org address failed:',
                  err
                );
              });
            }}
          />
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-4">
          <StatusActionsCard
            status={order.status}
            missingFieldsResult={missingFieldsResult}
            approveIsPending={approveOrder.isPending}
            onApprove={() => setShowApproveDialog(true)}
            onRequestInfo={() => setShowRequestInfoDialog(true)}
            onReject={() => setShowRejectDialog(true)}
          />

          <ContactsPanel
            fusedContacts={fusedContacts}
            details={details}
            organisation={order.organisation}
            onChangeContact={(role: ContactRole) => {
              setSelectedContactId(null);
              setContactDialogFor(role);
            }}
          />

          <DemandeurCard
            createdByProfile={order.createdByProfile}
            linkmeDetails={order.linkmeDetails}
          />

          <InfoRequestsCard infoRequests={order.infoRequests} />

          <PaymentSection
            orderId={order.id}
            orderNumber={order.order_number}
            orderStatus={order.status}
            totalHt={order.total_ht ?? 0}
            totalTtc={order.total_ttc ?? 0}
            taxRate={order.tax_rate ?? 20}
            currency={order.currency ?? 'EUR'}
            paymentTerms={order.payment_terms ?? 'immediate'}
            paymentStatus={
              order.payment_status_v2 ?? order.payment_status ?? 'pending'
            }
            customerName={
              order.organisation?.trade_name ??
              order.organisation?.legal_name ??
              'Client inconnu'
            }
            customerEmail={order.organisation?.email ?? null}
            customerType="organization"
            shippingCostHt={order.shipping_cost_ht ?? 0}
            handlingCostHt={order.handling_cost_ht ?? 0}
            insuranceCostHt={order.insurance_cost_ht ?? 0}
            feesVatRate={order.fees_vat_rate ?? 0.2}
            orderItems={order.items.map(item => ({
              id: item.id,
              quantity: item.quantity,
              unit_price_ht: item.unit_price_ht,
              tax_rate: order.tax_rate ?? 20,
              products: item.product ? { name: item.product.name } : null,
            }))}
          />

          <OrderTimeline events={historyEvents} loading={historyLoading} />
        </div>
      </div>

      {/* DIALOGS */}
      <ContactSelectionDialog
        contactDialogFor={contactDialogFor}
        selectedContactId={selectedContactId}
        availableContacts={availableContacts}
        isSubmitting={createContactBO.isPending || updateDetails.isPending}
        onSelectContact={id => setSelectedContactId(id)}
        onConfirm={() => {
          void handleConfirmContact().catch(err => {
            console.error('[LinkMeOrderDetail] Confirm contact failed:', err);
          });
        }}
        onCreateAndSelect={async (contactData: NewContactFormData) => {
          await handleCreateAndSelectContact(contactData);
        }}
        onClose={() => {
          setContactDialogFor(null);
          setSelectedContactId(null);
        }}
      />

      <ApproveDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        onConfirm={() => {
          void handleApprove().catch(error => {
            console.error('[LinkMeOrderDetail] Approve failed:', error);
          });
        }}
        isPending={approveOrder.isPending}
      />

      <RequestInfoDialog
        open={showRequestInfoDialog}
        onOpenChange={setShowRequestInfoDialog}
        order={order}
        details={details}
        requestMessage={requestMessage}
        setRequestMessage={setRequestMessage}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        onSend={() => {
          void handleRequestInfo().catch(error => {
            console.error('[LinkMeOrderDetail] Request info failed:', error);
          });
        }}
        isPending={requestInfo.isPending}
      />

      <RejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        details={details}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        selectedRejectReason={selectedRejectReason}
        setSelectedRejectReason={setSelectedRejectReason}
        onReject={() => {
          void handleReject().catch(error => {
            console.error('[LinkMeOrderDetail] Reject failed:', error);
          });
        }}
        isPending={rejectOrder.isPending}
      />

      <EditDialogs
        editingStep={editingStep}
        editForm={editForm}
        setEditForm={setEditForm}
        organisation={order.organisation}
        orderStatus={order.status}
        updateDetailsIsPending={updateDetails.isPending}
        onClose={() => {
          setEditingStep(null);
          setEditForm({});
        }}
        onSave={() => {
          void handleSaveEdit().catch(error => {
            console.error('[LinkMeOrderDetail] Save edit failed:', error);
          });
        }}
      />
    </div>
  );
}
