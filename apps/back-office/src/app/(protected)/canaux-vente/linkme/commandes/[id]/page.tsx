'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/prefer-nullish-coalescing */

/**
 * Page: Détail Commande Enseigne LinkMe
 *
 * Affiche tous les détails d'une commande Enseigne B2B avec les 4 étapes:
 * - Étape 1: Demandeur (6 champs)
 * - Étape 2: Propriétaire (8 champs)
 * - Étape 3: Facturation (8 champs)
 * - Étape 4: Livraison (4 champs post-approbation)
 *
 * Chaque étape peut être modifiée via un dialog d'édition.
 *
 * Actions:
 * - Approuver (si Étape 2 complète)
 * - Demander compléments
 * - Refuser
 */

import { useState, useEffect } from 'react';

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
  Building2,
  CreditCard,
  Package,
  Calendar,
  Mail,
  Phone,
  FileText,
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

// ============================================
// TYPES
// ============================================

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
  organisation: {
    id: string;
    trade_name: string | null;
    legal_name: string;
    approval_status: string | null;
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

// Fonction pour determiner le canal de la commande
function getOrderChannel(
  created_by_affiliate_id: string | null,
  linkme_selection_id: string | null
): { label: string; color: string; bg: string } {
  if (linkme_selection_id !== null) {
    return {
      label: 'Selection publique',
      color: 'text-amber-700',
      bg: 'bg-amber-100',
    };
  }
  if (created_by_affiliate_id !== null) {
    return {
      label: 'Affilie',
      color: 'text-teal-700',
      bg: 'bg-teal-100',
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
  const [rejectReason, setRejectReason] = useState('');

  // Dialogs édition (1 = Étape 1, 2 = Étape 2, etc.)
  const [editingStep, setEditingStep] = useState<1 | 2 | 3 | 4 | null>(null);
  const [editForm, setEditForm] = useState<Partial<LinkMeOrderDetails>>({});

  // Mutations
  const approveOrder = useApproveOrder();
  const requestInfo = useRequestInfo();
  const rejectOrder = useRejectOrder();
  const updateDetails = useUpdateLinkMeDetails();

  const fetchOrder = async () => {
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
          organisations!sales_orders_customer_id_fkey (
            id,
            trade_name,
            legal_name,
            approval_status
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

      // Extraire organisation de la jointure (peut être array ou objet)
      const orgRaw = orderData.organisations as any;
      const organisation = Array.isArray(orgRaw)
        ? (orgRaw[0] ?? null)
        : (orgRaw ?? null);

      // Extraire linkme details de la jointure (peut être array ou objet)
      const linkmeDetailsRaw = orderData.sales_order_linkme_details as any;
      const linkmeData = Array.isArray(linkmeDetailsRaw)
        ? (linkmeDetailsRaw[0] ?? null)
        : (linkmeDetailsRaw ?? null);

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
        organisation: organisation,
        items: (orderData.sales_order_items || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
          total_ht: item.total_ht,
          product: item.products,
        })),
        linkmeDetails: linkmeData,
      });

      // Récupérer les items enrichis avec infos commission
      const { data: enrichedData } = await supabase
        .from('linkme_order_items_enriched')
        .select('*')
        .eq('sales_order_id', orderId);

      if (enrichedData && enrichedData.length > 0) {
        // Récupérer les product_ids pour fetch created_by_affiliate
        const productIds = enrichedData
          .map((item: any) => item.product_id)
          .filter(Boolean);
        const { data: productsData } = await supabase
          .from('products')
          .select('id, created_by_affiliate')
          .in('id', productIds);

        const productMap = new Map(
          (productsData ?? []).map((p: any) => [p.id, p.created_by_affiliate])
        );

        setEnrichedItems(
          enrichedData.map((item: any) => ({
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
  };

  useEffect(() => {
    if (orderId) {
      void fetchOrder().catch(error => {
        console.error('[LinkMeOrderDetail] Initial fetch failed:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

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
      await requestInfo.mutateAsync({ orderId, message: requestMessage });
      setShowRequestInfoDialog(false);
      setRequestMessage('');
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
  const openEditDialog = (step: 1 | 2 | 3 | 4) => {
    if (!order?.linkmeDetails) return;
    const d = order.linkmeDetails;

    if (step === 1) {
      setEditForm({
        requester_type: d.requester_type,
        requester_name: d.requester_name,
        requester_email: d.requester_email,
        requester_phone: d.requester_phone,
        requester_position: d.requester_position,
        is_new_restaurant: d.is_new_restaurant,
      });
    } else if (step === 2) {
      setEditForm({
        owner_type: d.owner_type,
        owner_contact_same_as_requester: d.owner_contact_same_as_requester,
        owner_name: d.owner_name,
        owner_email: d.owner_email,
        owner_phone: d.owner_phone,
        owner_company_legal_name: d.owner_company_legal_name,
        owner_company_trade_name: d.owner_company_trade_name,
        owner_kbis_url: d.owner_kbis_url,
      });
    } else if (step === 3) {
      setEditForm({
        billing_contact_source: d.billing_contact_source,
        billing_name: d.billing_name,
        billing_email: d.billing_email,
        billing_phone: d.billing_phone,
        delivery_terms_accepted: d.delivery_terms_accepted,
        desired_delivery_date: d.desired_delivery_date,
        mall_form_required: d.mall_form_required,
        mall_form_email: d.mall_form_email,
      });
    } else if (step === 4) {
      setEditForm({
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

  // Helpers validation
  const isStep2Complete = () => {
    if (!order?.linkmeDetails) return false;
    const d = order.linkmeDetails;
    return !!d.owner_contact_same_as_requester || !!d.owner_email;
  };

  const isKbisMissing = () => {
    if (!order?.linkmeDetails) return false;
    const d = order.linkmeDetails;
    return d.owner_type === 'franchise' && !d.owner_kbis_url;
  };

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
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
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
              disabled={!isStep2Complete()}
              onClick={() => setShowApproveDialog(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approuver
            </Button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* ALERTES DE VALIDATION */}
      {/* ============================================ */}
      {order.status === 'draft' && (
        <div className="space-y-2">
          {!isStep2Complete() && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>
                <strong>Étape 2 incomplète:</strong> Les informations du
                propriétaire sont requises pour approuver.
              </span>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => openEditDialog(2)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Compléter
              </Button>
            </div>
          )}
          {isKbisMissing() && isStep2Complete() && (
            <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-700 rounded-lg">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>
                <strong>KBis manquant:</strong> Document non fourni pour la
                franchise. L&apos;approbation reste possible.
              </span>
            </div>
          )}
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
                    const marginCommissionEuros = item.affiliate_margin || 0;
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
                              ? `${item.commission_rate || 0}%`
                              : `${item.margin_rate || 0}%`}
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
          {/* Organisation */}
          {order.organisation && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  Client:{' '}
                  <strong>
                    {order.organisation.trade_name ||
                      order.organisation.legal_name}
                  </strong>
                </span>
                {order.organisation.approval_status ===
                  'pending_validation' && (
                  <Badge variant="secondary" className="text-orange-600">
                    En attente validation
                  </Badge>
                )}
              </div>
            </>
          )}
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
      {/* LES 4 ÉTAPES */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ------------------------------------------ */}
        {/* ÉTAPE 1: DEMANDEUR */}
        {/* ------------------------------------------ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Étape 1: Demandeur</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(1)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Modifier
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {details ? (
              <>
                {/* Nom et Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Nom complet</Label>
                    <p className="font-medium">{details.requester_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Type</Label>
                    <Badge variant="outline" className="mt-1">
                      {details.requester_type === 'responsable_enseigne'
                        ? 'Responsable Enseigne'
                        : details.requester_type === 'architecte'
                          ? 'Architecte'
                          : 'Franchisé'}
                    </Badge>
                  </div>
                </div>
                {/* Email */}
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a
                    href={`mailto:${details.requester_email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {details.requester_email}
                  </a>
                </div>
                {/* Téléphone */}
                {details.requester_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{details.requester_phone}</span>
                  </div>
                )}
                {/* Poste */}
                {details.requester_position && (
                  <div className="text-sm text-gray-600">
                    <Label className="text-xs text-gray-500">
                      Poste / Fonction
                    </Label>
                    <p>{details.requester_position}</p>
                  </div>
                )}
                <Separator />
                {/* Nouveau restaurant */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Type de restaurant</span>
                  <Badge
                    variant={details.is_new_restaurant ? 'default' : 'outline'}
                  >
                    {details.is_new_restaurant
                      ? 'Nouveau restaurant'
                      : 'Restaurant existant'}
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Données non disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------ */}
        {/* ÉTAPE 2: PROPRIÉTAIRE */}
        {/* ------------------------------------------ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Étape 2: Propriétaire</CardTitle>
                {renderStepBadge(isStep2Complete())}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(2)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Modifier
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {details ? (
              <>
                {details.owner_contact_same_as_requester ? (
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    <Check className="h-4 w-4 inline mr-1" />
                    Contact identique au demandeur
                  </div>
                ) : details.owner_email ? (
                  <>
                    {/* Type propriétaire */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Nom</Label>
                        <p className="font-medium">
                          {details.owner_name ?? '-'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Type</Label>
                        <Badge variant="outline" className="mt-1">
                          {details.owner_type === 'propre'
                            ? 'Restaurant propre'
                            : 'Franchise'}
                        </Badge>
                      </div>
                    </div>
                    {/* Email */}
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${details.owner_email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {details.owner_email}
                      </a>
                    </div>
                    {/* Téléphone */}
                    {details.owner_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{details.owner_phone}</span>
                      </div>
                    )}
                    {/* Infos franchise */}
                    {details.owner_type === 'franchise' && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">
                            Société franchisée
                          </Label>
                          {details.owner_company_trade_name && (
                            <p className="text-sm">
                              <strong>Nom commercial:</strong>{' '}
                              {details.owner_company_trade_name}
                            </p>
                          )}
                          {details.owner_company_legal_name && (
                            <p className="text-sm">
                              <strong>Raison sociale:</strong>{' '}
                              {details.owner_company_legal_name}
                            </p>
                          )}
                          {/* KBis */}
                          {details.owner_kbis_url ? (
                            <a
                              href={details.owner_kbis_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              Voir le KBis
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <AlertTriangle className="h-4 w-4" />
                              KBis non fourni
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Informations non renseignées
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">Données non disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------ */}
        {/* ÉTAPE 3: FACTURATION */}
        {/* ------------------------------------------ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Étape 3: Facturation</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(3)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Modifier
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {details ? (
              <>
                {/* Source contact */}
                <div>
                  <Label className="text-xs text-gray-500">
                    Source contact facturation
                  </Label>
                  <Badge variant="outline" className="mt-1">
                    {details.billing_contact_source === 'step1'
                      ? 'Identique au demandeur (Étape 1)'
                      : details.billing_contact_source === 'step2'
                        ? 'Identique au propriétaire (Étape 2)'
                        : 'Contact personnalisé'}
                  </Badge>
                </div>
                {/* Contact facturation */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Nom contact</Label>
                    <p className="font-medium">{details.billing_name ?? '-'}</p>
                  </div>
                  {details.billing_email && (
                    <div>
                      <Label className="text-xs text-gray-500">Email</Label>
                      <p className="text-sm">{details.billing_email}</p>
                    </div>
                  )}
                </div>
                {details.billing_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{details.billing_phone}</span>
                  </div>
                )}
                <Separator />
                {/* Modalités livraison */}
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
                      Livraison souhaitée:{' '}
                      {new Date(
                        details.desired_delivery_date
                      ).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                {/* Formulaire centre commercial */}
                {details.mall_form_required && (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                    <p className="font-medium">
                      <Building2 className="h-4 w-4 inline mr-1" />
                      Formulaire centre commercial requis
                    </p>
                    {details.mall_form_email && (
                      <p className="text-gray-600">
                        Email direction: {details.mall_form_email}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">Données non disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------ */}
        {/* ÉTAPE 4: LIVRAISON (POST-APPROBATION) */}
        {/* ------------------------------------------ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-cyan-600" />
                <CardTitle className="text-lg">Étape 4: Livraison</CardTitle>
                {order.status === 'validated' &&
                  renderStepBadge(isStep4Complete())}
                {order.status === 'draft' && (
                  <Badge variant="secondary">Après approbation</Badge>
                )}
              </div>
              {order.status === 'validated' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(4)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.status === 'draft' ? (
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                <Clock className="h-4 w-4 inline mr-1" />
                Cette étape sera disponible après approbation. Un email sera
                envoyé au propriétaire pour compléter les informations de
                livraison.
              </div>
            ) : details ? (
              <>
                {/* Token status */}
                {details.step4_token && (
                  <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-1">
                    <p className="font-medium text-blue-700">
                      Token de validation actif
                    </p>
                    {details.step4_token_expires_at && (
                      <p className="text-blue-600">
                        Expire le:{' '}
                        {new Date(
                          details.step4_token_expires_at
                        ).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {details.step4_completed_at && (
                      <p className="text-green-700">
                        <Check className="h-4 w-4 inline mr-1" />
                        Complété le:{' '}
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
                {/* Contact réception */}
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
                {details.reception_contact_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${details.reception_contact_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {details.reception_contact_email}
                    </a>
                  </div>
                )}
                {details.reception_contact_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{details.reception_contact_phone}</span>
                  </div>
                )}
                {/* Date confirmée */}
                {details.confirmed_delivery_date && (
                  <div className="flex items-center gap-2 text-sm p-3 bg-green-50 rounded-lg text-green-700">
                    <Calendar className="h-4 w-4" />
                    <span>
                      <strong>Date confirmée:</strong>{' '}
                      {new Date(
                        details.confirmed_delivery_date
                      ).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                {!details.reception_contact_name &&
                  !details.reception_contact_email &&
                  !details.confirmed_delivery_date && (
                    <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                      <Clock className="h-4 w-4 inline mr-1" />
                      En attente de confirmation du propriétaire via le lien
                      email.
                    </div>
                  )}
              </>
            ) : (
              <p className="text-gray-500">Données non disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>

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

      {/* Dialog: Demander compléments */}
      <Dialog
        open={showRequestInfoDialog}
        onOpenChange={setShowRequestInfoDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander des compléments</DialogTitle>
            <DialogDescription>
              Un email sera envoyé au demandeur ({details?.requester_email}).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={requestMessage}
              onChange={e => setRequestMessage(e.target.value)}
              placeholder="Précisez les informations manquantes..."
              className="mt-2"
              rows={4}
            />
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

      {/* Dialog: Refuser */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la commande</DialogTitle>
            <DialogDescription>
              Un email sera envoyé au demandeur ({details?.requester_email}).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Raison du refus</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Expliquez la raison du refus..."
              className="mt-2"
              rows={4}
            />
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

      {/* Dialog: Éditer Étape 1 - Demandeur */}
      <Dialog
        open={editingStep === 1}
        onOpenChange={() => setEditingStep(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier Étape 1: Demandeur</DialogTitle>
            <DialogDescription>
              Modifiez les informations du demandeur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Type demandeur */}
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
            {/* Nom */}
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
            {/* Email */}
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
            {/* Téléphone */}
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
            {/* Poste */}
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
            {/* Nouveau restaurant */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Nouveau restaurant</Label>
                <p className="text-xs text-gray-500">
                  S&apos;agit-il d&apos;un nouveau restaurant ?
                </p>
              </div>
              <Switch
                checked={editForm.is_new_restaurant ?? false}
                onCheckedChange={checked =>
                  setEditForm(prev => ({ ...prev, is_new_restaurant: checked }))
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

      {/* Dialog: Éditer Étape 2 - Propriétaire */}
      <Dialog
        open={editingStep === 2}
        onOpenChange={() => setEditingStep(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier Étape 2: Propriétaire</DialogTitle>
            <DialogDescription>
              Modifiez les informations du propriétaire/responsable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Same as requester */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Contact identique au demandeur</Label>
                <p className="text-xs text-gray-500">
                  Reprendre les infos de l&apos;Étape 1
                </p>
              </div>
              <Switch
                checked={editForm.owner_contact_same_as_requester ?? false}
                onCheckedChange={checked =>
                  setEditForm(prev => ({
                    ...prev,
                    owner_contact_same_as_requester: checked,
                  }))
                }
              />
            </div>
            {/* Si pas identique */}
            {!editForm.owner_contact_same_as_requester && (
              <>
                {/* Type */}
                <div className="space-y-2">
                  <Label>Type de propriétaire</Label>
                  <Select
                    value={editForm.owner_type ?? ''}
                    onValueChange={v =>
                      setEditForm(prev => ({ ...prev, owner_type: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="propre">Restaurant propre</SelectItem>
                      <SelectItem value="franchise">Franchise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Nom */}
                <div className="space-y-2">
                  <Label>Nom du propriétaire</Label>
                  <Input
                    value={editForm.owner_name ?? ''}
                    onChange={e =>
                      setEditForm(prev => ({
                        ...prev,
                        owner_name: e.target.value,
                      }))
                    }
                  />
                </div>
                {/* Email */}
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={editForm.owner_email ?? ''}
                    onChange={e =>
                      setEditForm(prev => ({
                        ...prev,
                        owner_email: e.target.value,
                      }))
                    }
                  />
                </div>
                {/* Téléphone */}
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={editForm.owner_phone ?? ''}
                    onChange={e =>
                      setEditForm(prev => ({
                        ...prev,
                        owner_phone: e.target.value,
                      }))
                    }
                  />
                </div>
                {/* Franchise fields */}
                {editForm.owner_type === 'franchise' && (
                  <>
                    <Separator />
                    <p className="text-sm font-medium text-gray-700">
                      Informations franchise
                    </p>
                    {/* Nom commercial */}
                    <div className="space-y-2">
                      <Label>Nom commercial</Label>
                      <Input
                        value={editForm.owner_company_trade_name ?? ''}
                        onChange={e =>
                          setEditForm(prev => ({
                            ...prev,
                            owner_company_trade_name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    {/* Raison sociale */}
                    <div className="space-y-2">
                      <Label>Raison sociale</Label>
                      <Input
                        value={editForm.owner_company_legal_name ?? ''}
                        onChange={e =>
                          setEditForm(prev => ({
                            ...prev,
                            owner_company_legal_name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    {/* KBis URL */}
                    <div className="space-y-2">
                      <Label>URL du KBis</Label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={editForm.owner_kbis_url ?? ''}
                        onChange={e =>
                          setEditForm(prev => ({
                            ...prev,
                            owner_kbis_url: e.target.value,
                          }))
                        }
                      />
                      {editForm.owner_kbis_url && (
                        <a
                          href={editForm.owner_kbis_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir le document
                        </a>
                      )}
                    </div>
                  </>
                )}
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

      {/* Dialog: Éditer Étape 3 - Facturation */}
      <Dialog
        open={editingStep === 3}
        onOpenChange={() => setEditingStep(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier Étape 3: Facturation</DialogTitle>
            <DialogDescription>
              Modifiez les informations de facturation et livraison.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Source contact */}
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
                  <SelectItem value="step1">Identique au demandeur</SelectItem>
                  <SelectItem value="step2">
                    Identique au propriétaire
                  </SelectItem>
                  <SelectItem value="custom">Contact personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Contact facturation */}
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
            <Separator />
            {/* Modalités */}
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
            {/* Date souhaitée */}
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
            <Separator />
            {/* Centre commercial */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Formulaire centre commercial requis</Label>
                <p className="text-xs text-gray-500">
                  Restaurant situé dans un centre commercial
                </p>
              </div>
              <Switch
                checked={editForm.mall_form_required ?? false}
                onCheckedChange={checked =>
                  setEditForm(prev => ({
                    ...prev,
                    mall_form_required: checked,
                  }))
                }
              />
            </div>
            {editForm.mall_form_required && (
              <div className="space-y-2">
                <Label>Email direction centre commercial</Label>
                <Input
                  type="email"
                  value={editForm.mall_form_email ?? ''}
                  onChange={e =>
                    setEditForm(prev => ({
                      ...prev,
                      mall_form_email: e.target.value,
                    }))
                  }
                />
              </div>
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

      {/* Dialog: Éditer Étape 4 - Livraison */}
      <Dialog
        open={editingStep === 4}
        onOpenChange={() => setEditingStep(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier Étape 4: Livraison</DialogTitle>
            <DialogDescription>
              Modifiez les informations de réception/livraison.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Nom contact réception */}
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
            {/* Email réception */}
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
            {/* Téléphone réception */}
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
            {/* Date confirmée */}
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

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/prefer-nullish-coalescing */
