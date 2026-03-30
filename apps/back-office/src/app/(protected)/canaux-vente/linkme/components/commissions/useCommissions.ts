'use client';

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

import type {
  AffiliateOption,
  Commission,
  CommissionWithAffiliate,
} from './types';

export function useCommissions() {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('linkme_commissions')
        .select('*, affiliate:linkme_affiliates(display_name)')
        .order('created_at', { ascending: false })
        .returns<CommissionWithAffiliate[]>();

      if (commissionsError) throw commissionsError;

      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('linkme_affiliates')
        .select('id, display_name')
        .returns<AffiliateOption[]>();

      if (affiliatesError) throw affiliatesError;

      setCommissions(commissionsData ?? []);
      setAffiliates(affiliatesData ?? []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useCommissions] Fetch failed:', message);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchData().catch(error => {
      console.error('[useCommissions] Initial fetch failed:', error);
    });
  }, [fetchData]);

  async function handleValidate(ids: string[]) {
    const supabase = createClient();
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('linkme_commissions')
        .update({ status: 'validated', validated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `${ids.length} commission(s) validée(s)`,
      });
      void fetchData().catch(error => {
        console.error('[useCommissions] Fetch after validate failed:', error);
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useCommissions] Validate failed:', message);
      toast({
        title: 'Erreur',
        description: 'Impossible de valider les commissions',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleMarkPaid(ids: string[]) {
    const supabase = createClient();
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('linkme_commissions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `${ids.length} commission(s) marquée(s) comme payée(s)`,
      });
      void fetchData().catch(error => {
        console.error('[useCommissions] Fetch after mark paid failed:', error);
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useCommissions] Mark paid failed:', message);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer les commissions comme payées',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  return {
    commissions,
    affiliates,
    loading,
    processing,
    handleValidate,
    handleMarkPaid,
  };
}
