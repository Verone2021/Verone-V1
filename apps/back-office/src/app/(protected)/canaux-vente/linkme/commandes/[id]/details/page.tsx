'use client';

/**
 * Page: Gestion complète Commande LinkMe
 *
 * Layout 2 colonnes:
 * - Gauche: Restaurant, Items (éditables), Contacts, Livraison, Historique
 * - Droite: Statut + Actions, Totaux, Frais, Paiement, Factures, Notes
 *
 * Différences vs page approbation ([id]/page.tsx):
 * - PAS de dialogs approve/reject/request info
 * - Gestion statut (draft→validated→shipped→delivered, cancel)
 * - FeesSection + InvoicesSection
 * - Items éditables (quantités en draft)
 */

import { useCallback, useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Save,
  Truck,
  User,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';

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

import { ContactCardBO } from '../../../components/contacts/ContactCardBO';
import { NewContactForm } from '../../../components/contacts/NewContactForm';
import { PaymentSection } from '@/app/(protected)/commandes/clients/[id]/PaymentSection';
import { FeesSection } from '@/app/(protected)/commandes/clients/[id]/FeesSection';
import { InvoicesSection } from '@/app/(protected)/commandes/clients/[id]/InvoicesSection';
import { updateSalesOrderStatus } from '@/app/actions/sales-orders';
import type { NewContactFormData } from '../../../components/contacts/NewContactForm';

// ============================================
// TYPES
// ============================================

interface CreatedByProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface OrderWithDetails {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_ht: number;
  total_ttc: number;
  notes: string | null;
  customer_id: string | null;
  expected_delivery_date: string | null;
  created_by_affiliate_id: string | null;
  linkme_selection_id: string | null;
  created_by: string | null;
  payment_status: string | null;
  payment_status_v2: string | null;
  payment_terms: string | null;
  currency: string | null;
  tax_rate: number | null;
  shipping_cost_ht: number | null;
  handling_cost_ht: number | null;
  insurance_cost_ht: number | null;
  fees_vat_rate: number | null;
  createdByProfile: CreatedByProfile | null;
  organisation: {
    id: string;
    trade_name: string | null;
    legal_name: string;
    approval_status: string | null;
    enseigne_id: string | null;
    address_line1: string | null;
    address_line2: string | null;
    postal_code: string | null;
    city: string | null;
    billing_address_line1: string | null;
    billing_address_line2: string | null;
    billing_city: string | null;
    billing_postal_code: string | null;
    shipping_address_line1: string | null;
    shipping_address_line2: string | null;
    shipping_city: string | null;
    shipping_postal_code: string | null;
    has_different_shipping_address: boolean | null;
    phone: string | null;
    email: string | null;
    siret: string | null;
  } | null;
  items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price_ht: number;
    total_ht: number;
    product: {
      name: string;
      sku: string;
    } | null;
  }>;
  linkmeDetails: LinkMeOrderDetails | null;
  infoRequests: InfoRequest[];
}

interface InfoRequest {
  id: string;
  token: string;
  recipient_email: string;
  recipient_type: string;
  sent_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
}

interface EnrichedOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image_url: string | null;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  base_price_ht: number;
  margin_rate: number;
  commission_rate: number;
  selling_price_ht: number;
  affiliate_margin: number;
  created_by_affiliate: string | null;
}

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
}

interface ProductWithAffiliate {
  id: string;
  created_by_affiliate: string | null;
}

function getOrderChannel(
  created_by_affiliate_id: string | null,
  linkme_selection_id: string | null
): { label: string; color: string; bg: string } {
  if (created_by_affiliate_id !== null) {
    return { label: 'Affilié', color: 'text-teal-700', bg: 'bg-teal-100' };
  }
  if (linkme_selection_id !== null) {
    return {
      label: 'Sélection publique',
      color: 'text-amber-700',
      bg: 'bg-amber-100',
    };
  }
  return { label: 'Back-office', color: 'text-blue-700', bg: 'bg-blue-100' };
}

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
      const { data: orderData, error: orderError } = await supabase
        .from('sales_orders')
        .select(
          `
          id, order_number, created_at, status, total_ht, total_ttc, notes,
          customer_id, customer_type, expected_delivery_date,
          created_by_affiliate_id, linkme_selection_id, created_by,
          payment_status_v2, payment_terms, currency, tax_rate,
          shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate,
          organisations!sales_orders_customer_id_fkey (
            id, trade_name, legal_name, approval_status, enseigne_id,
            address_line1, address_line2, postal_code, city,
            billing_address_line1, billing_address_line2, billing_city, billing_postal_code,
            shipping_address_line1, shipping_address_line2, shipping_city, shipping_postal_code,
            has_different_shipping_address, phone, email, siret
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

      let organisation: OrderWithDetails['organisation'] = null;
      if (orderData.customer_type === 'organization' && orderData.customer_id) {
        const { data: orgData } = await supabase
          .from('organisations')
          .select(
            'id, trade_name, legal_name, approval_status, enseigne_id, address_line1, address_line2, postal_code, city, billing_address_line1, billing_address_line2, billing_city, billing_postal_code, shipping_address_line1, shipping_address_line2, shipping_city, shipping_postal_code, has_different_shipping_address, phone, email, siret'
          )
          .eq('id', orderData.customer_id)
          .single();
        organisation = (orgData ?? null) as OrderWithDetails['organisation'];
      }

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
        organisation,
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

      // Enriched items with commission info
      const { data: enrichedData } = await supabase
        .from('linkme_order_items_enriched')
        .select('*')
        .eq('sales_order_id', orderId);

      if (enrichedData && enrichedData.length > 0) {
        const typedEnrichedData = enrichedData as LinkmeOrderItemEnrichedRaw[];
        const productIds = typedEnrichedData
          .map((item: LinkmeOrderItemEnrichedRaw) => item.product_id)
          .filter(Boolean);
        const { data: productsData } = await supabase
          .from('products')
          .select('id, created_by_affiliate')
          .in('id', productIds);

        const productMap = new Map(
          ((productsData ?? []) as ProductWithAffiliate[]).map(
            (p: ProductWithAffiliate) => [p.id, p.created_by_affiliate]
          )
        );

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
            created_by_affiliate: productMap.get(item.product_id) ?? null,
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
        newStatus as 'validated' | 'shipped' | 'cancelled',
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
    const contact = availableContacts.find(c => c.id === selectedContactId);
    if (!contact) return;

    const fullName = `${contact.firstName} ${contact.lastName}`;
    let updates: Partial<LinkMeOrderDetails>;
    if (contactDialogFor === 'responsable') {
      updates = {
        requester_name: fullName,
        requester_email: contact.email,
        requester_phone: contact.phone ?? undefined,
        requester_position: contact.title ?? undefined,
      };
    } else if (contactDialogFor === 'delivery') {
      updates = {
        delivery_contact_name: fullName,
        delivery_contact_email: contact.email,
        delivery_contact_phone: contact.phone ?? undefined,
      };
    } else {
      updates = {
        billing_name: fullName,
        billing_email: contact.email,
        billing_phone: contact.phone ?? undefined,
        billing_contact_source: 'custom',
      };
    }

    try {
      await updateDetails.mutateAsync({ orderId, updates });
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
    await createContactBO.mutateAsync({
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

    const fullName = `${contactData.firstName} ${contactData.lastName}`;
    let updates: Partial<LinkMeOrderDetails>;
    if (contactDialogFor === 'responsable') {
      updates = {
        requester_name: fullName,
        requester_email: contactData.email,
        requester_phone: contactData.phone || undefined,
        requester_position: contactData.title || undefined,
      };
    } else if (contactDialogFor === 'delivery') {
      updates = {
        delivery_contact_name: fullName,
        delivery_contact_email: contactData.email,
        delivery_contact_phone: contactData.phone || undefined,
      };
    } else {
      updates = {
        billing_name: fullName,
        billing_email: contactData.email,
        billing_phone: contactData.phone || undefined,
        billing_contact_source: 'custom',
      };
    }

    await updateDetails.mutateAsync({ orderId, updates });
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

  const renderStepBadge = (complete: boolean) => {
    if (complete) {
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <Check className="h-3 w-3" />
          Complet
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Incomplet
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

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/canaux-vente/linkme/commandes')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Commande {order.order_number}
          </h1>
          <div className="flex items-center gap-2 mt-1">
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
            <span className="text-gray-500 text-sm">
              {new Date(order.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* DEMANDEUR */}
      {order.createdByProfile && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-blue-800">Demandeur : </span>
            <span className="text-blue-700">
              {[
                order.createdByProfile.first_name,
                order.createdByProfile.last_name,
              ]
                .filter(Boolean)
                .join(' ') || 'Utilisateur inconnu'}
            </span>
            {order.createdByProfile.email && (
              <span className="text-blue-600 ml-2">
                ({order.createdByProfile.email})
              </span>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* LAYOUT 2 COLONNES */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================ */}
        {/* COLONNE GAUCHE (2/3) */}
        {/* ============================================ */}
        <div className="lg:col-span-2 space-y-6">
          {/* RESTAURANT */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-orange-100">
                  <Building2 className="h-4 w-4 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Restaurant</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {order.organisation ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Établissement
                    </p>
                    <p className="text-lg font-semibold mt-1">
                      {order.organisation.trade_name ??
                        order.organisation.legal_name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {details?.owner_type && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full ${
                          details.owner_type === 'franchise'
                            ? 'bg-violet-100 text-violet-800 ring-1 ring-violet-200'
                            : 'bg-blue-100 text-blue-800 ring-1 ring-blue-200'
                        }`}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        {details.owner_type === 'propre'
                          ? 'Restaurant propre'
                          : details.owner_type === 'succursale'
                            ? 'Succursale'
                            : details.owner_type === 'franchise'
                              ? 'Franchise'
                              : details.owner_type}
                      </span>
                    )}
                    {details?.is_new_restaurant && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                        <Check className="h-3.5 w-3.5" />
                        Nouveau restaurant
                      </span>
                    )}
                    {order.organisation.approval_status ===
                      'pending_validation' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full bg-amber-100 text-amber-800 ring-1 ring-amber-200">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        En attente validation
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    {order.organisation.siret && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                        <span>SIRET : {order.organisation.siret}</span>
                      </div>
                    )}
                    {(order.organisation.address_line1 ??
                      order.organisation.postal_code) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          {[
                            order.organisation.address_line1,
                            order.organisation.address_line2,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                          {order.organisation.postal_code &&
                            `, ${order.organisation.postal_code}`}
                          {order.organisation.city &&
                            ` ${order.organisation.city}`}
                        </span>
                      </div>
                    )}
                    {order.organisation.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        <a
                          href={`mailto:${order.organisation.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {order.organisation.email}
                        </a>
                      </div>
                    )}
                    {order.organisation.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span>{order.organisation.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Organisation non renseignée</p>
              )}
            </CardContent>
          </Card>

          {/* ITEMS TABLE (editable) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg">
                    Récapitulatif commande
                  </CardTitle>
                </div>
                <CardDescription>
                  {order.items.length} article(s)
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {hasItemChanges && (
                <div className="flex justify-end mb-4">
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={isSavingItems}
                    onClick={() => {
                      void handleSaveItems().catch(err => console.error(err));
                    }}
                  >
                    <Save className="h-4 w-4" />
                    {isSavingItems
                      ? 'Enregistrement...'
                      : 'Sauvegarder les modifications'}
                  </Button>
                </div>
              )}
              {enrichedItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Produit</TableHead>
                        <TableHead className="text-right">
                          Prix vente HT
                        </TableHead>
                        <TableHead className="text-center">Qté</TableHead>
                        <TableHead className="text-right">Total HT</TableHead>
                        <TableHead className="text-center">
                          Marge/Comm. %
                        </TableHead>
                        <TableHead className="text-right">
                          Marge/Comm. &euro;
                        </TableHead>
                        <TableHead className="text-right">
                          Payout affilié
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrichedItems.map(item => {
                        const isRevendeur = !!item.created_by_affiliate;
                        const marginCommissionEuros =
                          item.affiliate_margin ?? 0;
                        const payoutAffilie = isRevendeur
                          ? item.total_ht - marginCommissionEuros
                          : marginCommissionEuros;

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-medium text-sm">
                                    {item.product_name}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500 font-mono">
                                      {item.product_sku}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className={
                                        isRevendeur
                                          ? 'text-[10px] border-violet-500 text-violet-700 bg-violet-50'
                                          : 'text-[10px] border-blue-500 text-blue-700 bg-blue-50'
                                      }
                                    >
                                      {isRevendeur ? 'REVENDEUR' : 'CATALOGUE'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                item.selling_price_ht || item.unit_price_ht
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {order.status === 'draft' ? (
                                <Input
                                  type="number"
                                  min={1}
                                  className="w-16 h-8 text-center mx-auto"
                                  value={
                                    editedQuantities[item.id] ?? item.quantity
                                  }
                                  onChange={e => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val > 0) {
                                      setEditedQuantities(prev => ({
                                        ...prev,
                                        [item.id]: val,
                                      }));
                                    }
                                  }}
                                />
                              ) : (
                                item.quantity
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.total_ht)}
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={
                                  isRevendeur
                                    ? 'text-purple-600'
                                    : 'text-teal-600'
                                }
                              >
                                {isRevendeur
                                  ? `${item.commission_rate ?? 0}%`
                                  : `${item.margin_rate ?? 0}%`}
                              </span>
                              <p className="text-[10px] text-gray-400">
                                {isRevendeur ? 'Comm. LinkMe' : 'Marge affilié'}
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  isRevendeur
                                    ? 'text-purple-600'
                                    : 'text-teal-600'
                                }
                              >
                                {formatCurrency(marginCommissionEuros)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              {formatCurrency(payoutAffilie)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex-1 space-y-2">
                  {order.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {item.product?.name ?? 'Produit inconnu'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.product?.sku ?? '-'} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.total_ht)} HT
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CONTACTS: Responsable + Facturation side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RESPONSABLE */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-base">Responsable</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedContactId(null);
                      setContactDialogFor('responsable');
                    }}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Changer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {details ? (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-bold text-sm">
                        {(details.requester_name ?? '')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {details.requester_name}
                      </p>
                      {details.requester_position && (
                        <p className="text-xs text-gray-500">
                          {details.requester_position}
                        </p>
                      )}
                      {details.requester_email && (
                        <a
                          href={`mailto:${details.requester_email}`}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {details.requester_email}
                        </a>
                      )}
                      {details.requester_phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone className="h-3 w-3" />
                          {details.requester_phone}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Non disponible</p>
                )}
              </CardContent>
            </Card>

            {/* FACTURATION */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-green-100">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                    <CardTitle className="text-base">Facturation</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedContactId(null);
                      setContactDialogFor('billing');
                    }}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Changer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {details ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 font-bold text-sm">
                          {(details.billing_name ?? '')
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {details.billing_name ?? 'Non renseigné'}
                        </p>
                        {details.billing_email && (
                          <a
                            href={`mailto:${details.billing_email}`}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <Mail className="h-3 w-3" />
                            {details.billing_email}
                          </a>
                        )}
                        {details.billing_phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            <Phone className="h-3 w-3" />
                            {details.billing_phone}
                          </span>
                        )}
                      </div>
                    </div>
                    {order.organisation && (
                      <div className="flex items-start gap-2 p-2 bg-green-50/50 rounded-lg border border-green-100 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">
                            {order.organisation.billing_address_line1
                              ? [
                                  order.organisation.billing_address_line1,
                                  order.organisation.billing_address_line2,
                                ]
                                  .filter(Boolean)
                                  .join(', ')
                              : [
                                  order.organisation.address_line1,
                                  order.organisation.address_line2,
                                ]
                                  .filter(Boolean)
                                  .join(', ')}
                          </p>
                          <p className="text-gray-600">
                            {order.organisation.billing_address_line1
                              ? [
                                  order.organisation.billing_postal_code,
                                  order.organisation.billing_city,
                                ]
                                  .filter(Boolean)
                                  .join(' ')
                              : [
                                  order.organisation.postal_code,
                                  order.organisation.city,
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Non disponible</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* LIVRAISON */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-cyan-100">
                  <Truck className="h-4 w-4 text-cyan-600" />
                </div>
                <CardTitle className="text-lg">Livraison</CardTitle>
                {order.status === 'validated' &&
                  renderStepBadge(isStep4Complete())}
              </div>
            </CardHeader>
            <CardContent>
              {details ? (
                <div className="space-y-6">
                  {/* Contact livraison */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Contact livraison
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContactId(null);
                          setContactDialogFor('delivery');
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Changer contact
                      </Button>
                    </div>
                    {details.delivery_contact_name ? (
                      <div className="space-y-1">
                        <p className="font-medium">
                          {details.delivery_contact_name}
                        </p>
                        {details.delivery_contact_email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a
                              href={`mailto:${details.delivery_contact_email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {details.delivery_contact_email}
                            </a>
                          </div>
                        )}
                        {details.delivery_contact_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{details.delivery_contact_phone}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        Aucun contact renseigné
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Adresse livraison */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Adresse de livraison
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog('delivery_address')}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                    </div>
                    {details.delivery_address ? (
                      <div>
                        <p className="text-sm">
                          {details.delivery_address}
                          {details.delivery_postal_code &&
                            `, ${details.delivery_postal_code}`}
                          {details.delivery_city && ` ${details.delivery_city}`}
                        </p>
                        {org && (
                          <span
                            className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                              deliveryAddressMatchesOrg
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {deliveryAddressMatchesOrg ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Adresse restaurant confirmée
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3" />
                                Adresse différente du restaurant
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        Aucune adresse renseignée
                      </p>
                    )}
                    {org &&
                      (org.address_line1 ?? org.shipping_address_line1) && (
                        <button
                          type="button"
                          disabled={
                            deliveryAddressMatchesOrg || updateDetails.isPending
                          }
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            deliveryAddressMatchesOrg
                              ? 'bg-blue-50 border-blue-100 cursor-default'
                              : 'bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 hover:border-blue-300'
                          }`}
                          onClick={() => {
                            if (deliveryAddressMatchesOrg) return;
                            void handleUseOrgAddress().catch((err: unknown) => {
                              console.error(
                                '[LinkMeOrderDetails] Use org address failed:',
                                err
                              );
                            });
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-blue-600" />
                              <p className="text-xs font-medium text-blue-700">
                                Adresse restaurant (organisation)
                              </p>
                            </div>
                            {!deliveryAddressMatchesOrg &&
                              !updateDetails.isPending && (
                                <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                  Utiliser cette adresse
                                </span>
                              )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {org.has_different_shipping_address
                              ? [
                                  org.shipping_address_line1,
                                  org.shipping_address_line2,
                                ]
                                  .filter(Boolean)
                                  .join(', ')
                              : [org.address_line1, org.address_line2]
                                  .filter(Boolean)
                                  .join(', ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {org.has_different_shipping_address
                              ? [org.shipping_postal_code, org.shipping_city]
                                  .filter(Boolean)
                                  .join(' ')
                              : [org.postal_code, org.city]
                                  .filter(Boolean)
                                  .join(' ')}
                          </p>
                        </button>
                      )}
                  </div>

                  <Separator />

                  {/* Options livraison */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Options
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog('delivery_options')}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Modalités acceptées</span>
                          <Badge
                            variant={
                              details.delivery_terms_accepted
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {details.delivery_terms_accepted ? 'Oui' : 'Non'}
                          </Badge>
                        </div>
                        {details.desired_delivery_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              Souhaitée :{' '}
                              {new Date(
                                details.desired_delivery_date
                              ).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                        {details.delivery_notes && (
                          <div>
                            <Label className="text-xs text-gray-500">
                              Notes
                            </Label>
                            <p className="text-sm text-gray-600">
                              {details.delivery_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Centre commercial</span>
                          <Badge
                            variant={
                              details.is_mall_delivery ? 'default' : 'outline'
                            }
                          >
                            {details.is_mall_delivery ? 'Oui' : 'Non'}
                          </Badge>
                        </div>
                        {details.is_mall_delivery && details.mall_email && (
                          <div className="text-sm text-gray-600">
                            Email direction : {details.mall_email}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Accès semi-remorque</span>
                          <Badge
                            variant={
                              details.semi_trailer_accessible
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {details.semi_trailer_accessible ? 'Oui' : 'Non'}
                          </Badge>
                        </div>
                        {details.access_form_required && (
                          <div className="p-3 bg-gray-50 rounded-lg text-sm">
                            <p className="font-medium">
                              Formulaire accès requis
                            </p>
                            {details.access_form_url && (
                              <a
                                href={details.access_form_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Voir le formulaire
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post-approbation */}
                  {order.status === 'validated' && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">
                          Post-approbation
                        </p>
                        {details.step4_token && (
                          <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-1">
                            <p className="font-medium text-blue-700">
                              Token de validation actif
                            </p>
                            {details.step4_token_expires_at && (
                              <p className="text-blue-600">
                                Expire le :{' '}
                                {new Date(
                                  details.step4_token_expires_at
                                ).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                            {details.step4_completed_at && (
                              <p className="text-green-700">
                                <Check className="h-4 w-4 inline mr-1" />
                                Complété le :{' '}
                                {new Date(
                                  details.step4_completed_at
                                ).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        )}
                        {details.reception_contact_name && (
                          <div>
                            <Label className="text-xs text-gray-500">
                              Contact réception
                            </Label>
                            <p className="font-medium">
                              {details.reception_contact_name}
                            </p>
                          </div>
                        )}
                        {details.confirmed_delivery_date && (
                          <div className="flex items-center gap-2 text-sm p-3 bg-green-50 rounded-lg text-green-700">
                            <Calendar className="h-4 w-4" />
                            <span>
                              <strong>Date confirmée :</strong>{' '}
                              {new Date(
                                details.confirmed_delivery_date
                              ).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                        {!details.reception_contact_name &&
                          !details.confirmed_delivery_date && (
                            <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                              <Clock className="h-4 w-4 inline mr-1" />
                              En attente de confirmation via le lien email.
                            </div>
                          )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Données non disponibles</p>
              )}
            </CardContent>
          </Card>

          {/* HISTORIQUE DEMANDES */}
          {order.infoRequests.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg">
                    Historique des demandes
                  </CardTitle>
                  <Badge variant="secondary" className="ml-auto">
                    {order.infoRequests.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...order.infoRequests]
                    .sort(
                      (a, b) =>
                        new Date(b.sent_at).getTime() -
                        new Date(a.sent_at).getTime()
                    )
                    .map(req => {
                      const isPending = !req.completed_at && !req.cancelled_at;
                      const isCompleted = !!req.completed_at;
                      const isCancelled = !!req.cancelled_at;
                      return (
                        <div
                          key={req.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            isPending
                              ? 'border-yellow-200 bg-yellow-50'
                              : isCompleted
                                ? 'border-green-200 bg-green-50'
                                : 'border-red-200 bg-red-50'
                          }`}
                        >
                          {isPending && (
                            <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          )}
                          {isCompleted && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          )}
                          {isCancelled && (
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900">
                                {req.recipient_email}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {req.recipient_type === 'requester'
                                  ? 'Demandeur'
                                  : 'Propriétaire'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Envoyé le{' '}
                              {new Date(req.sent_at).toLocaleDateString(
                                'fr-FR',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )}
                              {isCompleted && req.completed_at && (
                                <span className="text-green-700 ml-2">
                                  — Complété le{' '}
                                  {new Date(
                                    req.completed_at
                                  ).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </span>
                              )}
                              {isCancelled && req.cancelled_reason && (
                                <span className="text-red-700 ml-2">
                                  — Raison : {req.cancelled_reason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ============================================ */}
        {/* COLONNE DROITE - SIDEBAR (1/3) */}
        {/* ============================================ */}
        <div className="space-y-6">
          {/* STATUT + ACTIONS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(order.status)}
                <span className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="space-y-2">
                {order.status === 'draft' && (
                  <Button
                    className="w-full gap-2"
                    disabled={isUpdatingStatus}
                    onClick={() => {
                      void handleStatusChange('validated').catch(err =>
                        console.error(err)
                      );
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isUpdatingStatus ? 'En cours...' : 'Valider la commande'}
                  </Button>
                )}
                {order.status === 'validated' && (
                  <Button
                    className="w-full gap-2"
                    disabled={isUpdatingStatus}
                    onClick={() => {
                      void handleStatusChange('shipped').catch(err =>
                        console.error(err)
                      );
                    }}
                  >
                    <Truck className="h-4 w-4" />
                    {isUpdatingStatus ? 'En cours...' : 'Marquer expédiée'}
                  </Button>
                )}
                {/* shipped is a terminal status before delivery — no further action */}
                {order.status !== 'cancelled' &&
                  order.status !== 'delivered' && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={isUpdatingStatus}
                      onClick={() => {
                        void handleStatusChange('cancelled').catch(err =>
                          console.error(err)
                        );
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      {isUpdatingStatus ? 'En cours...' : 'Annuler'}
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* TOTAUX */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Totaux</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total HT</span>
                  <span className="font-medium">
                    {formatCurrency(order.total_ht)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total TTC</span>
                  <span>{formatCurrency(order.total_ttc)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FRAIS */}
          <FeesSection
            orderId={order.id}
            shippingCostHt={order.shipping_cost_ht ?? 0}
            handlingCostHt={order.handling_cost_ht ?? 0}
            insuranceCostHt={order.insurance_cost_ht ?? 0}
            feesVatRate={order.fees_vat_rate ?? 0.2}
          />

          {/* PAIEMENT */}
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

          {/* FACTURES */}
          <InvoicesSection orderId={order.id} />

          {/* NOTES */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* DIALOG: SÉLECTION CONTACT */}
      {/* ============================================ */}
      <Dialog
        open={contactDialogFor !== null}
        onOpenChange={open => {
          if (!open) {
            setContactDialogFor(null);
            setSelectedContactId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {contactDialogFor === 'responsable'
                ? 'Responsable établissement'
                : contactDialogFor === 'billing'
                  ? 'Responsable facturation'
                  : 'Contact livraison'}
            </DialogTitle>
            <DialogDescription>
              Sélectionnez un contact existant ou créez-en un nouveau.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Nouveau contact
              </h4>
              <NewContactForm
                sectionLabel={
                  contactDialogFor === 'responsable'
                    ? 'Créer un responsable'
                    : contactDialogFor === 'billing'
                      ? 'Créer un contact facturation'
                      : 'Créer un contact livraison'
                }
                onSubmit={handleCreateAndSelectContact}
                onCancel={() => {
                  setContactDialogFor(null);
                }}
                isSubmitting={
                  createContactBO.isPending || updateDetails.isPending
                }
              />
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contacts disponibles ({availableContacts.length})
              </h4>
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {availableContacts.length > 0 ? (
                  availableContacts.map(contact => (
                    <ContactCardBO
                      key={contact.id}
                      contact={contact}
                      isSelected={selectedContactId === contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucun contact disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setContactDialogFor(null);
                setSelectedContactId(null);
              }}
            >
              Annuler
            </Button>
            <Button
              disabled={!selectedContactId || updateDetails.isPending}
              onClick={() => {
                void handleConfirmContact().catch(err => {
                  console.error(
                    '[LinkMeOrderDetails] Confirm contact failed:',
                    err
                  );
                });
              }}
            >
              {updateDetails.isPending
                ? 'Enregistrement...'
                : 'Confirmer la sélection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DIALOGS ÉDITION */}
      {/* ============================================ */}

      {/* Dialog: Éditer Responsable */}
      <Dialog
        open={editingStep === 'responsable'}
        onOpenChange={() => setEditingStep(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le Responsable</DialogTitle>
            <DialogDescription>
              Modifiez les informations du contact responsable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Type de demandeur *</Label>
              <Select
                value={editForm.requester_type ?? ''}
                onValueChange={v =>
                  setEditForm(prev => ({ ...prev, requester_type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="responsable_enseigne">
                    Responsable Enseigne
                  </SelectItem>
                  <SelectItem value="architecte">Architecte</SelectItem>
                  <SelectItem value="franchisee">Franchisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom complet *</Label>
              <Input
                value={editForm.requester_name ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    requester_name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={editForm.requester_email ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    requester_email: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={editForm.requester_phone ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    requester_phone: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Poste / Fonction</Label>
              <Input
                value={editForm.requester_position ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    requester_position: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStep(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                void handleSaveEdit().catch(error => {
                  console.error(
                    '[LinkMeOrderDetails] Save edit failed:',
                    error
                  );
                });
              }}
              disabled={updateDetails.isPending}
            >
              {updateDetails.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Éditer Facturation */}
      <Dialog
        open={editingStep === 'billing'}
        onOpenChange={() => setEditingStep(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la Facturation</DialogTitle>
            <DialogDescription>
              Modifiez les informations de facturation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Source du contact facturation</Label>
              <Select
                value={editForm.billing_contact_source ?? ''}
                onValueChange={v =>
                  setEditForm(prev => ({
                    ...prev,
                    billing_contact_source: v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="step1">
                    Identique au responsable
                  </SelectItem>
                  <SelectItem value="step2">
                    Identique au propriétaire
                  </SelectItem>
                  <SelectItem value="custom">Contact personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom contact facturation</Label>
              <Input
                value={editForm.billing_name ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    billing_name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email facturation</Label>
              <Input
                type="email"
                value={editForm.billing_email ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    billing_email: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone facturation</Label>
              <Input
                value={editForm.billing_phone ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    billing_phone: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStep(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                void handleSaveEdit().catch(error => {
                  console.error(
                    '[LinkMeOrderDetails] Save edit failed:',
                    error
                  );
                });
              }}
              disabled={updateDetails.isPending}
            >
              {updateDetails.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Éditer Adresse Livraison */}
      <Dialog
        open={editingStep === 'delivery_address'}
        onOpenChange={() => setEditingStep(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;adresse de livraison</DialogTitle>
            <DialogDescription>
              Modifiez l&apos;adresse ou sélectionnez celle du restaurant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {org && (org.address_line1 ?? org.shipping_address_line1) && (
              <button
                type="button"
                className="w-full text-left p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                onClick={() => {
                  const useShipping = org.has_different_shipping_address;
                  setEditForm(prev => ({
                    ...prev,
                    delivery_address: useShipping
                      ? [org.shipping_address_line1, org.shipping_address_line2]
                          .filter(Boolean)
                          .join(', ')
                      : [org.address_line1, org.address_line2]
                          .filter(Boolean)
                          .join(', '),
                    delivery_postal_code:
                      (useShipping
                        ? org.shipping_postal_code
                        : org.postal_code) ?? '',
                    delivery_city:
                      (useShipping ? org.shipping_city : org.city) ?? '',
                  }));
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <p className="text-xs font-medium text-blue-700">
                      Adresse restaurant
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                    Utiliser cette adresse
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {org.has_different_shipping_address
                    ? [org.shipping_address_line1, org.shipping_address_line2]
                        .filter(Boolean)
                        .join(', ')
                    : [org.address_line1, org.address_line2]
                        .filter(Boolean)
                        .join(', ')}
                </p>
                <p className="text-sm text-gray-600">
                  {org.has_different_shipping_address
                    ? [org.shipping_postal_code, org.shipping_city]
                        .filter(Boolean)
                        .join(' ')
                    : [org.postal_code, org.city].filter(Boolean).join(' ')}
                </p>
              </button>
            )}
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={editForm.delivery_address ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    delivery_address: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input
                  value={editForm.delivery_postal_code ?? ''}
                  onChange={e =>
                    setEditForm(prev => ({
                      ...prev,
                      delivery_postal_code: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={editForm.delivery_city ?? ''}
                  onChange={e =>
                    setEditForm(prev => ({
                      ...prev,
                      delivery_city: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStep(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                void handleSaveEdit().catch(error => {
                  console.error(
                    '[LinkMeOrderDetails] Save edit failed:',
                    error
                  );
                });
              }}
              disabled={updateDetails.isPending}
            >
              {updateDetails.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Éditer Options Livraison */}
      <Dialog
        open={editingStep === 'delivery_options'}
        onOpenChange={() => setEditingStep(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Options de livraison</DialogTitle>
            <DialogDescription>
              Modifiez les options et dates de livraison.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Modalités de livraison acceptées</Label>
                <p className="text-xs text-gray-500">
                  Le client a accepté les conditions
                </p>
              </div>
              <Switch
                checked={editForm.delivery_terms_accepted ?? false}
                onCheckedChange={checked =>
                  setEditForm(prev => ({
                    ...prev,
                    delivery_terms_accepted: checked,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Date de livraison souhaitée</Label>
              <Input
                type="date"
                value={editForm.desired_delivery_date ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    desired_delivery_date: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Livraison en centre commercial</Label>
              </div>
              <Switch
                checked={editForm.is_mall_delivery ?? false}
                onCheckedChange={checked =>
                  setEditForm(prev => ({
                    ...prev,
                    is_mall_delivery: checked,
                  }))
                }
              />
            </div>
            {editForm.is_mall_delivery && (
              <div className="space-y-2">
                <Label>Email direction centre commercial</Label>
                <Input
                  type="email"
                  value={editForm.mall_email ?? ''}
                  onChange={e =>
                    setEditForm(prev => ({
                      ...prev,
                      mall_email: e.target.value,
                    }))
                  }
                />
              </div>
            )}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Accès semi-remorque</Label>
              </div>
              <Switch
                checked={editForm.semi_trailer_accessible ?? false}
                onCheckedChange={checked =>
                  setEditForm(prev => ({
                    ...prev,
                    semi_trailer_accessible: checked,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notes de livraison</Label>
              <Textarea
                value={editForm.delivery_notes ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    delivery_notes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            {order.status === 'validated' && (
              <>
                <Separator />
                <p className="text-sm font-medium text-gray-700">
                  Réception (post-approbation)
                </p>
                <div className="space-y-2">
                  <Label>Nom du contact réception</Label>
                  <Input
                    value={editForm.reception_contact_name ?? ''}
                    onChange={e =>
                      setEditForm(prev => ({
                        ...prev,
                        reception_contact_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email contact réception</Label>
                  <Input
                    type="email"
                    value={editForm.reception_contact_email ?? ''}
                    onChange={e =>
                      setEditForm(prev => ({
                        ...prev,
                        reception_contact_email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone contact réception</Label>
                  <Input
                    value={editForm.reception_contact_phone ?? ''}
                    onChange={e =>
                      setEditForm(prev => ({
                        ...prev,
                        reception_contact_phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de livraison confirmée</Label>
                  <Input
                    type="date"
                    value={editForm.confirmed_delivery_date ?? ''}
                    onChange={e =>
                      setEditForm(prev => ({
                        ...prev,
                        confirmed_delivery_date: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStep(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                void handleSaveEdit().catch(error => {
                  console.error(
                    '[LinkMeOrderDetails] Save edit failed:',
                    error
                  );
                });
              }}
              disabled={updateDetails.isPending}
            >
              {updateDetails.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
