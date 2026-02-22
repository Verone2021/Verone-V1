'use client';

/**
 * Centre de Messagerie LinkMe
 *
 * 4 onglets :
 * 1. Infos manquantes - Commandes avec champs a completer (sans demande en cours)
 * 2. En attente de retour - Commandes avec demande envoyee, en attente de reponse
 * 3. Historique - Toutes les demandes d'info envoyees avec leur statut
 * 4. Notifications affilies - Broadcast notifications
 *
 * @module MessagesPage
 * @since 2026-01-22
 * @updated 2026-02-17 - Refonte 4 onglets + cartes enrichies + historique
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
  History,
  RotateCcw,
  XCircle,
  Hourglass,
  EyeOff,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getOrderMissingFields,
  CATEGORY_LABELS,
  type MissingFieldsResult,
  type MissingFieldCategory,
} from '../utils/order-missing-fields';
import type { LinkMeOrderDetails } from '../hooks/use-linkme-order-actions';
import { LINKME_CHANNEL_ID } from '../hooks/use-linkme-orders';

// =============================================================================
// TYPES
// =============================================================================

type NotificationSeverity = 'info' | 'important' | 'urgent';
type TargetType = 'all' | 'enseigne' | 'affiliate';

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
  completed_by_email: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  submitted_data: Record<string, string> | null;
  custom_message: string | null;
  token_expires_at: string | null;
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
  detailsId: string | null;
  ignoredFields: string[];
  missingFields: MissingFieldsResult;
  infoRequests: InfoRequest[];
}

// =============================================================================
// HELPERS
// =============================================================================

const CATEGORY_BADGE_COLORS: Record<MissingFieldCategory, string> = {
  responsable: 'bg-red-100 text-red-700 border-red-200',
  billing: 'bg-orange-100 text-orange-700 border-orange-200',
  delivery: 'bg-blue-100 text-blue-700 border-blue-200',
  organisation: 'bg-purple-100 text-purple-700 border-purple-200',
  custom: 'bg-gray-100 text-gray-700 border-gray-200',
};

const ORDER_STATUS_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  pending_approval: {
    label: 'En attente approbation',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  draft: {
    label: 'Brouillon',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  validated: {
    label: 'Validée',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  partially_shipped: {
    label: 'Partiellement expédiée',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
};

function OrderStatusBadge({ status }: { status: string }) {
  const config = ORDER_STATUS_LABELS[status];
  if (!config) return null;
  return (
    <Badge variant="outline" className={cn('text-xs', config.className)}>
      {config.label}
    </Badge>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays === 1) return 'hier';
  return `il y a ${diffDays} jours`;
}

function getInfoRequestStatus(
  req: InfoRequest
): 'pending' | 'completed' | 'cancelled' | 'expired' {
  if (req.completed_at) return 'completed';
  if (req.cancelled_at) return 'cancelled';
  if (req.token_expires_at && new Date(req.token_expires_at) < new Date()) {
    return 'expired';
  }
  return 'pending';
}

function hasPendingRequest(order: OrderWithMissing): boolean {
  return order.infoRequests.some(r => getInfoRequestStatus(r) === 'pending');
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
            ignored_missing_fields,
            created_at, updated_at
          ),
          linkme_info_requests (
            id, token, recipient_email, recipient_type, sent_at,
            completed_at, completed_by_email, cancelled_at, cancelled_reason,
            submitted_data, custom_message, token_expires_at
          )
        `
        )
        .in('status', [
          'pending_approval',
          'draft',
          'validated',
          'partially_shipped',
        ])
        .eq('channel_id', LINKME_CHANNEL_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const results: OrderWithMissing[] = [];

      for (const order of orders ?? []) {
        const detailsArray = order.sales_order_linkme_details as Array<
          Record<string, unknown>
        > | null;
        const details = (detailsArray?.[0] ??
          null) as LinkMeOrderDetails | null;

        // After backfill, details should always exist for LinkMe orders.
        // If still null (edge case), getOrderMissingFields handles it gracefully.
        const orgArray = order.organisations as unknown as OrgRow[] | null;
        const org = orgArray?.[0] ?? null;

        const rawIgnored = (details as unknown as Record<string, unknown>)
          ?.ignored_missing_fields;
        const ignoredFields = Array.isArray(rawIgnored)
          ? (rawIgnored as string[])
          : [];

        const missingFields = getOrderMissingFields({
          details,
          organisationSiret: org?.siret,
          ignoredFields,
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
            detailsId:
              ((details as unknown as Record<string, unknown>)?.id as
                | string
                | null) ?? null,
            ignoredFields,
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
// HOOKS - INFO REQUEST HISTORY
// =============================================================================

interface InfoRequestHistoryItem {
  id: string;
  sales_order_id: string;
  order_number: string;
  recipient_email: string;
  recipient_type: string;
  sent_at: string;
  completed_at: string | null;
  completed_by_email: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  submitted_data: Record<string, string> | null;
  custom_message: string | null;
  token_expires_at: string | null;
}

function useInfoRequestHistory() {
  return useQuery({
    queryKey: ['info-request-history'],
    queryFn: async () => {
      const supabase = createClient();

      type RequestRow = {
        id: string;
        sales_order_id: string;
        recipient_email: string;
        recipient_type: string;
        sent_at: string;
        completed_at: string | null;
        completed_by_email: string | null;
        cancelled_at: string | null;
        cancelled_reason: string | null;
        submitted_data: Record<string, string> | null;
        custom_message: string | null;
        token_expires_at: string | null;
        sales_orders: { order_number: string } | null;
      };

      const { data, error } = await supabase
        .from('linkme_info_requests')
        .select(
          `
          id, sales_order_id, recipient_email, recipient_type,
          sent_at, completed_at, completed_by_email,
          cancelled_at, cancelled_reason,
          submitted_data, custom_message, token_expires_at,
          sales_orders ( order_number )
        `
        )
        .order('sent_at', { ascending: false })
        .limit(50)
        .returns<RequestRow[]>();

      if (error) throw error;

      return (data ?? []).map(
        (r): InfoRequestHistoryItem => ({
          id: r.id,
          sales_order_id: r.sales_order_id,
          order_number: r.sales_orders?.order_number ?? 'N/A',
          recipient_email: r.recipient_email,
          recipient_type: r.recipient_type,
          sent_at: r.sent_at,
          completed_at: r.completed_at,
          completed_by_email: r.completed_by_email,
          cancelled_at: r.cancelled_at,
          cancelled_reason: r.cancelled_reason,
          submitted_data: r.submitted_data,
          custom_message: r.custom_message,
          token_expires_at: r.token_expires_at,
        })
      );
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
      await queryClient.invalidateQueries({
        queryKey: ['info-request-history'],
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
// IGNORE FIELD MUTATION
// =============================================================================

function useIgnoreField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      detailsId,
      currentIgnored,
      fieldKey,
    }: {
      detailsId: string;
      currentIgnored: string[];
      fieldKey: string;
    }) => {
      const supabase = createClient();
      const updated = currentIgnored.includes(fieldKey)
        ? currentIgnored.filter(k => k !== fieldKey)
        : [...currentIgnored, fieldKey];

      const { error } = await supabase
        .from('sales_order_linkme_details')
        .update({ ignored_missing_fields: updated })
        .eq('id', detailsId);

      if (error) throw error;
      return updated;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['orders-missing-fields'],
      });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Messages] Erreur ignore field:', msg);
      toast.error('Erreur lors de la mise à jour');
    },
  });
}

// =============================================================================
// COMPONENTS - CATEGORY BADGES
// =============================================================================

function CategoryBadges({
  missingFields,
}: {
  missingFields: MissingFieldsResult;
}) {
  const categories = Object.entries(missingFields.byCategory).filter(
    ([, fields]) => fields.length > 0
  ) as [MissingFieldCategory, typeof missingFields.fields][];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5 flex-wrap">
        {categories.map(([cat, fields]) => (
          <Tooltip key={cat}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs cursor-default',
                  CATEGORY_BADGE_COLORS[cat]
                )}
              >
                {CATEGORY_LABELS[cat]} ({fields.length})
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <ul className="text-xs space-y-0.5">
                {fields.map(f => (
                  <li key={f.key}>{f.label}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
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
  const ignoreField = useIgnoreField();

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

  const pendingRequest = order.infoRequests.find(
    r =>
      r.recipient_type === recipientType &&
      getInfoRequestStatus(r) === 'pending'
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

          {/* Missing fields with ignore buttons */}
          <div className="space-y-2">
            <Label className="font-semibold">
              Champs manquants ({order.missingFields.total})
            </Label>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              {order.missingFields.fields.map(f => (
                <div
                  key={f.key}
                  className="flex items-center gap-2 text-sm group"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs flex-shrink-0',
                      CATEGORY_BADGE_COLORS[f.category]
                    )}
                  >
                    {f.category}
                  </Badge>
                  <span className="flex-1">{f.label}</span>
                  {order.detailsId && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => {
                              if (!order.detailsId) return;
                              void ignoreField
                                .mutateAsync({
                                  detailsId: order.detailsId,
                                  currentIgnored: order.ignoredFields,
                                  fieldKey: f.key,
                                })
                                .catch(err => {
                                  console.error(
                                    '[SendInfoRequestDialog] ignoreField failed:',
                                    err
                                  );
                                });
                            }}
                            disabled={ignoreField.isPending}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          Ignorer ce champ pour cette commande
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ))}
              {order.ignoredFields.length > 0 && (
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <p className="text-xs text-gray-500 mb-1">
                    Champs ignorés ({order.ignoredFields.length}) :
                  </p>
                  {order.ignoredFields.map(key => (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-xs text-gray-400 group"
                    >
                      <EyeOff className="h-3 w-3 flex-shrink-0" />
                      <span className="line-through flex-1">
                        {key.replace(/_/g, ' ')}
                      </span>
                      {order.detailsId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!order.detailsId) return;
                            void ignoreField
                              .mutateAsync({
                                detailsId: order.detailsId,
                                currentIgnored: order.ignoredFields,
                                fieldKey: key,
                              })
                              .catch(err => {
                                console.error(
                                  '[SendInfoRequestDialog] restoreField failed:',
                                  err
                                );
                              });
                          }}
                          disabled={ignoreField.isPending}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-500 hover:underline"
                        >
                          Restaurer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
// COMPONENTS - ORDER CARD (SHARED)
// =============================================================================

function OrderCard({
  order,
  onSendRequest,
  variant,
}: {
  order: OrderWithMissing;
  onSendRequest: () => void;
  variant: 'missing' | 'waiting';
}) {
  const pendingReqs = order.infoRequests.filter(
    r => getInfoRequestStatus(r) === 'pending'
  );
  const latestPending = pendingReqs[0];

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            {/* Order info */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-lg">{order.order_number}</span>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-gray-600">
                {order.organisationName ?? '-'}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span className="font-medium text-green-600">
                {formatCurrency(order.total_ttc)}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Category badges */}
            <CategoryBadges missingFields={order.missingFields} />

            {/* Request status for waiting variant */}
            {variant === 'waiting' && latestPending && (
              <div className="flex items-center gap-2 text-sm bg-amber-50 rounded-lg p-2">
                <Mail className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                <span className="text-amber-700">
                  Envoyé à <strong>{latestPending.recipient_email}</strong> (
                  {latestPending.recipient_type === 'requester'
                    ? 'demandeur'
                    : 'propriétaire'}
                  )
                </span>
                <Separator orientation="vertical" className="h-3" />
                <span className="text-amber-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(latestPending.sent_at)}
                </span>
              </div>
            )}

            {/* No request for missing variant */}
            {variant === 'missing' && (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Mail className="h-3.5 w-3.5" />
                Aucune demande envoyée
              </div>
            )}
          </div>

          {/* Action button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSendRequest}
            className="flex-shrink-0"
          >
            {variant === 'waiting' ? (
              <>
                <RotateCcw className="h-4 w-4 mr-1" />
                Relancer
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Envoyer demande
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// COMPONENTS - MISSING FIELDS TAB (ONLY WITHOUT PENDING REQUESTS)
// =============================================================================

function MissingFieldsTab({
  orders,
  isLoading,
}: {
  orders: OrderWithMissing[] | undefined;
  isLoading: boolean;
}) {
  const [dialogOrder, setDialogOrder] = useState<OrderWithMissing | null>(null);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    // Only orders WITHOUT a pending info request
    return orders.filter(order => !hasPendingRequest(order));
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
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="destructive">
          {filteredOrders.length} commande(s) sans demande
        </Badge>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-300" />
            <p className="font-medium">
              Toutes les commandes ont une demande en cours
            </p>
            <p className="text-sm mt-1">
              Consultez l&apos;onglet &laquo; En attente de retour &raquo;
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            variant="missing"
            onSendRequest={() => setDialogOrder(order)}
          />
        ))
      )}

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
// COMPONENTS - WAITING TAB (ORDERS WITH PENDING REQUESTS)
// =============================================================================

function WaitingTab({
  orders,
  isLoading,
}: {
  orders: OrderWithMissing[] | undefined;
  isLoading: boolean;
}) {
  const [dialogOrder, setDialogOrder] = useState<OrderWithMissing | null>(null);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    // Only orders WITH a pending info request
    return orders.filter(order => hasPendingRequest(order));
  }, [orders]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="secondary">
          <Hourglass className="h-3 w-3 mr-1" />
          {filteredOrders.length} en attente de retour
        </Badge>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">Aucune demande en attente</p>
            <p className="text-sm mt-1">
              Les demandes envoyées apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            variant="waiting"
            onSendRequest={() => setDialogOrder(order)}
          />
        ))
      )}

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
// COMPONENTS - HISTORY TAB
// =============================================================================

function HistoryStatusBadge({ item }: { item: InfoRequestHistoryItem }) {
  if (item.completed_at) {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Complété
      </Badge>
    );
  }
  if (item.cancelled_at) {
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
        <XCircle className="h-3 w-3 mr-1" />
        {item.cancelled_reason === 'completed_by_other'
          ? 'Autre réponse'
          : 'Annulé'}
      </Badge>
    );
  }
  if (item.token_expires_at && new Date(item.token_expires_at) < new Date()) {
    return (
      <Badge className="bg-gray-100 text-gray-500 border-gray-200">
        <Clock className="h-3 w-3 mr-1" />
        Expiré
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
      <Hourglass className="h-3 w-3 mr-1" />
      En attente
    </Badge>
  );
}

function HistoryTab() {
  const { data: history, isLoading } = useInfoRequestHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Aucune demande envoyée</p>
          <p className="text-sm mt-1">
            L&apos;historique des demandes d&apos;informations apparaîtra ici
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-500">
        {history.length} demande(s) (50 dernières)
      </div>

      {history.map(item => {
        const isExpanded = expandedId === item.id;
        const submittedEntries = item.submitted_data
          ? Object.entries(item.submitted_data)
          : [];

        return (
          <Card key={item.id}>
            <CardContent className="py-3">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-semibold text-sm">
                      {item.order_number}
                    </span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-sm text-gray-600 truncate">
                      {item.recipient_email}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {item.recipient_type === 'requester'
                        ? 'Demandeur'
                        : 'Propriétaire'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <HistoryStatusBadge item={item} />
                    <span className="text-xs text-gray-400">
                      {new Date(item.sent_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {item.custom_message && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">
                        Message :
                      </span>{' '}
                      <span className="text-gray-500 italic">
                        &laquo; {item.custom_message} &raquo;
                      </span>
                    </div>
                  )}

                  {item.completed_at && (
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complété le{' '}
                        {new Date(item.completed_at).toLocaleDateString(
                          'fr-FR'
                        )}
                        {item.completed_by_email &&
                          ` par ${item.completed_by_email}`}
                      </div>

                      {submittedEntries.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-2 mt-1">
                          <p className="text-xs font-medium text-green-800 mb-1">
                            Champs remplis ({submittedEntries.length}) :
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                            {submittedEntries.map(([key, val]) => (
                              <div key={key} className="text-xs text-green-700">
                                <span className="text-green-600">
                                  {formatFieldLabel(key)}
                                </span>
                                : {val}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {item.cancelled_at && (
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" />
                      Annulé le{' '}
                      {new Date(item.cancelled_at).toLocaleDateString('fr-FR')}
                      {item.cancelled_reason === 'completed_by_other' &&
                        ' (autre destinataire a répondu)'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/** Format a field key to a readable label */
function formatFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    requester_name: 'Nom demandeur',
    requester_email: 'Email demandeur',
    requester_phone: 'Tél. demandeur',
    owner_name: 'Nom propriétaire',
    owner_email: 'Email propriétaire',
    owner_phone: 'Tél. propriétaire',
    owner_company_legal_name: 'Raison sociale',
    billing_name: 'Contact facturation',
    billing_email: 'Email facturation',
    billing_phone: 'Tél. facturation',
    delivery_contact_name: 'Contact livraison',
    delivery_contact_email: 'Email livraison',
    delivery_contact_phone: 'Tél. livraison',
    delivery_address: 'Adresse',
    delivery_postal_code: 'Code postal',
    delivery_city: 'Ville',
    desired_delivery_date: 'Date souhaitée',
    mall_email: 'Email centre commercial',
    organisation_siret: 'SIRET',
  };
  return labels[key] ?? key.replace(/_/g, ' ');
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
  const { data: orders, isLoading } = useOrdersWithMissingFields();

  const missingCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(o => !hasPendingRequest(o)).length;
  }, [orders]);

  const waitingCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(o => hasPendingRequest(o)).length;
  }, [orders]);

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
            Demandes d&apos;informations, suivi et notifications affiliés
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
          <TabsTrigger value="waiting" className="gap-2">
            <Hourglass className="h-4 w-4" />
            En attente de retour
            {waitingCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-[20px] px-1.5"
              >
                {waitingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications affiliés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missing-fields" className="mt-6">
          <MissingFieldsTab orders={orders} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="waiting" className="mt-6">
          <WaitingTab orders={orders} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryTab />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
