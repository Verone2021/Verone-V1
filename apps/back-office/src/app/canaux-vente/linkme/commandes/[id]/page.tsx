'use client';

/**
 * Page: Détail Commande Enseigne LinkMe
 *
 * Affiche tous les détails d'une commande Enseigne B2B:
 * - Infos commande (numéro, date, montant)
 * - Étape 1: Demandeur
 * - Étape 2: Propriétaire
 * - Étape 3: Facturation
 * - Liste des articles
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
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MessageSquare,
  AlertCircle,
  User,
  Building2,
  CreditCard,
  Package,
  Calendar,
  Mail,
  Phone,
  FileText,
  ExternalLink,
} from 'lucide-react';

import {
  useApproveOrder,
  useRequestInfo,
  useRejectOrder,
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
  // Organisation
  organisation: {
    id: string;
    trade_name: string | null;
    legal_name: string;
    approval_status: string | null;
  } | null;
  // Items
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
  // LinkMe details
  linkmeDetails: LinkMeOrderDetails | null;
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function LinkMeOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Mutations
  const approveOrder = useApproveOrder();
  const requestInfo = useRequestInfo();
  const rejectOrder = useRejectOrder();

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      // Récupérer la commande avec organisation et items
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
          expected_delivery_date,
          organisations!sales_orders_customer_id_fkey (
            id,
            trade_name,
            legal_name,
            approval_status
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

      if (orderError) {
        throw orderError;
      }

      // Récupérer les détails LinkMe
      const { data: linkmeData, error: linkmeError } = await supabase
        .from('sales_order_linkme_details')
        .select('*')
        .eq('sales_order_id', orderId)
        .single();

      if (linkmeError && linkmeError.code !== 'PGRST116') {
        console.error('Erreur fetch LinkMe details:', linkmeError);
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
        organisation: orderData.organisations as any,
        items: (orderData.sales_order_items || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
          total_ht: item.total_ht,
          product: item.products,
        })),
        linkmeDetails: linkmeData || null,
      });
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
      fetchOrder();
    }
  }, [orderId]);

  // Handlers
  const handleApprove = async () => {
    try {
      await approveOrder.mutateAsync({ orderId });
      setShowApproveDialog(false);
      fetchOrder();
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
      fetchOrder();
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
      fetchOrder();
    } catch (err) {
      console.error('Erreur refus:', err);
    }
  };

  // Helper: vérifie si Étape 2 complète
  const isStep2Complete = () => {
    if (!order?.linkmeDetails) return false;
    const details = order.linkmeDetails;
    return !!details.owner_contact_same_as_requester || !!details.owner_email;
  };

  // Helper: badge status
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
          <span>{error || 'Commande non trouvée'}</span>
        </div>
      </div>
    );
  }

  const details = order.linkmeDetails;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push('/canaux-vente/linkme/commandes/a-traiter')
            }
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Commande {order.order_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(order.status)}
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

      {/* Alerte si Étape 2 incomplète */}
      {order.status === 'draft' && !isStep2Complete() && (
        <div className="flex items-center gap-2 p-4 bg-orange-50 text-orange-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>
            <strong>Étape 2 incomplète:</strong> Les informations du
            propriétaire sont requises pour approuver cette commande.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-6">
          {/* Étape 1: Demandeur */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Étape 1: Demandeur</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {details ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Nom</Label>
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
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${details.requester_email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {details.requester_email}
                    </a>
                  </div>
                  {details.requester_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{details.requester_phone}</span>
                    </div>
                  )}
                  {details.requester_position && (
                    <div className="text-sm text-gray-600">
                      Poste: {details.requester_position}
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Type de restaurant:</span>
                    <Badge
                      variant={
                        details.is_new_restaurant ? 'default' : 'outline'
                      }
                    >
                      {details.is_new_restaurant ? 'Nouveau' : 'Existant'}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Données non disponibles</p>
              )}
            </CardContent>
          </Card>

          {/* Étape 2: Propriétaire */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Étape 2: Propriétaire</CardTitle>
                {isStep2Complete() ? (
                  <Badge className="bg-green-100 text-green-800">Complet</Badge>
                ) : (
                  <Badge variant="destructive">Incomplet</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {details ? (
                <>
                  {details.owner_contact_same_as_requester ? (
                    <p className="text-sm text-gray-600">
                      Contact identique au demandeur
                    </p>
                  ) : details.owner_email ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Nom</Label>
                          <p className="font-medium">
                            {details.owner_name || '-'}
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
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a
                          href={`mailto:${details.owner_email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {details.owner_email}
                        </a>
                      </div>
                      {details.owner_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{details.owner_phone}</span>
                        </div>
                      )}
                      {details.owner_type === 'franchise' && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <Label className="text-xs text-gray-500">
                              Société franchisée
                            </Label>
                            <p className="text-sm">
                              {details.owner_company_trade_name ||
                                details.owner_company_legal_name ||
                                '-'}
                            </p>
                            {details.owner_kbis_url && (
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
                            )}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-orange-600 text-sm">
                      Informations non renseignées
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Données non disponibles</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* Étape 3: Facturation */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Étape 3: Facturation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {details ? (
                <>
                  <div>
                    <Label className="text-xs text-gray-500">
                      Contact facturation
                    </Label>
                    <p className="font-medium">{details.billing_name || '-'}</p>
                    {details.billing_email && (
                      <p className="text-sm text-gray-600">
                        {details.billing_email}
                      </p>
                    )}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Modalités acceptées:</span>
                    <Badge
                      variant={
                        details.delivery_terms_accepted ? 'default' : 'outline'
                      }
                    >
                      {details.delivery_terms_accepted ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
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
                  {details.mall_form_required && details.mall_form_email && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">
                        Formulaire centre commercial
                      </p>
                      <p>{details.mall_form_email}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Données non disponibles</p>
              )}
            </CardContent>
          </Card>

          {/* Organisation */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg">Organisation client</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {order.organisation ? (
                <div className="space-y-2">
                  <p className="font-medium">
                    {order.organisation.trade_name ||
                      order.organisation.legal_name}
                  </p>
                  {order.organisation.approval_status ===
                    'pending_validation' && (
                    <Badge variant="secondary" className="text-orange-600">
                      En attente de validation
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Non définie</p>
              )}
            </CardContent>
          </Card>

          {/* Articles */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg">Articles commandés</CardTitle>
              </div>
              <CardDescription>
                {order.items.length} article(s) - Total:{' '}
                {formatCurrency(order.total_ttc)} TTC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {item.product?.name || 'Produit inconnu'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.product?.sku || '-'} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.total_ht)} HT
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-sm">
                <span>Total HT</span>
                <span className="font-medium">
                  {formatCurrency(order.total_ht)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold mt-1">
                <span>Total TTC</span>
                <span>{formatCurrency(order.total_ttc)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes internes</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap text-gray-600">
                  {order.notes}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog: Approuver */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver la commande</DialogTitle>
            <DialogDescription>
              En approuvant cette commande, un email sera envoyé au contact
              propriétaire avec un lien pour compléter l&apos;Étape 4
              (informations de livraison).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleApprove} disabled={approveOrder.isPending}>
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
              Un email sera envoyé au demandeur ({details?.requester_email})
              avec votre message.
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
              onClick={handleRequestInfo}
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
              Un email sera envoyé au demandeur ({details?.requester_email})
              avec la raison du refus.
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
              onClick={handleReject}
              disabled={rejectOrder.isPending || !rejectReason.trim()}
            >
              {rejectOrder.isPending ? 'En cours...' : 'Refuser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
