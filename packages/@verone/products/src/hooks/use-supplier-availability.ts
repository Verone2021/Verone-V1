'use client';

import { useState, useCallback, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type SupplierAvailabilityStatus =
  | 'available'
  | 'unavailable'
  | 'to_check';

export interface SupplierAvailabilityState {
  status: SupplierAvailabilityStatus;
  lastCheckedAt: string | null;
  lastCheckedBy: string | null;
  notes: string | null;
  supplierPageUrl: string | null;
  productStatus: 'active' | 'preorder' | 'discontinued' | 'draft';
  /** Nombre de jours depuis la dernière vérification (null si jamais vérifié) */
  daysSinceCheck: number | null;
  /** true si daysSinceCheck >= 90 ou jamais vérifié */
  needsRecheck: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export interface UpdateStatusOptions {
  notes?: string | null;
  /** Si true, passe aussi product_status à 'discontinued' et min_stock à 0 */
  alsoMarkDiscontinued?: boolean;
}

export interface UseSupplierAvailabilityReturn
  extends SupplierAvailabilityState {
  updateStatus: (
    next: SupplierAvailabilityStatus,
    options?: UpdateStatusOptions
  ) => Promise<void>;
  setUrl: (url: string | null) => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSupplierAvailability(
  productId: string
): UseSupplierAvailabilityReturn {
  const supabase = createClient();

  const [state, setState] = useState<SupplierAvailabilityState>({
    status: 'to_check',
    lastCheckedAt: null,
    lastCheckedBy: null,
    notes: null,
    supplierPageUrl: null,
    productStatus: 'active',
    daysSinceCheck: null,
    needsRecheck: true,
    loading: true,
    saving: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));

    const { data, error: fetchError } = await supabase
      .from('products')
      .select(
        'product_status, supplier_page_url, supplier_availability_status, supplier_last_checked_at, supplier_last_checked_by, supplier_availability_notes'
      )
      .eq('id', productId)
      .single();

    if (fetchError || !data) {
      setState(s => ({
        ...s,
        loading: false,
        error: fetchError?.message ?? 'Produit introuvable',
      }));
      return;
    }

    const checkedAt = data.supplier_last_checked_at ?? null;
    let daysSinceCheck: number | null = null;
    if (checkedAt) {
      const diffMs = Date.now() - new Date(checkedAt).getTime();
      daysSinceCheck = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
    const needsRecheck =
      checkedAt === null || (daysSinceCheck !== null && daysSinceCheck >= 90);

    setState({
      status: (data.supplier_availability_status ??
        'to_check') as SupplierAvailabilityStatus,
      lastCheckedAt: checkedAt,
      lastCheckedBy: data.supplier_last_checked_by ?? null,
      notes: data.supplier_availability_notes ?? null,
      supplierPageUrl: data.supplier_page_url ?? null,
      productStatus: data.product_status,
      daysSinceCheck,
      needsRecheck,
      loading: false,
      saving: false,
      error: null,
    });
  }, [productId, supabase]);

  useEffect(() => {
    void refresh().catch(err =>
      console.error('[useSupplierAvailability] refresh failed:', err)
    );
  }, [refresh]);

  const updateStatus = useCallback(
    async (
      next: SupplierAvailabilityStatus,
      options: UpdateStatusOptions = {}
    ) => {
      setState(s => ({ ...s, saving: true, error: null }));

      const { data: userData } = await supabase.auth.getUser();
      const userId: string | null = userData?.user?.id ?? null;
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('products')
        .update({
          supplier_availability_status: next,
          supplier_availability_notes:
            options.notes !== undefined ? options.notes : null,
          supplier_last_checked_at: now,
          supplier_last_checked_by: userId,
        })
        .eq('id', productId);

      if (updateError) {
        setState(s => ({ ...s, saving: false, error: updateError.message }));
        return;
      }

      if (options.alsoMarkDiscontinued) {
        const { error: statusError } = await supabase
          .from('products')
          .update({ product_status: 'discontinued', min_stock: 0 })
          .eq('id', productId);

        if (statusError) {
          setState(s => ({ ...s, saving: false, error: statusError.message }));
          return;
        }
      }

      await refresh();
    },
    [productId, refresh, supabase]
  );

  const setUrl = useCallback(
    async (url: string | null) => {
      setState(s => ({ ...s, saving: true, error: null }));

      const { error: updateError } = await supabase
        .from('products')
        .update({ supplier_page_url: url })
        .eq('id', productId);

      if (updateError) {
        setState(s => ({ ...s, saving: false, error: updateError.message }));
        return;
      }

      await refresh();
    },
    [productId, refresh, supabase]
  );

  return { ...state, updateStatus, setUrl, refresh };
}
