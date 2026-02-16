'use client';

/**
 * Centre de Messagerie LinkMe
 *
 * 2 onglets :
 * 1. Infos manquantes - Dashboard des commandes avec champs manquants + envoi de demandes
 * 2. Notifications affiliés - Broadcast notifications (contenu existant préservé)
 *
 * @module MessagesPage
 * @since 2026-01-22
 * @updated 2026-02-16 - Ajout onglet Infos manquantes
 */

import { useState, useEffect, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
  Skeleton,
} from '@verone/ui';
import { cn, formatCurrency } from '@verone/utils';
import { toast } from 'sonner';
import {
  Send,
  Bell,
  Users,
  Building2,
  User,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  Mail,
  FileText,
  Clock,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getOrderMissingFields,
  type MissingFieldsResult,
} from '../utils/order-missing-fields';
import type { LinkMeOrderDetails } from '../hooks/use-linkme-order-actions';

// =============================================================================
// TYPES
// =============================================================================

type NotificationSeverity = 'info' | 'important' | 'urgent';
type TargetType = 'all' | 'enseigne' | 'affiliate';
type MissingFieldsFilter = 'all' | 'no_request' | 'request_sent';

interface Enseigne {
  id: string;
  name: string;
  affiliate_count: number;
}

interface Affiliate {
  id: string;
  user_id: string;
  display_name: string;
  enseigne_name: string | null;
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

interface OrderWithMissing {
  id: string;
  order_number: string;
  total_ttc: number;
  status: string;
  customer_id: string | null;
  organisationName: string | null;
  organisationSiret: string | null;
  details: LinkMeOrderDetails | null;
  missingFields: MissingFieldsResult;
  infoRequests: InfoRequest[];
}

// =============================================================================
// HOOKS - INFOS MANQUANTES
// =============================================================================

function useOrdersWithMissingFields() {
  return useQuery({
    queryKey: ['orders-missing-fields'],
    queryFn: async () => {
      const supabase = createClient();

      type OrgRow = {
        id: string;
        trade_name: string | null;
        legal_name: string;
        siret: string | null;
      };

      const { data: orders, error } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          total_ttc,
          status,
          customer_id,
          organisations!sales_orders_customer_id_fkey (
            id, trade_name, legal_name, siret
          ),
          sales_order_linkme_details (
            id, sales_order_id,
            requester_type, requester_name, requester_email, requester_phone,
            requester_position,
            is_new_restaurant,
            owner_type,
            owner_contact_same_as_requester, owner_name, owner_email, owner_phone,
            owner_company_legal_name, owner_company_trade_name, owner_kbis_url,
            billing_contact_source, billing_name, billing_email, billing_phone,
            delivery_terms_accepted,
            delivery_contact_name, delivery_contact_email, delivery_contact_phone,
            delivery_address, delivery_postal_code, delivery_city,
            desired_delivery_date,
            is_mall_delivery, mall_email,
            mall_form_required, mall_form_email,
            step4_token, step4_token_expires_at, step4_completed_at,
            reception_contact_name, reception_contact_email, reception_contact_phone,
            confirmed_delivery_date,
            delivery_date, delivery_latitude, delivery_longitude,
            access_form_required, access_form_url,
            semi_trailer_accessible, delivery_notes,
            created_at, updated_at
          ),
          linkme_info_requests (
            id, token, recipient_email, recipient_type, sent_at,
            completed_at, cancelled_at, cancelled_reason
          )
        `
        )
        .in('status', ['validated'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const results: OrderWithMissing[] = [];

      for (const order of orders ?? []) {
        const detailsArray = order.sales_order_linkme_details as Array<
          Record<string, unknown>
        > | null;
        const details = (detailsArray?.[0] ??
          null) as LinkMeOrderDetails | null;

        if (!details) continue;

        const orgArray = order.organisations as unknown as OrgRow[] | null;
        const org = orgArray?.[0] ?? null;

        const missingFields = getOrderMissingFields({
          details,
          organisationSiret: org?.siret,
        });

        if (!missingFields.isComplete) {
          results.push({
            id: order.id,
            order_number: order.order_number,
            total_ttc: order.total_ttc,
            status: order.status,
            customer_id: order.customer_id,
            organisationName: org?.trade_name ?? org?.legal_name ?? null,
            organisationSiret: org?.siret ?? null,
            details,
            missingFields,
            infoRequests: (order.linkme_info_requests ?? []) as InfoRequest[],
          });
        }
      }

      return results;
    },
  });
}

// =============================================================================
// HOOKS - NOTIFICATIONS (EXISTING)
// =============================================================================

function useEnseignes() {
  return useQuery({
    queryKey: ['admin-enseignes'],
    queryFn: async () => {
      const supabase = createClient();
      type EnseigneWithCount = {
        id: string;
        name: string;
        linkme_affiliates: Array<{ count: number }>;
      };
      const { data, error } = await supabase
        .from('enseignes')
        .select('id, name, linkme_affiliates!inner(count)')
        .order('name')
        .returns<EnseigneWithCount[]>();
      if (error) throw error;
      return (data ?? []).map(e => ({
        id: e.id,
        name: e.name,
        affiliate_count: e.linkme_affiliates?.[0]?.count ?? 0,
      })) as Enseigne[];
    },
  });
}

function useAffiliates(enseigneId?: string) {
  return useQuery({
    queryKey: ['admin-affiliates', enseigneId],
    queryFn: async () => {
      const supabase = createClient();
      type LinkMeUser = {
        user_id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        enseigne_id: string | null;
        enseigne_name: string | null;
      };
      let query = supabase
        .from('v_linkme_users')
        .select(
          'user_id, email, first_name, last_name, enseigne_id, enseigne_name'
        )
        .eq('is_active', true)
        .not('user_id', 'is', null);
      if (enseigneId) {
        query = query.eq('enseigne_id', enseigneId);
      }
      const { data, error } = await query
        .order('first_name')
        .returns<LinkMeUser[]>();
      if (error) throw error;
      return (data ?? []).map(u => ({
        id: u.user_id,
        user_id: u.user_id,
        display_name:
          `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
        enseigne_name: u.enseigne_name ?? null,
      })) as Affiliate[];
    },
  });
}

function useSendNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      title,
      message,
      severity,
      actionUrl,
      actionLabel,
    }: {
      targetType: TargetType;
      targetId?: string;
      title: string;
      message: string;
      severity: NotificationSeverity;
      actionUrl?: string;
      actionLabel?: string;
    }) => {
      const supabase = createClient();
      let userIds: string[] = [];
      type UserIdResult = { user_id: string };
      if (targetType === 'all') {
        const { data } = await supabase
          .from('v_linkme_users')
          .select('user_id')
          .eq('is_active', true)
          .not('user_id', 'is', null)
          .returns<UserIdResult[]>();
        userIds = (data ?? []).map(a => a.user_id).filter(Boolean);
      } else if (targetType === 'enseigne' && targetId) {
        const { data } = await supabase
          .from('v_linkme_users')
          .select('user_id')
          .eq('enseigne_id', targetId)
          .eq('is_active', true)
          .not('user_id', 'is', null)
          .returns<UserIdResult[]>();
        userIds = (data ?? []).map(a => a.user_id).filter(Boolean);
      } else if (targetType === 'affiliate' && targetId) {
        userIds = [targetId];
      }
      if (userIds.length === 0) throw new Error('Aucun destinataire trouvé');
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'business' as const,
        severity,
        title,
        message,
        action_url: actionUrl ?? null,
        action_label: actionLabel ?? null,
        read: false,
        created_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);
      if (error) throw error;
      return { recipientCount: userIds.length };
    },
    onSuccess: async data => {
      toast.success(
        `Notification envoyée à ${data.recipientCount} destinataire(s)`
      );
      await queryClient.invalidateQueries({
        queryKey: ['notification-history'],
      });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Messages] Erreur envoi notification:', msg);
      toast.error("Erreur lors de l'envoi de la notification");
    },
  });
}

// =============================================================================
// SEND INFO REQUEST MUTATION
// =============================================================================

function useSendInfoRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      salesOrderId: string;
      orderNumber: string;
      recipientEmail: string;
      recipientName: string;
      recipientType: 'requester' | 'owner';
      organisationName: string | null;
      totalTtc: number;
      requestedFields: Array<{
        key: string;
        label: string;
        category: string;
        inputType: string;
      }>;
      customMessage?: string;
      sentBy: string;
    }) => {
      const res = await fetch('/api/emails/linkme-info-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Erreur envoi');
      }
      return res.json() as Promise<{ success: boolean; token: string }>;
    },
    onSuccess: async () => {
      toast.success('Demande envoyée par email');
      await queryClient.invalidateQueries({
        queryKey: ['orders-missing-fields'],
      });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Messages] Erreur envoi info request:', msg);
      toast.error("Erreur lors de l'envoi de la demande");
    },
  });
}

// =============================================================================
// COMPONENTS - SEVERITY SELECTOR (EXISTING)
// =============================================================================

function SeveritySelector({
  value,
  onChange,
}: {
  value: NotificationSeverity;
  onChange: (value: NotificationSeverity) => void;
}) {
  const options: {
    value: NotificationSeverity;
    label: string;
    icon: typeof Info;
    color: string;
  }[] = [
    {
      value: 'info',
      label: 'Information',
      icon: Info,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      value: 'important',
      label: 'Important',
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-100',
    },
    {
      value: 'urgent',
      label: 'Urgent',
      icon: AlertCircle,
      color: 'text-red-600 bg-red-100',
    },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map(option => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
              value === option.value
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                option.color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// COMPONENTS - SEND INFO REQUEST DIALOG
// =============================================================================

function SendInfoRequestDialog({
  order,
  open,
  onOpenChange,
}: {
  order: OrderWithMissing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [recipientType, setRecipientType] = useState<'requester' | 'owner'>(
    'requester'
  );
  const [customMessage, setCustomMessage] = useState('');
  const sendInfoRequest = useSendInfoRequest();

  // Get current user ID
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const details = order.details;
  const requesterEmail = details?.requester_email ?? '';
  const requesterName = details?.requester_name ?? '';
  const ownerEmail = details?.owner_email ?? '';
  const ownerName = details?.owner_name ?? '';

  const selectedEmail =
    recipientType === 'requester' ? requesterEmail : ownerEmail;
  const selectedName =
    recipientType === 'requester' ? requesterName : ownerName;

  // Check if request already pending for this recipient type
  const pendingRequest = order.infoRequests.find(
    r =>
      r.recipient_type === recipientType && !r.completed_at && !r.cancelled_at
  );

  const handleSend = async () => {
    if (!currentUser?.id || !selectedEmail) return;

    await sendInfoRequest.mutateAsync({
      salesOrderId: order.id,
      orderNumber: order.order_number,
      recipientEmail: selectedEmail,
      recipientName: selectedName,
      recipientType,
      organisationName: order.organisationName,
      totalTtc: order.total_ttc,
      requestedFields: order.missingFields.fields.map(f => ({
        key: f.key,
        label: f.label,
        category: f.category,
        inputType: f.inputType,
      })),
      customMessage: customMessage.trim() || undefined,
      sentBy: currentUser.id,
    });

    onOpenChange(false);
    setCustomMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Envoyer une demande d&apos;informations</DialogTitle>
          <DialogDescription>
            Commande {order.order_number}
            {order.organisationName ? ` - ${order.organisationName}` : ''} (
            {formatCurrency(order.total_ttc)})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient selection */}
          <div className="space-y-3">
            <Label className="font-semibold">Destinataire</Label>
            <div className="space-y-2">
              <label
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  recipientType === 'requester'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                  !requesterEmail && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input
                  type="radio"
                  name="recipientType"
                  value="requester"
                  checked={recipientType === 'requester'}
                  onChange={() => setRecipientType('requester')}
                  disabled={!requesterEmail}
                  className="accent-blue-600"
                />
                <div>
                  <div className="font-medium">Demandeur</div>
                  <div className="text-sm text-gray-500">
                    {requesterName ? `${requesterName} - ` : ''}
                    {requesterEmail || 'Email non renseigné'}
                  </div>
                </div>
              </label>

              <label
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  recipientType === 'owner'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300',
                  !ownerEmail && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input
                  type="radio"
                  name="recipientType"
                  value="owner"
                  checked={recipientType === 'owner'}
                  onChange={() => setRecipientType('owner')}
                  disabled={!ownerEmail}
                  className="accent-blue-600"
                />
                <div>
                  <div className="font-medium">Propriétaire</div>
                  <div className="text-sm text-gray-500">
                    {ownerName ? `${ownerName} - ` : ''}
                    {ownerEmail || 'Email non renseigné'}
                  </div>
                </div>
              </label>
            </div>
          </div>

          <Separator />

          {/* Missing fields (read-only) */}
          <div className="space-y-2">
            <Label className="font-semibold">
              Champs manquants ({order.missingFields.total})
            </Label>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              {order.missingFields.fields.map(f => (
                <div key={f.key} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {f.category}
                  </Badge>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom message */}
          <div className="space-y-2">
            <Label htmlFor="customMsg">Message personnalisé (optionnel)</Label>
            <Textarea
              id="customMsg"
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Ajoutez un message pour le destinataire..."
              rows={3}
            />
          </div>

          {/* Warning if pending */}
          {pendingRequest && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Une demande est déjà en attente pour ce destinataire (envoyée le{' '}
                {new Date(pendingRequest.sent_at).toLocaleDateString('fr-FR')}).
                Envoyer une nouvelle demande créera un lien supplémentaire.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void handleSend().catch(err => {
                console.error('[SendInfoRequest] failed:', err);
              });
            }}
            disabled={sendInfoRequest.isPending || !selectedEmail}
          >
            {sendInfoRequest.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer la demande
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// COMPONENTS - MISSING FIELDS TAB
// =============================================================================

function MissingFieldsTab() {
  const { data: orders, isLoading } = useOrdersWithMissingFields();
  const [filter, setFilter] = useState<MissingFieldsFilter>('all');
  const [dialogOrder, setDialogOrder] = useState<OrderWithMissing | null>(null);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
      if (filter === 'no_request') {
        return order.infoRequests.every(r => r.completed_at || r.cancelled_at);
      }
      if (filter === 'request_sent') {
        return order.infoRequests.some(r => !r.completed_at && !r.cancelled_at);
      }
      return true;
    });
  }, [orders, filter]);

  const pendingRequestCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(o =>
      o.infoRequests.some(r => !r.completed_at && !r.cancelled_at)
    ).length;
  }, [orders]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="destructive">{orders?.length ?? 0} incomplète(s)</Badge>
        {pendingRequestCount > 0 && (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {pendingRequestCount} demande(s) en attente
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(
          [
            { value: 'all', label: 'Toutes' },
            { value: 'no_request', label: 'Sans demande' },
            { value: 'request_sent', label: 'Demande envoyée' },
          ] as const
        ).map(f => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-300" />
            <p className="font-medium">Aucune commande avec infos manquantes</p>
            <p className="text-sm mt-1">
              {filter !== 'all'
                ? 'Essayez un autre filtre'
                : 'Toutes les commandes sont complètes'}
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredOrders.map(order => {
          const pendingReqs = order.infoRequests.filter(
            r => !r.completed_at && !r.cancelled_at
          );
          const latestPending = pendingReqs[0];

          return (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    {/* Order info */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">
                        {order.order_number}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-gray-600">
                        {order.organisationName ?? '-'}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="font-medium text-green-600">
                        {formatCurrency(order.total_ttc)}
                      </span>
                    </div>

                    {/* Missing fields */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          order.missingFields.total > 3
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {order.missingFields.total} champ(s) manquant(s)
                      </Badge>
                      {order.missingFields.fields.slice(0, 4).map(f => (
                        <span key={f.key} className="text-xs text-gray-500">
                          {f.label}
                        </span>
                      ))}
                      {order.missingFields.total > 4 && (
                        <span className="text-xs text-gray-400">
                          +{order.missingFields.total - 4} autres
                        </span>
                      )}
                    </div>

                    {/* Request status */}
                    <div className="flex items-center gap-2 text-sm">
                      {latestPending ? (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Mail className="h-3.5 w-3.5" />
                          Envoyé le{' '}
                          {new Date(latestPending.sent_at).toLocaleDateString(
                            'fr-FR'
                          )}{' '}
                          à {latestPending.recipient_email}
                          <Clock className="h-3.5 w-3.5 ml-1" />
                          En attente
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Mail className="h-3.5 w-3.5" />
                          Aucune demande envoyée
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Send button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogOrder(order)}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Envoyer demande
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Dialog */}
      {dialogOrder && (
        <SendInfoRequestDialog
          order={dialogOrder}
          open={!!dialogOrder}
          onOpenChange={open => !open && setDialogOrder(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTS - NOTIFICATIONS TAB (EXISTING CONTENT)
// =============================================================================

function NotificationsTab() {
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [selectedEnseigne, setSelectedEnseigne] = useState<string>('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<NotificationSeverity>('info');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [includeAction, setIncludeAction] = useState(false);

  const { data: enseignes } = useEnseignes();
  const { data: affiliates } = useAffiliates(
    targetType === 'enseigne' ? selectedEnseigne : undefined
  );
  const sendNotification = useSendNotification();

  useEffect(() => {
    setSelectedEnseigne('');
    setSelectedAffiliate('');
  }, [targetType]);

  const getRecipientCount = (): number => {
    if (targetType === 'all') return affiliates?.length ?? 0;
    if (targetType === 'enseigne' && selectedEnseigne)
      return affiliates?.filter(a => a.enseigne_name).length ?? 0;
    if (targetType === 'affiliate' && selectedAffiliate) return 1;
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Veuillez remplir le titre et le message');
      return;
    }
    if (targetType === 'enseigne' && !selectedEnseigne) {
      toast.error('Veuillez sélectionner une enseigne');
      return;
    }
    if (targetType === 'affiliate' && !selectedAffiliate) {
      toast.error('Veuillez sélectionner un affilié');
      return;
    }
    if (includeAction && (!actionUrl || !actionLabel)) {
      toast.error("Veuillez remplir l'URL et le libellé de l'action");
      return;
    }
    sendNotification.mutate({
      targetType,
      targetId:
        targetType === 'enseigne'
          ? selectedEnseigne
          : targetType === 'affiliate'
            ? selectedAffiliate
            : undefined,
      title: title.trim(),
      message: message.trim(),
      severity,
      actionUrl: includeAction ? actionUrl : undefined,
      actionLabel: includeAction ? actionLabel : undefined,
    });
    if (!sendNotification.isPending) {
      setTitle('');
      setMessage('');
      setSeverity('info');
      setActionUrl('');
      setActionLabel('');
      setIncludeAction(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Nouvelle notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={e => {
                void handleSubmit(e).catch(error => {
                  console.error('[MessagesPage] handleSubmit failed:', error);
                });
              }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <Label className="text-base font-semibold">Destinataires</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      type: 'all' as const,
                      label: 'Tous les affiliés',
                      icon: Users,
                      count: affiliates?.length ?? 0,
                    },
                    {
                      type: 'enseigne' as const,
                      label: 'Par enseigne',
                      icon: Building2,
                      count: enseignes?.length ?? 0,
                    },
                    {
                      type: 'affiliate' as const,
                      label: 'Un affilié',
                      icon: User,
                      count: undefined,
                    },
                  ].map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setTargetType(t.type)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                          targetType === t.type
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{t.label}</span>
                        {t.count !== undefined && (
                          <Badge variant="secondary">{t.count}</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
                {targetType === 'enseigne' && (
                  <Select
                    value={selectedEnseigne}
                    onValueChange={setSelectedEnseigne}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une enseigne..." />
                    </SelectTrigger>
                    <SelectContent>
                      {enseignes?.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} ({e.affiliate_count} affilié(s))
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {targetType === 'affiliate' && (
                  <Select
                    value={selectedAffiliate}
                    onValueChange={setSelectedAffiliate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un affilié..." />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliates?.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.display_name}
                          {a.enseigne_name && (
                            <span className="text-gray-500 ml-2">
                              ({a.enseigne_name})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Type de notification
                </Label>
                <SeveritySelector value={severity} onChange={setSeverity} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-title">Titre *</Label>
                <Input
                  id="notif-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Nouvelle fonctionnalité disponible"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-message">Message *</Label>
                <Textarea
                  id="notif-message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Décrivez votre message..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 text-right">
                  {message.length}/500
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeAction"
                    checked={includeAction}
                    onCheckedChange={checked => setIncludeAction(!!checked)}
                  />
                  <Label htmlFor="includeAction" className="font-normal">
                    Ajouter un bouton d&apos;action (optionnel)
                  </Label>
                </div>
                {includeAction && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="actionLabel">Libellé du bouton</Label>
                      <Input
                        id="actionLabel"
                        value={actionLabel}
                        onChange={e => setActionLabel(e.target.value)}
                        placeholder="Ex: Voir les détails"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actionUrl">URL</Label>
                      <Input
                        id="actionUrl"
                        value={actionUrl}
                        onChange={e => setActionUrl(e.target.value)}
                        placeholder="Ex: /ma-selection"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  {getRecipientCount() > 0 ? (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {getRecipientCount()} destinataire(s)
                    </span>
                  ) : (
                    <span className="text-amber-600">
                      Sélectionnez des destinataires
                    </span>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={
                    sendNotification.isPending || getRecipientCount() === 0
                  }
                >
                  {sendNotification.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer la notification
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Preview + Tips */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aperçu</CardTitle>
          </CardHeader>
          <CardContent>
            {title || message ? (
              <div
                className={cn(
                  'p-4 rounded-lg border-l-4',
                  severity === 'urgent' && 'bg-red-50 border-red-500',
                  severity === 'important' && 'bg-orange-50 border-orange-500',
                  severity === 'info' && 'bg-blue-50 border-blue-500'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      severity === 'urgent' && 'bg-red-100 text-red-600',
                      severity === 'important' &&
                        'bg-orange-100 text-orange-600',
                      severity === 'info' && 'bg-blue-100 text-blue-600'
                    )}
                  >
                    {severity === 'urgent' && (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    {severity === 'important' && (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {severity === 'info' && <Info className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {title || 'Titre de la notification'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {message || 'Message de la notification...'}
                    </p>
                    {includeAction && actionLabel && (
                      <Button size="sm" className="mt-3">
                        {actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Remplissez le formulaire pour voir l&apos;aperçu
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conseils</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Info</strong> : Pour les annonces générales, mises à
                jour mineures
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Important</strong> : Pour les changements qui
                nécessitent attention
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Urgent</strong> : Pour les actions requises
                immédiatement
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function MessagesPage() {
  const { data: orders } = useOrdersWithMissingFields();
  const missingCount = orders?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Centre de messagerie LinkMe
          </h1>
          <p className="text-sm text-gray-500">
            Demandes d&apos;informations et notifications affiliés
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="missing-fields">
        <TabsList>
          <TabsTrigger value="missing-fields" className="gap-2">
            <FileText className="h-4 w-4" />
            Infos manquantes
            {missingCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 min-w-[20px] px-1.5"
              >
                {missingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications affiliés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missing-fields" className="mt-6">
          <MissingFieldsTab />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
