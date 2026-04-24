'use client';

/**
 * Hooks for the Messages page
 *
 * @module messages/components/hooks
 */

import { createClient } from '@verone/utils/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getOrderMissingFields } from '../../utils/order-missing-fields';
import type { LinkMeOrderDetails } from '../../hooks/use-linkme-order-actions';
import { LINKME_CHANNEL_ID } from '../../hooks/use-linkme-orders';
import type {
  OrderWithMissing,
  InfoRequest,
  InfoRequestHistoryItem,
  Enseigne,
  Affiliate,
  NotificationSeverity,
  TargetType,
} from './types';

// =============================================================================
// HOOKS - INFOS MANQUANTES
// =============================================================================

export function useOrdersWithMissingFields() {
  return useQuery({
    queryKey: ['orders-missing-fields'],
    queryFn: async () => {
      const supabase = createClient();

      type OrgRow = {
        id: string;
        trade_name: string | null;
        legal_name: string;
        siret: string | null;
        enseigne_id: string | null;
        country: string | null;
        vat_number: string | null;
        billing_address_line1: string | null;
        billing_postal_code: string | null;
        billing_city: string | null;
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
          responsable_contact_id, billing_contact_id, delivery_contact_id,
          responsable_contact:contacts!responsable_contact_id (
            id, first_name, last_name, email, phone
          ),
          billing_contact:contacts!billing_contact_id (
            id, first_name, last_name, email, phone
          ),
          delivery_contact:contacts!delivery_contact_id (
            id, first_name, last_name, email, phone
          ),
          organisations!sales_orders_customer_id_fkey (
            id, trade_name, legal_name, siret, enseigne_id, country, vat_number, billing_address_line1, billing_postal_code, billing_city
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
        // Supabase PostgREST returns single objects for FK joins, handle both shapes
        const detailsRaw = order.sales_order_linkme_details as unknown as
          | Record<string, unknown>
          | Record<string, unknown>[]
          | null;
        const details = (
          Array.isArray(detailsRaw)
            ? (detailsRaw[0] ?? null)
            : (detailsRaw ?? null)
        ) as LinkMeOrderDetails | null;

        const orgRaw = order.organisations as unknown as
          | OrgRow
          | OrgRow[]
          | null;
        const org = Array.isArray(orgRaw)
          ? (orgRaw[0] ?? null)
          : (orgRaw ?? null);

        const rawIgnored = (details as unknown as Record<string, unknown>)
          ?.ignored_missing_fields;
        const ignoredFields = Array.isArray(rawIgnored)
          ? (rawIgnored as string[])
          : [];

        const detailsRecord = details as unknown as Record<
          string,
          unknown
        > | null;
        const ownerType = (detailsRecord?.owner_type as string | null) ?? null;

        // Normalize nested contact refs — Supabase .select() peut renvoyer
        // l'embed comme objet ou tableau selon la cardinalité détectée.
        const pickContact = (raw: unknown) => {
          if (!raw) return null;
          const maybeArray = raw as Array<Record<string, unknown>>;
          const obj = Array.isArray(maybeArray) ? maybeArray[0] : raw;
          if (!obj) return null;
          const rec = obj as Record<string, unknown>;
          return {
            first_name: (rec.first_name as string | null) ?? null,
            last_name: (rec.last_name as string | null) ?? null,
            email: (rec.email as string | null) ?? null,
            phone: (rec.phone as string | null) ?? null,
          };
        };

        const missingFields = getOrderMissingFields({
          details,
          responsableContact: pickContact(
            (order as unknown as Record<string, unknown>).responsable_contact
          ),
          billingContact: pickContact(
            (order as unknown as Record<string, unknown>).billing_contact
          ),
          deliveryContact: pickContact(
            (order as unknown as Record<string, unknown>).delivery_contact
          ),
          organisationSiret: org?.siret,
          organisationCountry: org?.country,
          organisationVatNumber: org?.vat_number,
          organisationLegalName: org?.legal_name,
          organisationBillingAddress: org?.billing_address_line1,
          organisationBillingPostalCode: org?.billing_postal_code,
          organisationBillingCity: org?.billing_city,
          ownerType,
          ignoredFields,
        });

        // Normalize info requests (also could be object or array)
        const infoReqRaw = order.linkme_info_requests as unknown as
          | InfoRequest
          | InfoRequest[]
          | null;
        const infoRequests: InfoRequest[] = Array.isArray(infoReqRaw)
          ? infoReqRaw
          : infoReqRaw
            ? [infoReqRaw]
            : [];

        if (!missingFields.isComplete) {
          results.push({
            id: order.id,
            order_number: order.order_number,
            total_ttc: order.total_ttc,
            status: order.status,
            customer_id: order.customer_id,
            organisationName: org?.trade_name ?? org?.legal_name ?? null,
            organisationSiret: org?.siret ?? null,
            organisationId: org?.id ?? null,
            enseigneId: org?.enseigne_id ?? null,
            ownerType: ownerType,
            details,
            detailsId:
              ((details as unknown as Record<string, unknown>)?.id as
                | string
                | null) ?? null,
            ignoredFields,
            missingFields,
            infoRequests,
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

export function useInfoRequestHistory() {
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
// HOOKS - NOTIFICATIONS
// =============================================================================

export function useEnseignes() {
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

export function useAffiliates(enseigneId?: string) {
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

export function useSendNotification() {
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
      if (userIds.length === 0) throw new Error('Aucun destinataire trouve');
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
        `Notification envoyee a ${data.recipientCount} destinataire(s)`
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

export function useSendInfoRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      salesOrderId: string;
      orderNumber: string;
      recipientEmail: string;
      recipientName: string;
      recipientType: 'requester' | 'owner' | 'manual';
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
      toast.success('Demande envoyee par email');
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

export function useIgnoreField() {
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
      toast.error('Erreur lors de la mise a jour');
    },
  });
}
