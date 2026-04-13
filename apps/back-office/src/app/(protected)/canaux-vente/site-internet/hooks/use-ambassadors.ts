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
  ambassador_id: string;
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
  ambassador_id: string;
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
// Queries
// ============================================

const QUERY_KEY = ['site-ambassadors'];

export function useAmbassadors() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();

      // Fetch ambassadors
      const { data: ambassadors, error } = await supabase
        .from('site_ambassadors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!ambassadors || ambassadors.length === 0) return [] as Ambassador[];

      // Fetch codes separately (avoids PostgREST relation issues)
      const ids = ambassadors.map(a => a.id);
      const { data: codes } = await supabase
        .from('ambassador_codes')
        .select('*')
        .in('ambassador_id', ids);

      // Merge codes into ambassadors
      const codesByAmbassador = new Map<string, AmbassadorCode[]>();
      for (const code of (codes ?? []) as AmbassadorCode[]) {
        const existing = codesByAmbassador.get(code.ambassador_id) ?? [];
        existing.push(code);
        codesByAmbassador.set(code.ambassador_id, existing);
      }

      return (ambassadors as Ambassador[]).map(a => ({
        ...a,
        codes: codesByAmbassador.get(a.id) ?? [],
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
        .from('site_ambassadors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const { data: codes } = await supabase
        .from('ambassador_codes')
        .select('*')
        .eq('ambassador_id', id);

      return {
        ...(data as Ambassador),
        codes: (codes ?? []) as AmbassadorCode[],
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
        .eq('ambassador_id', ambassadorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AmbassadorAttribution[];
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

      // 1. Creer l'ambassadeur
      const { data: ambassador, error: ambassadorError } = await supabase
        .from('site_ambassadors')
        .insert({
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email,
          phone: input.phone ?? null,
          commission_rate: input.commission_rate,
          discount_rate: input.discount_rate,
          notes: input.notes ?? null,
          iban: input.iban ?? null,
          bic: input.bic ?? null,
          bank_name: input.bank_name ?? null,
          account_holder_name: input.account_holder_name ?? null,
          siret: input.siret ?? null,
        })
        .select()
        .single();

      if (ambassadorError) throw ambassadorError;

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

      // 3. Lier le code a l'ambassadeur
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? 'https://veronecollections.fr';
      const qrUrl = `${siteUrl}?ref=${codeUpper}`;

      const { error: codeError } = await supabase
        .from('ambassador_codes')
        .insert({
          ambassador_id: ambassador.id,
          discount_id: discount.id,
          code: codeUpper,
          qr_code_url: qrUrl,
        });

      if (codeError) throw codeError;

      return ambassador;
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
        .from('site_ambassadors')
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
    mutationFn: async (ambassadorId: string) => {
      const res = await fetch('/api/ambassadors/create-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ambassador_id: ambassadorId }),
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
