'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';

import { createClient } from '@verone/utils/supabase/client';

import type { AmbassadorAttribution } from './use-ambassadors';

// ============================================
// Types
// ============================================

export interface PayableAmbassador {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  current_balance: number;
  payout_threshold: number;
  iban: string | null;
  bic: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  siret: string | null;
  siret_required: boolean;
  validatedAttributions: AmbassadorAttribution[];
}

export interface MarkPaidPayload {
  customerId: string;
  attribution_ids: string[];
  payment_reference: string;
  payment_date: string;
}

export interface MarkPaidResponse {
  success: boolean;
  paid_count: number;
  total_amount: number;
  payment_reference: string;
  payment_date: string;
}

// For CSV export
export interface PaidAttributionRow {
  id: string;
  customer_email: string;
  customer_name: string;
  attribution_date: string;
  prime_amount: number;
  paid_at: string | null;
}

// ============================================
// Query key
// ============================================

const PAYOUTS_QUERY_KEY = ['ambassador-pending-payouts'];

// ============================================
// usePendingPayouts
// ============================================

export function usePendingPayouts() {
  return useQuery({
    queryKey: PAYOUTS_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();

      // Fetch ambassadors with balance >= payout_threshold
      const { data: customers, error } = await supabase
        .from('individual_customers')
        .select('*')
        .eq('is_ambassador' as never, true as never)
        .order('ambassador_current_balance' as never, { ascending: false });

      if (error) throw error;
      if (!customers || customers.length === 0)
        return [] as PayableAmbassador[];

      const rows = customers as unknown as Record<string, unknown>[];

      // Filter: balance >= threshold
      const payable = rows.filter(r => {
        const balance = Number(r.ambassador_current_balance ?? 0);
        const threshold = Number(r.ambassador_payout_threshold ?? 20);
        return balance >= threshold;
      });

      if (payable.length === 0) return [] as PayableAmbassador[];

      const ids = payable.map(r => r.id as string);

      // Fetch validated attributions for all payable ambassadors
      const { data: attributions, error: attrError } = await supabase
        .from('ambassador_attributions')
        .select('*')
        .in('customer_id' as never, ids as never)
        .eq('status', 'validated');

      if (attrError) throw attrError;

      const attrRows = (attributions ??
        []) as unknown as AmbassadorAttribution[];

      // Group by customer_id
      const attrByCustomer = new Map<string, AmbassadorAttribution[]>();
      for (const attr of attrRows) {
        const key = attr.customer_id;
        const existing = attrByCustomer.get(key) ?? [];
        existing.push(attr);
        attrByCustomer.set(key, existing);
      }

      return payable.map(r => ({
        id: r.id as string,
        first_name: (r.first_name as string | null) ?? '',
        last_name: (r.last_name as string | null) ?? '',
        email: (r.email as string | null) ?? '',
        current_balance: Number(r.ambassador_current_balance ?? 0),
        payout_threshold: Number(r.ambassador_payout_threshold ?? 20),
        iban: (r.ambassador_iban as string | null) ?? null,
        bic: (r.ambassador_bic as string | null) ?? null,
        bank_name: (r.ambassador_bank_name as string | null) ?? null,
        account_holder_name:
          (r.ambassador_account_holder_name as string | null) ?? null,
        siret: (r.ambassador_siret as string | null) ?? null,
        siret_required:
          (r.ambassador_siret_required as boolean | null) ?? false,
        validatedAttributions: attrByCustomer.get(r.id as string) ?? [],
      })) as PayableAmbassador[];
    },
  });
}

// ============================================
// useMarkAttributionsPaid
// ============================================

export function useMarkAttributionsPaid(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: Omit<MarkPaidPayload, 'customerId'>
    ): Promise<MarkPaidResponse> => {
      const res = await fetch(`/api/ambassadors/${customerId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as MarkPaidResponse & { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Erreur lors du paiement');
      }

      return data;
    },
    onSuccess: async data => {
      await queryClient.invalidateQueries({ queryKey: PAYOUTS_QUERY_KEY });
      toast.success(
        `${data.paid_count} prime(s) marquée(s) payée(s) — ${formatEur(data.total_amount)}`
      );
    },
    onError: (error: Error) => {
      console.error('[useMarkAttributionsPaid]', error);
      toast.error(error.message);
    },
  });
}

// ============================================
// usePaidAttributionsForMonth (CSV export)
// ============================================

export function usePaidAttributionsForMonth(year: number, month: number) {
  return useQuery({
    queryKey: ['ambassador-paid-attributions', year, month],
    queryFn: async () => {
      const supabase = createClient();

      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 1).toISOString();

      const { data, error } = await supabase
        .from('ambassador_attributions')
        .select('id, customer_id, prime_amount, paid_at, created_at')
        .eq('status', 'paid')
        .gte('paid_at', startDate)
        .lt('paid_at', endDate);

      if (error) throw error;

      const attrRows = (data ?? []) as unknown as Array<{
        id: string;
        customer_id: string;
        prime_amount: number;
        paid_at: string | null;
        created_at: string;
      }>;

      if (attrRows.length === 0) return [] as PaidAttributionRow[];

      const customerIds = [...new Set(attrRows.map(r => r.customer_id))];
      const { data: customers } = await supabase
        .from('individual_customers')
        .select('id, email, first_name, last_name')
        .in('id', customerIds);

      const custMap = new Map<string, { email: string; name: string }>();
      for (const c of (customers ?? []) as Array<{
        id: string;
        email: string | null;
        first_name: string | null;
        last_name: string | null;
      }>) {
        custMap.set(c.id, {
          email: c.email ?? '',
          name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
        });
      }

      return attrRows.map(r => ({
        id: r.id,
        customer_email: custMap.get(r.customer_id)?.email ?? '',
        customer_name: custMap.get(r.customer_id)?.name ?? '',
        attribution_date: r.created_at,
        prime_amount: Number(r.prime_amount),
        paid_at: r.paid_at,
      })) as PaidAttributionRow[];
    },
  });
}

// ============================================
// Helper
// ============================================

export function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
}
