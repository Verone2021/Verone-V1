'use client';

/**
 * Page: Détail Commande Enseigne LinkMe
 *
 * Affiche tous les détails d'une commande Enseigne B2B avec 6 sections miroir du formulaire:
 * - Section 1: Restaurant (org, adresse, type)
 * - Section 2: Sélection (nom, nb produits)
 * - Section 3: Produits (tableau articles avec commissions)
 * - Section 4: Responsable (contact: nom, email, phone, poste)
 * - Section 5: Facturation (contact + adresse)
 * - Section 6: Livraison (contact + adresse + options, TOUJOURS visible)
 *
 * + Encart "Demandeur" = user de la session (created_by)
 *
 * Actions:
 * - Approuver (pas de blocage propriétaire)
 * - Demander compléments
 * - Refuser
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
  Separator,
  Skeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  User,
  UserPlus,
  Users,
  Building2,
  CreditCard,
  Package,
  Calendar,
  Mail,
  Phone,
  ExternalLink,
  Pencil,
  Truck,
  Clock,
  Check,
} from 'lucide-react';

import {
  useApproveOrder,
  useRequestInfo,
  useRejectOrder,
  useUpdateLinkMeDetails,
  type LinkMeOrderDetails,
} from '../../hooks/use-linkme-order-actions';

import {
  getOrderMissingFields,
  getRelevantTemplates,
  REJECT_REASON_TEMPLATES,
  type RequestInfoTemplate,
  type RejectReasonTemplate,
} from '../../utils/order-missing-fields';

import {
  useOrganisationContactsBO,
  useEnseigneContactsBO,
  useCreateContactBO,
  type ContactBO,
} from '../../hooks/use-organisation-contacts-bo';

import { ContactCardBO } from '../../components/contacts/ContactCardBO';
import { NewContactForm } from '../../components/contacts/NewContactForm';
import type { NewContactFormData } from '../../components/contacts/NewContactForm';

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
  customer_id: string;
  expected_delivery_date: string | null;
  created_by_affiliate_id: string | null;
  linkme_selection_id: string | null;
  created_by: string | null;
  createdByProfile: CreatedByProfile | null;
  organisation: {
    id: string;
    trade_name: string | null;
    legal_name: string;
    approval_status: string | null;
    enseigne_id: string | null;
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
}

// Type pour les items enrichis avec infos commission
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
  // Ajouté via jointure products
  created_by_affiliate: string | null;
}

// Types pour les données Supabase intermédiaires
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

// Fonction pour determiner le canal de la commande
function getOrderChannel(
  created_by_affiliate_id: string | null,
  linkme_selection_id: string | null
): { label: string; color: string; bg: string } {
  // B1 fix: vérifier affiliate EN PREMIER (une commande affilié a aussi une sélection)
  if (created_by_affiliate_id !== null) {
    return {
      label: 'Affilié',
      color: 'text-teal-700',
      bg: 'bg-teal-100',
    };
  }
  if (linkme_selection_id !== null) {
    return {
      label: 'Sélection publique',
      color: 'text-amber-700',
      bg: 'bg-amber-100',
    };
  }
  return {
    label: 'Back-office',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
  };
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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRejectReason, setSelectedRejectReason] = useState<
    string | null
  >(null);

  // Dialogs édition par section
  const [editingStep, setEditingStep] = useState<
    'responsable' | 'billing' | 'delivery' | null
  >(null);
  const [editForm, setEditForm] = useState<Partial<LinkMeOrderDetails>>({});

  // Dialog sélection contact (responsable / facturation)
  const [contactDialogFor, setContactDialogFor] = useState<
    'responsable' | 'billing' | null
  >(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );

  // Mutations
  const approveOrder = useApproveOrder();
  const requestInfo = useRequestInfo();
  const rejectOrder = useRejectOrder();
  const updateDetails = useUpdateLinkMeDetails();
  const createContactBO = useCreateContactBO();

  // Contacts hooks - dépendent du type de restaurant (propre = enseigne, franchise = org)
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

  // Contacts disponibles selon le type
  const availableContacts: ContactBO[] =
    (isSuccursale
      ? enseigneContactsData?.contacts
      : orgContactsData?.contacts) ?? [];

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      // UNE SEULE requête avec jointures (fix perf: évite 3 requêtes séquentielles)
      const { data: orderData, error: orderError } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
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
          organisations!sales_orders_customer_id_fkey (
            id,
            trade_name,
            legal_name,
            approval_status,
            enseigne_id
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

      // Extraire organisation de la jointure (peut être array ou objet selon Supabase)
      const orgRaw: unknown = orderData.organisations;
      const organisation = (
        Array.isArray(orgRaw) ? (orgRaw[0] ?? null) : (orgRaw ?? null)
      ) as OrderWithDetails['organisation'];

      // Extraire linkme details de la jointure (peut être array ou objet selon Supabase)
      const linkmeDetailsRaw: unknown = orderData.sales_order_linkme_details;
      const linkmeData = (
        Array.isArray(linkmeDetailsRaw)
          ? (linkmeDetailsRaw[0] ?? null)
          : (linkmeDetailsRaw ?? null)
      ) as LinkMeOrderDetails | null;

      // Fetch créateur (created_by → user_profiles)
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
        createdByProfile,
        organisation: organisation,
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
      });

      // Récupérer les items enrichis avec infos commission
      const { data: enrichedData } = await supabase
        .from('linkme_order_items_enriched')
        .select('*')
        .eq('sales_order_id', orderId);

      if (enrichedData && enrichedData.length > 0) {
        // Cast enriched data to typed array
        const typedEnrichedData = enrichedData as LinkmeOrderItemEnrichedRaw[];

        // Récupérer les product_ids pour fetch created_by_affiliate
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
      const missingFields = getOrderMissingFields({ details });
      await requestInfo.mutateAsync({
        orderId,
        message: requestMessage,
        missingFields: missingFields.fields.map(f => ({
          label: f.label,
          category: f.category,
        })),
      });
      setShowRequestInfoDialog(false);
      setRequestMessage('');
      setSelectedTemplate(null);
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

  // Handlers Édition
  const openEditDialog = (step: 'responsable' | 'billing' | 'delivery') => {
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
    } else if (step === 'delivery') {
      setEditForm({
        delivery_contact_name: d.delivery_contact_name,
        delivery_contact_email: d.delivery_contact_email,
        delivery_contact_phone: d.delivery_contact_phone,
        delivery_address: d.delivery_address,
        delivery_postal_code: d.delivery_postal_code,
        delivery_city: d.delivery_city,
        delivery_notes: d.delivery_notes,
        delivery_terms_accepted: d.delivery_terms_accepted,
        desired_delivery_date: d.desired_delivery_date,
        is_mall_delivery: d.is_mall_delivery,
        mall_email: d.mall_email,
        semi_trailer_accessible: d.semi_trailer_accessible,
        // Post-approbation fields
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
      console.error('Erreur mise à jour:', err);
    }
  };

  // Confirmer la sélection d'un contact (responsable ou facturation)
  const handleConfirmContact = async () => {
    if (!contactDialogFor || !selectedContactId) return;
    const contact = availableContacts.find(c => c.id === selectedContactId);
    if (!contact) return;

    const fullName = `${contact.firstName} ${contact.lastName}`;
    const updates: Partial<LinkMeOrderDetails> =
      contactDialogFor === 'responsable'
        ? {
            requester_name: fullName,
            requester_email: contact.email,
            requester_phone: contact.phone ?? undefined,
            requester_position: contact.title ?? undefined,
          }
        : {
            billing_name: fullName,
            billing_email: contact.email,
            billing_phone: contact.phone ?? undefined,
            billing_contact_source: 'custom',
          };

    try {
      await updateDetails.mutateAsync({ orderId, updates });
      setContactDialogFor(null);
      setSelectedContactId(null);
      void fetchOrder().catch(err => {
        console.error(
          '[LinkMeOrderDetail] Refetch after contact select failed:',
          err
        );
      });
    } catch (err) {
      console.error('Erreur mise à jour contact:', err);
    }
  };

  // Créer un nouveau contact ET mettre à jour la commande
  const handleCreateAndSelectContact = async (
    contactData: NewContactFormData
  ) => {
    // 1. Créer le contact en BD (lié à org ou enseigne selon type)
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

    // 2. Mettre à jour la commande avec ce nouveau contact
    const fullName = `${contactData.firstName} ${contactData.lastName}`;
    const updates: Partial<LinkMeOrderDetails> =
      contactDialogFor === 'responsable'
        ? {
            requester_name: fullName,
            requester_email: contactData.email,
            requester_phone: contactData.phone || undefined,
            requester_position: contactData.title || undefined,
          }
        : {
            billing_name: fullName,
            billing_email: contactData.email,
            billing_phone: contactData.phone || undefined,
            billing_contact_source: 'custom',
          };

    await updateDetails.mutateAsync({ orderId, updates });

    // 3. Fermer dialog + refetch
    setContactDialogFor(null);
    setSelectedContactId(null);
    void fetchOrder().catch(err => {
      console.error(
        '[LinkMeOrderDetail] Refetch after create contact failed:',
        err
      );
    });
  };

  // Helpers validation
  const isStep4Complete = () => {
    if (!order?.linkmeDetails) return false;
    return !!order.linkmeDetails.step4_completed_at;
  };

  // Helper badge status
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

  // Render step completion badge
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

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
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

  return (
    <div className="space-y-6 p-6">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="flex items-center justify-between">
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
              {/* Badge Canal */}
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

        {/* Actions (seulement si draft) */}
        {order.status === 'draft' && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowRequestInfoDialog(true)}
            >
              <MessageSquare className="h-4 w-4" />
              Demander compléments
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="h-4 w-4" />
              Refuser
            </Button>
            <Button
              className="gap-2"
              onClick={() => setShowApproveDialog(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approuver
            </Button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* DEMANDEUR (created_by = user session) */}
      {/* ============================================ */}
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
      {/* RÉCAPITULATIF COMMANDE */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Récapitulatif commande</CardTitle>
            </div>
            <CardDescription>
              {order.items.length} article(s) - Total:{' '}
              {formatCurrency(order.total_ttc)} TTC
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tableau détaillé des items avec commissions */}
          {enrichedItems.length > 0 ? (
            <div className="overflow-x-auto mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Produit</TableHead>
                    <TableHead className="text-right">Prix vente HT</TableHead>
                    <TableHead className="text-center">Qté</TableHead>
                    <TableHead className="text-right">Total HT</TableHead>
                    <TableHead className="text-center">Marge/Comm. %</TableHead>
                    <TableHead className="text-right">Marge/Comm. €</TableHead>
                    <TableHead className="text-right">Payout affilié</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedItems.map(item => {
                    const isRevendeur = !!item.created_by_affiliate;
                    // Calcul de la marge/commission en €
                    const marginCommissionEuros = item.affiliate_margin ?? 0;
                    // Payout affilié = prix vente - commission LinkMe (pour revendeur)
                    // Pour catalogue: payout = marge gagnée
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
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total_ht)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={
                              isRevendeur ? 'text-purple-600' : 'text-teal-600'
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
                              isRevendeur ? 'text-purple-600' : 'text-teal-600'
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
            /* Fallback: liste simple si pas de données enrichies */
            <div className="flex-1 space-y-2 mb-6">
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

          {/* Totaux */}
          <div className="flex justify-end">
            <div className="w-full lg:w-48 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total HT</span>
                <span className="font-medium">
                  {formatCurrency(order.total_ht)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Total TTC</span>
                <span>{formatCurrency(order.total_ttc)}</span>
              </div>
            </div>
          </div>
          {/* Notes */}
          {order.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <Label className="text-xs text-gray-500">Notes internes</Label>
                <p className="text-sm text-gray-600 mt-1">{order.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* 6 SECTIONS MIROIR DU FORMULAIRE */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ------------------------------------------ */}
        {/* SECTION 1: RESTAURANT */}
        {/* ------------------------------------------ */}
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
                {/* Nom du restaurant - proéminent */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Établissement
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {order.organisation.trade_name ??
                      order.organisation.legal_name}
                  </p>
                </div>
                {/* Badges - gros et colorés */}
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
              </div>
            ) : (
              <p className="text-gray-500">Organisation non renseignée</p>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------ */}
        {/* SECTION 4: RESPONSABLE */}
        {/* ------------------------------------------ */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-lg">
                  Responsable établissement
                </CardTitle>
                {details?.requester_type && (
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      details.requester_type === 'responsable_enseigne'
                        ? 'bg-blue-100 text-blue-700'
                        : details.requester_type === 'architecte'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-violet-100 text-violet-700'
                    }`}
                  >
                    {details.requester_type === 'responsable_enseigne'
                      ? 'Resp. Enseigne'
                      : details.requester_type === 'architecte'
                        ? 'Architecte'
                        : 'Franchisé'}
                  </span>
                )}
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
                Changer contact
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {details ? (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                {/* Avatar initiales */}
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-lg">
                    {(details.requester_name ?? '')
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                {/* Infos contact */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-base font-semibold text-gray-900">
                    {details.requester_name}
                  </p>
                  {details.requester_position && (
                    <p className="text-sm text-gray-500">
                      {details.requester_position}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-2">
                    {details.requester_email && (
                      <a
                        href={`mailto:${details.requester_email}`}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {details.requester_email}
                      </a>
                    )}
                    {details.requester_phone && (
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5" />
                        {details.requester_phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Données non disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------ */}
        {/* SECTION 5: FACTURATION */}
        {/* ------------------------------------------ */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-green-100">
                  <CreditCard className="h-4 w-4 text-green-600" />
                </div>
                <CardTitle className="text-lg">
                  Responsable facturation
                </CardTitle>
                {details?.billing_contact_source && (
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      details.billing_contact_source === 'step1'
                        ? 'bg-blue-100 text-blue-700'
                        : details.billing_contact_source === 'step2'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {details.billing_contact_source === 'step1'
                      ? 'Identique responsable'
                      : details.billing_contact_source === 'step2'
                        ? 'Identique propriétaire'
                        : 'Contact personnalisé'}
                  </span>
                )}
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
                Changer contact
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {details ? (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                {/* Avatar initiales */}
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 font-bold text-lg">
                    {(details.billing_name ?? '')
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                {/* Infos contact */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-base font-semibold text-gray-900">
                    {details.billing_name ?? 'Non renseigné'}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {details.billing_email && (
                      <a
                        href={`mailto:${details.billing_email}`}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {details.billing_email}
                      </a>
                    )}
                    {details.billing_phone && (
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5" />
                        {details.billing_phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Données non disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------ */}
        {/* SECTION 6: LIVRAISON (TOUJOURS visible) */}
        {/* ------------------------------------------ */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-cyan-100">
                  <Truck className="h-4 w-4 text-cyan-600" />
                </div>
                <CardTitle className="text-lg">Livraison</CardTitle>
                {order.status === 'validated' &&
                  renderStepBadge(isStep4Complete())}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog('delivery')}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Modifier
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {details ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne gauche : adresse + contact livraison */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Informations de livraison
                  </p>
                  {/* Adresse */}
                  {details.delivery_address && (
                    <div>
                      <Label className="text-xs text-gray-500">Adresse</Label>
                      <p className="text-sm">
                        {details.delivery_address}
                        {details.delivery_postal_code &&
                          `, ${details.delivery_postal_code}`}
                        {details.delivery_city && ` ${details.delivery_city}`}
                      </p>
                    </div>
                  )}
                  {/* Contact livraison */}
                  {details.delivery_contact_name && (
                    <div>
                      <Label className="text-xs text-gray-500">
                        Contact livraison
                      </Label>
                      <p className="font-medium">
                        {details.delivery_contact_name}
                      </p>
                    </div>
                  )}
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
                  {/* Modalités */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Modalités acceptées</span>
                    <Badge
                      variant={
                        details.delivery_terms_accepted ? 'default' : 'outline'
                      }
                    >
                      {details.delivery_terms_accepted ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                  {/* Date souhaitée */}
                  {details.desired_delivery_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        Livraison souhaitée :{' '}
                        {new Date(
                          details.desired_delivery_date
                        ).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  {/* Notes livraison */}
                  {details.delivery_notes && (
                    <div>
                      <Label className="text-xs text-gray-500">Notes</Label>
                      <p className="text-sm text-gray-600">
                        {details.delivery_notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Colonne droite : options + post-approbation */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Options</p>
                  {/* Centre commercial */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Centre commercial</span>
                    <Badge
                      variant={details.is_mall_delivery ? 'default' : 'outline'}
                    >
                      {details.is_mall_delivery ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                  {details.is_mall_delivery && details.mall_email && (
                    <div className="text-sm text-gray-600">
                      Email direction : {details.mall_email}
                    </div>
                  )}
                  {/* Semi-remorque */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accès semi-remorque</span>
                    <Badge
                      variant={
                        details.semi_trailer_accessible ? 'default' : 'outline'
                      }
                    >
                      {details.semi_trailer_accessible ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                  {/* Formulaire accès */}
                  {details.access_form_required && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">Formulaire accès requis</p>
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

                  {/* Post-approbation (si validée) */}
                  {order.status === 'validated' && (
                    <>
                      <Separator />
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
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Données non disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* DIALOG: SÉLECTION CONTACT (Responsable / Facturation) */}
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
                : 'Responsable facturation'}
            </DialogTitle>
            <DialogDescription>
              Sélectionnez un contact existant ou créez-en un nouveau.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* GAUCHE : Nouveau contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Nouveau contact
              </h4>
              <NewContactForm
                sectionLabel={
                  contactDialogFor === 'responsable'
                    ? 'Créer un responsable'
                    : 'Créer un contact facturation'
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

            {/* DROITE : Contacts disponibles */}
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
                    <p className="text-xs mt-1">
                      Créez-en un via le formulaire
                    </p>
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
                    '[LinkMeOrderDetail] Confirm contact failed:',
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
      {/* DIALOGS ACTIONS */}
      {/* ============================================ */}

      {/* Dialog: Approuver */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver la commande</DialogTitle>
            <DialogDescription>
              Un email sera envoyé au propriétaire avec un lien pour compléter
              l&apos;Étape 4 (informations de livraison).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                void handleApprove().catch(error => {
                  console.error('[LinkMeOrderDetail] Approve failed:', error);
                });
              }}
              disabled={approveOrder.isPending}
            >
              {approveOrder.isPending ? 'En cours...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Demander compléments (avec templates préconfigurés) */}
      <Dialog
        open={showRequestInfoDialog}
        onOpenChange={open => {
          setShowRequestInfoDialog(open);
          if (!open) {
            setSelectedTemplate(null);
            setRequestMessage('');
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Demander des compléments</DialogTitle>
            <DialogDescription>
              Un email sera envoyé au demandeur ({details?.requester_email}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Champs manquants détectés automatiquement */}
            {(() => {
              const missingFields = getOrderMissingFields({ details });
              const relevantTemplates = getRelevantTemplates(missingFields);

              return (
                <>
                  {missingFields.total > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-2">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        {missingFields.total} champ(s) manquant(s) détecté(s)
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {missingFields.fields.map(f => (
                          <Badge
                            key={f.key}
                            variant="outline"
                            className="text-xs text-amber-700 border-amber-300"
                          >
                            {f.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sélecteur de template */}
                  <div className="space-y-2">
                    <Label>Type de demande</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {relevantTemplates.map(
                        (template: RequestInfoTemplate) => (
                          <button
                            key={template.id}
                            type="button"
                            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                              selectedTemplate === template.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setSelectedTemplate(template.id);
                              const msg = template.getMessage(
                                missingFields.fields
                              );
                              setRequestMessage(msg);
                            }}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {template.label}
                              </p>
                              <p className="text-xs text-gray-500">
                                {template.description}
                              </p>
                            </div>
                            {selectedTemplate === template.id && (
                              <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Message (pré-rempli par le template ou libre) */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={requestMessage}
                onChange={e => setRequestMessage(e.target.value)}
                placeholder="Précisez les informations manquantes..."
                rows={6}
              />
              <p className="text-xs text-gray-500">
                Le message peut être modifié avant envoi.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestInfoDialog(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                void handleRequestInfo().catch(error => {
                  console.error(
                    '[LinkMeOrderDetail] Request info failed:',
                    error
                  );
                });
              }}
              disabled={requestInfo.isPending || !requestMessage.trim()}
            >
              {requestInfo.isPending ? 'En cours...' : 'Envoyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Refuser (avec raisons prédéfinies) */}
      <Dialog
        open={showRejectDialog}
        onOpenChange={open => {
          setShowRejectDialog(open);
          if (!open) {
            setSelectedRejectReason(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Refuser la commande</DialogTitle>
            <DialogDescription>
              Un email sera envoyé au demandeur ({details?.requester_email}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Raisons prédéfinies */}
            <div className="space-y-2">
              <Label>Motif du refus</Label>
              <div className="grid grid-cols-1 gap-2">
                {REJECT_REASON_TEMPLATES.map((reason: RejectReasonTemplate) => (
                  <button
                    key={reason.id}
                    type="button"
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedRejectReason === reason.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedRejectReason(reason.id);
                      setRejectReason(reason.message);
                    }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{reason.label}</p>
                    </div>
                    {selectedRejectReason === reason.id && (
                      <Check className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Message de refus */}
            <div className="space-y-2">
              <Label htmlFor="reason">Message envoyé au demandeur</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Expliquez la raison du refus..."
                rows={5}
              />
              <p className="text-xs text-gray-500">
                Le message peut être modifié avant envoi.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleReject().catch(error => {
                  console.error('[LinkMeOrderDetail] Reject failed:', error);
                });
              }}
              disabled={rejectOrder.isPending || !rejectReason.trim()}
            >
              {rejectOrder.isPending ? 'En cours...' : 'Refuser'}
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
                  console.error('[LinkMeOrderDetail] Save edit failed:', error);
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
                  setEditForm(prev => ({ ...prev, billing_contact_source: v }))
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
                  console.error('[LinkMeOrderDetail] Save edit failed:', error);
                });
              }}
              disabled={updateDetails.isPending}
            >
              {updateDetails.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Éditer Livraison */}
      <Dialog
        open={editingStep === 'delivery'}
        onOpenChange={() => setEditingStep(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la Livraison</DialogTitle>
            <DialogDescription>
              Modifiez les informations de livraison et réception.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm font-medium text-gray-700">
              Contact livraison
            </p>
            <div className="space-y-2">
              <Label>Nom du contact</Label>
              <Input
                value={editForm.delivery_contact_name ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    delivery_contact_name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.delivery_contact_email ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    delivery_contact_email: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={editForm.delivery_contact_phone ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    delivery_contact_phone: e.target.value,
                  }))
                }
              />
            </div>
            <Separator />
            <p className="text-sm font-medium text-gray-700">Adresse</p>
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
            <Separator />
            <p className="text-sm font-medium text-gray-700">Options</p>
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
            {/* Post-approbation fields */}
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
                  console.error('[LinkMeOrderDetail] Save edit failed:', error);
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
