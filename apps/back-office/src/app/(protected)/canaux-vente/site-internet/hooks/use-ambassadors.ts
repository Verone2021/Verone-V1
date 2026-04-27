'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';

import { createClient } from '@verone/utils/supabase/client';

// ============================================
// Types
// ============================================

export interface Ambassador {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  auth_user_id: string | null;
  iban: string | null;
  bic: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  siret: string | null;
  commission_rate: number;
  discount_rate: number;
  is_active: boolean;
  cgu_accepted_at: string | null;
  cgu_version: string | null;
  total_sales_generated: number;
  total_primes_earned: number;
  total_primes_paid: number;
  current_balance: number;
  annual_earnings_ytd: number;
  siret_required: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  codes?: AmbassadorCode[];
}

export interface AmbassadorCode {
  id: string;
  // customer_id is the new FK name in DB (was ambassador_id)
  customer_id: string;
  discount_id: string;
  code: string;
  qr_code_url: string | null;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export interface AmbassadorAttribution {
  id: string;
  order_id: string;
  // customer_id is the new FK name in DB (was ambassador_id)
  customer_id: string;
  code_id: string | null;
  order_total_ht: number;
  commission_rate: number;
  prime_amount: number;
  status: 'pending' | 'validated' | 'cancelled' | 'paid';
  validation_date: string | null;
  validated_at: string | null;
  paid_at: string | null;
  cancellation_reason: string | null;
  attribution_method: string;
  created_at: string;
}

export interface CreateAmbassadorData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  commission_rate: number;
  discount_rate: number;
  code: string;
  notes?: string;
  iban?: string;
  bic?: string;
  bank_name?: string;
  account_holder_name?: string;
  siret?: string;
}

// ============================================
// Helper: map individual_customers row → Ambassador shape
// ============================================

function mapCustomerToAmbassador(row: Record<string, unknown>): Ambassador {
  return {
    id: row.id as string,
    first_name: row.first_name as string,
    last_name: row.last_name as string,
    email: (row.email as string | null) ?? '',
    phone: (row.phone as string | null) ?? null,
    auth_user_id: (row.auth_user_id as string | null) ?? null,
    // ambassador_* columns (added by migration, not yet in generated types)
    iban: (row.ambassador_iban as string | null) ?? null,
    bic: (row.ambassador_bic as string | null) ?? null,
    bank_name: (row.ambassador_bank_name as string | null) ?? null,
    account_holder_name:
      (row.ambassador_account_holder_name as string | null) ?? null,
    siret: (row.ambassador_siret as string | null) ?? null,
    commission_rate: (row.ambassador_commission_rate as number) ?? 0,
    discount_rate: (row.ambassador_discount_rate as number) ?? 0,
    is_active: (row.is_active as boolean | null) ?? true,
    cgu_accepted_at: (row.ambassador_cgu_accepted_at as string | null) ?? null,
    cgu_version: (row.ambassador_cgu_version as string | null) ?? null,
    total_sales_generated:
      (row.ambassador_total_sales_generated as number) ?? 0,
    total_primes_earned: (row.ambassador_total_primes_earned as number) ?? 0,
    total_primes_paid: (row.ambassador_total_primes_paid as number) ?? 0,
    current_balance: (row.ambassador_current_balance as number) ?? 0,
    annual_earnings_ytd: (row.ambassador_annual_earnings_ytd as number) ?? 0,
    siret_required: (row.ambassador_siret_required as boolean | null) ?? false,
    notes: (row.ambassador_notes as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_at: (row.created_at as string) ?? new Date().toISOString(),
    updated_at: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

// ============================================
// Queries
// ============================================

const QUERY_KEY = ['site-ambassadors'];

export function useAmbassadors() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();

      // Fetch ambassadors from individual_customers
      const { data: customers, error } = await supabase
        .from('individual_customers')
        .select('*')
        // ambassador columns not yet in generated types — cast to bypass
        .eq('is_ambassador' as never, true as never)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!customers || customers.length === 0) return [] as Ambassador[];

      const ambassadors = (
        customers as unknown as Record<string, unknown>[]
      ).map(mapCustomerToAmbassador);

      // Fetch codes separately (avoids PostgREST relation issues)
      const ids = ambassadors.map(a => a.id);
      const { data: codes } = await supabase
        .from('ambassador_codes')
        .select('*')
        // customer_id is the new FK name — cast to bypass stale types
        .in('customer_id' as never, ids as never);

      // Merge codes into ambassadors (codes keyed by customer_id)
      const codesByCustomer = new Map<string, AmbassadorCode[]>();
      for (const code of (codes ?? []) as unknown as AmbassadorCode[]) {
        const key = code.customer_id;
        const existing = codesByCustomer.get(key) ?? [];
        existing.push(code);
        codesByCustomer.set(key, existing);
      }

      return ambassadors.map(a => ({
        ...a,
        codes: codesByCustomer.get(a.id) ?? [],
      }));
    },
  });
}

export function useAmbassadorDetail(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('individual_customers')
        .select('*')
        .eq('id', id)
        .eq('is_ambassador' as never, true as never)
        .single();

      if (error) throw error;

      const ambassador = mapCustomerToAmbassador(
        data as unknown as Record<string, unknown>
      );

      const { data: codes } = await supabase
        .from('ambassador_codes')
        .select('*')
        .eq('customer_id' as never, id as never);

      return {
        ...ambassador,
        codes: (codes ?? []) as unknown as AmbassadorCode[],
      };
    },
    enabled: !!id,
  });
}

export function useAmbassadorAttributions(ambassadorId: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, ambassadorId, 'attributions'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ambassador_attributions')
        .select('*')
        // customer_id is the new FK name — cast to bypass stale types
        .eq('customer_id' as never, ambassadorId as never)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as AmbassadorAttribution[];
    },
    enabled: !!ambassadorId,
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateAmbassador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAmbassadorData) => {
      const supabase = createClient();

      // 1. Creer le client avec is_ambassador=true sur individual_customers
      const { data: customer, error: customerError } = await supabase
        .from('individual_customers')
        .insert({
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email,
          phone: input.phone ?? null,
          source_type: 'site-internet',
          is_active: true,
          // ambassador_* columns not yet in generated types — cast to bypass
          is_ambassador: true,
          ambassador_activated_at: new Date().toISOString(),
          ambassador_commission_rate: input.commission_rate,
          ambassador_discount_rate: input.discount_rate,
          ambassador_notes: input.notes ?? null,
          ambassador_iban: input.iban ?? null,
          ambassador_bic: input.bic ?? null,
          ambassador_bank_name: input.bank_name ?? null,
          ambassador_account_holder_name: input.account_holder_name ?? null,
          ambassador_siret: input.siret ?? null,
        } as never)
        .select()
        .single();

      if (customerError) throw customerError;

      // 2. Creer l'entree order_discounts (code promo)
      const codeUpper = input.code.toUpperCase().replace(/\s/g, '');
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 10); // 10 ans

      const { data: discount, error: discountError } = await supabase
        .from('order_discounts')
        .insert({
          code: codeUpper,
          name: `Ambassadeur ${input.first_name} ${input.last_name}`,
          description: `Code ambassadeur — ${input.discount_rate}% de reduction`,
          discount_type: 'percentage',
          discount_value: input.discount_rate,
          valid_from: new Date().toISOString().slice(0, 10),
          valid_until: validUntil.toISOString().slice(0, 10),
          max_uses_total: null,
          max_uses_per_customer: null,
          is_active: true,
          requires_code: true,
          is_combinable: false,
          target_type: 'all',
          is_automatic: false,
          exclude_sale_items: false,
        })
        .select()
        .single();

      if (discountError) throw discountError;

      // 3. Lier le code au client ambassadeur (customer_id remplace ambassador_id)
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? 'https://veronecollections.fr';
      const qrUrl = `${siteUrl}?ref=${codeUpper}`;

      const { error: codeError } = await supabase
        .from('ambassador_codes')
        .insert({
          // customer_id is the new FK name — cast to bypass stale types
          customer_id: (customer as unknown as { id: string }).id,
          discount_id: discount.id,
          code: codeUpper,
          qr_code_url: qrUrl,
        } as never);

      if (codeError) throw codeError;

      return customer;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Ambassadeur cree avec succes');
    },
    onError: (error: Error) => {
      console.error('[useCreateAmbassador]', error);
      if (error.message.includes('duplicate key')) {
        toast.error('Ce code ou cet email existe deja');
      } else {
        toast.error('Erreur lors de la creation');
      }
    },
  });
}

export function useToggleAmbassadorActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('individual_customers')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useCreateAmbassadorAuth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const res = await fetch('/api/ambassadors/create-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        temp_password?: string;
        email?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Erreur creation compte');
      return data;
    },
    onSuccess: async data => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(
        `Compte cree ! Mot de passe temporaire : ${data.temp_password}`,
        { duration: 15000 }
      );
    },
    onError: (error: Error) => {
      console.error('[useCreateAmbassadorAuth]', error);
      toast.error(error.message);
    },
  });
}
