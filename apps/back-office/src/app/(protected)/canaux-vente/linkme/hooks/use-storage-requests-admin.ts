/**
 * Hook: useStorageRequestsAdmin
 * Gestion des demandes d'envoi de stock cote Back-Office
 *
 * Permet au staff Verone de:
 * - Voir les demandes pending avec infos affilie/produit
 * - Approuver (cree reception pending)
 * - Rejeter (avec raison)
 * - Voir le count pour badge sidebar
 *
 * @module use-storage-requests-admin
 * @since 2026-02-25
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';

// Types
export interface StorageRequestAdmin {
  id: string;
  product_id: string;
  affiliate_id: string;
  owner_enseigne_id: string | null;
  owner_organisation_id: string | null;
  quantity: number;
  notes: string | null;
  status: string;
  rejection_reason: string | null;
  reception_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  product_name: string;
  product_sku: string;
  product_image_url?: string | null;
  affiliate_name: string;
  owner_name: string;
}

/**
 * Hook: recupere les demandes d'envoi de stock (toutes ou par status)
 */
export function usePendingStorageRequests(status?: string) {
  return useQuery({
    queryKey: ['storage-requests-admin', status],
    queryFn: async (): Promise<StorageRequestAdmin[]> => {
      const supabase: SupabaseClient<Database> = createClient();

      let query = supabase
        .from('affiliate_storage_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[usePendingStorageRequests] Error:', error);
        throw error;
      }

      const requests = (data ?? []) as unknown as StorageRequestAdmin[];
      if (requests.length === 0) return [];

      // Enrich with product info
      const productIds = [...new Set(requests.map(r => r.product_id))];
      const affiliateIds = [...new Set(requests.map(r => r.affiliate_id))];
      const enseigneIds = requests
        .filter(r => r.owner_enseigne_id)
        .map(r => r.owner_enseigne_id as string);
      const orgIds = requests
        .filter(r => r.owner_organisation_id)
        .map(r => r.owner_organisation_id as string);

      // Parallel fetches
      const [productsRes, imagesRes, affiliatesRes, enseignesRes, orgsRes] =
        await Promise.all([
          supabase
            .from('products')
            .select('id, name, sku')
            .in('id', productIds),
          supabase
            .from('product_images')
            .select('product_id, public_url, display_order')
            .in('product_id', productIds)
            .order('display_order', { ascending: true }),
          supabase
            .from('linkme_affiliates')
            .select('id, display_name')
            .in('id', affiliateIds),
          enseigneIds.length > 0
            ? supabase
                .from('enseignes')
                .select('id, name')
                .in('id', enseigneIds)
            : Promise.resolve({ data: [] }),
          orgIds.length > 0
            ? supabase
                .from('organisations')
                .select('id, legal_name, trade_name')
                .in('id', orgIds)
            : Promise.resolve({ data: [] }),
        ]);

      // Build maps
      const productMap = new Map<string, { name: string; sku: string }>();
      for (const p of productsRes.data ?? []) {
        productMap.set(p.id, { name: p.name, sku: p.sku ?? '' });
      }

      const imageMap = new Map<string, string>();
      for (const img of imagesRes.data ?? []) {
        if (!imageMap.has(img.product_id)) {
          imageMap.set(img.product_id, img.public_url ?? '');
        }
      }

      const affiliateMap = new Map<string, string>();
      for (const a of affiliatesRes.data ?? []) {
        affiliateMap.set(a.id, a.display_name);
      }

      const enseigneMap = new Map<string, string>();
      for (const e of enseignesRes.data ?? []) {
        enseigneMap.set(e.id, e.name);
      }

      const orgMap = new Map<string, string>();
      for (const o of orgsRes.data ?? []) {
        orgMap.set(
          o.id,
          ((o as Record<string, unknown>).trade_name as string) ??
            ((o as Record<string, unknown>).legal_name as string) ??
            ''
        );
      }

      return requests.map(r => ({
        ...r,
        product_name: productMap.get(r.product_id)?.name ?? 'Produit inconnu',
        product_sku: productMap.get(r.product_id)?.sku ?? '',
        product_image_url: imageMap.get(r.product_id) ?? null,
        affiliate_name: affiliateMap.get(r.affiliate_id) ?? 'Affilie inconnu',
        owner_name: r.owner_enseigne_id
          ? (enseigneMap.get(r.owner_enseigne_id) ?? '')
          : r.owner_organisation_id
            ? (orgMap.get(r.owner_organisation_id) ?? '')
            : '',
      }));
    },
    staleTime: 300_000,
  });
}

/**
 * Hook: count des demandes pending (pour badge sidebar)
 */
export function usePendingStorageRequestsCount() {
  return useQuery({
    queryKey: ['storage-requests-count'],
    queryFn: async (): Promise<number> => {
      const supabase: SupabaseClient<Database> = createClient();

      const { data, error } = await supabase.rpc(
        'get_pending_storage_requests_count'
      );

      if (error) {
        console.error('[usePendingStorageRequestsCount] Error:', error);
        return 0;
      }

      return data ?? 0;
    },
    refetchInterval: 60000,
  });
}

/**
 * Hook: approuver une demande d'envoi
 */
export function useApproveStorageRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      requestId: string
    ): Promise<{ success: boolean; reception_id?: string; error?: string }> => {
      const supabase: SupabaseClient<Database> = createClient();

      // Fetch request details BEFORE approval for email
      const { data: reqData } = await supabase
        .from('affiliate_storage_requests')
        .select(
          'product_id, quantity, owner_enseigne_id, owner_organisation_id, affiliate_id'
        )
        .eq('id', requestId)
        .single();

      const { data, error } = await supabase.rpc('approve_storage_request', {
        p_request_id: requestId,
      });

      if (error) {
        console.error('[useApproveStorageRequest] Error:', error);
        throw error;
      }

      const result = data as unknown as {
        success: boolean;
        reception_id?: string;
        error?: string;
      };
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur inconnue');
      }

      // Send approval email (non-blocking)
      if (reqData) {
        void sendStorageApprovalEmail(
          supabase,
          reqData as StorageRequestRow
        ).catch(err =>
          console.error('[useApproveStorageRequest] Email failed:', err)
        );
      }

      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['storage-requests-admin'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['storage-requests-count'],
      });
    },
  });
}

/**
 * Hook: rejeter une demande d'envoi
 */
export function useRejectStorageRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      const supabase: SupabaseClient<Database> = createClient();

      // Fetch request details BEFORE rejection for email
      const { data: reqData } = await supabase
        .from('affiliate_storage_requests')
        .select(
          'product_id, quantity, owner_enseigne_id, owner_organisation_id, affiliate_id'
        )
        .eq('id', requestId)
        .single();

      const { data, error } = await supabase.rpc('reject_storage_request', {
        p_request_id: requestId,
        p_reason: reason,
      });

      if (error) {
        console.error('[useRejectStorageRequest] Error:', error);
        throw error;
      }

      const result = data as unknown as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error ?? 'Erreur inconnue');
      }

      // Send rejection email (non-blocking)
      if (reqData) {
        void sendStorageRejectionEmail(
          supabase,
          reqData as StorageRequestRow,
          reason ?? ''
        ).catch(err =>
          console.error('[useRejectStorageRequest] Email failed:', err)
        );
      }

      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['storage-requests-admin'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['storage-requests-count'],
      });
    },
  });
}

// ─── Email helpers ──────────────────────────────────────────────────────────

interface StorageRequestRow {
  product_id: string;
  quantity: number;
  owner_enseigne_id: string | null;
  owner_organisation_id: string | null;
  affiliate_id: string;
}

/**
 * Fetch product info + recipient emails for a storage request
 */
async function getEmailContext(
  supabase: SupabaseClient<Database>,
  req: StorageRequestRow
): Promise<{
  productName: string;
  productSku: string;
  affiliateName: string;
  recipientEmails: string[];
} | null> {
  // Fetch product info
  const { data: product } = await supabase
    .from('products')
    .select('name, sku')
    .eq('id', req.product_id)
    .single();

  if (!product) return null;

  // Fetch affiliate display name
  const { data: affiliate } = await supabase
    .from('linkme_affiliates')
    .select('display_name')
    .eq('id', req.affiliate_id)
    .single();

  // Fetch recipient emails: LinkMe users for this enseigne/org
  interface UserAppRole {
    user_id: string;
  }
  let userQuery = supabase
    .from('user_app_roles')
    .select('user_id')
    .eq('app', 'linkme')
    .eq('is_active', true);

  if (req.owner_enseigne_id) {
    userQuery = userQuery.eq('enseigne_id', req.owner_enseigne_id);
  } else if (req.owner_organisation_id) {
    userQuery = userQuery.eq('organisation_id', req.owner_organisation_id);
  } else {
    return null;
  }

  const { data: roles } = await userQuery.returns<UserAppRole[]>();
  if (!roles?.length) return null;

  const userIds = roles.map(r => r.user_id);

  // Fetch emails from user_profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('email')
    .in('id', userIds);

  const emails = (profiles ?? [])
    .map(p => (p as Record<string, unknown>).email as string | null)
    .filter((e): e is string => !!e);

  if (emails.length === 0) return null;

  return {
    productName: product.name,
    productSku: product.sku ?? '',
    affiliateName: affiliate?.display_name ?? 'Partenaire',
    recipientEmails: emails,
  };
}

async function sendStorageApprovalEmail(
  supabase: SupabaseClient<Database>,
  req: StorageRequestRow
): Promise<void> {
  const ctx = await getEmailContext(supabase, req);
  if (!ctx) return;

  await fetch('/api/emails/storage-request-approved', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productName: ctx.productName,
      productSku: ctx.productSku,
      quantity: req.quantity,
      affiliateName: ctx.affiliateName,
      recipientEmails: ctx.recipientEmails,
    }),
  });
}

async function sendStorageRejectionEmail(
  supabase: SupabaseClient<Database>,
  req: StorageRequestRow,
  reason: string
): Promise<void> {
  const ctx = await getEmailContext(supabase, req);
  if (!ctx) return;

  await fetch('/api/emails/storage-request-rejected', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productName: ctx.productName,
      productSku: ctx.productSku,
      quantity: req.quantity,
      affiliateName: ctx.affiliateName,
      reason,
      recipientEmails: ctx.recipientEmails,
    }),
  });
}
