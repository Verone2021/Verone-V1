'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@verone/utils';

// ============================================================
// Types
// ============================================================

export interface SourcingUrl {
  id: string;
  product_id: string;
  url: string;
  platform: string | null;
  label: string | null;
  created_at: string;
}

export interface SourcingCommunication {
  id: string;
  product_id: string;
  supplier_id: string | null;
  channel: string;
  direction: 'inbound' | 'outbound';
  summary: string;
  contact_name: string | null;
  attachments: unknown[];
  next_action: string | null;
  follow_up_date: string | null;
  is_resolved: boolean;
  communicated_at: string;
  logged_by: string | null;
  created_at: string;
}

export interface SourcingPriceEntry {
  id: string;
  product_id: string;
  supplier_id: string | null;
  price: number;
  currency: string;
  quantity: number | null;
  proposed_by: 'supplier' | 'verone' | null;
  notes: string | null;
  negotiated_at: string;
}

export interface SourcingCandidateSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  status: string;
  response_date: string | null;
  quoted_price: number | null;
  quoted_moq: number | null;
  quoted_lead_days: number | null;
  notes: string | null;
  created_at: string;
  supplier?: {
    id: string;
    trade_name: string | null;
    legal_name: string | null;
    preferred_comm_channel: string | null;
  };
}

// ============================================================
// Hook
// ============================================================

export function useSourcingNotebook(productId: string | null) {
  const [urls, setUrls] = useState<SourcingUrl[]>([]);
  const [communications, setCommunications] = useState<SourcingCommunication[]>(
    []
  );
  const [priceHistory, setPriceHistory] = useState<SourcingPriceEntry[]>([]);
  const [candidates, setCandidates] = useState<SourcingCandidateSupplier[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    const supabase = createClient();

    const [urlsRes, commsRes, pricesRes, candidatesRes] = await Promise.all([
      supabase
        .from('sourcing_urls')
        .select('id, product_id, url, platform, label, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false }),
      supabase
        .from('sourcing_communications')
        .select(
          'id, product_id, supplier_id, channel, direction, summary, contact_name, attachments, next_action, follow_up_date, is_resolved, communicated_at, logged_by, created_at'
        )
        .eq('product_id', productId)
        .order('communicated_at', { ascending: false }),
      supabase
        .from('sourcing_price_history')
        .select(
          'id, product_id, supplier_id, price, currency, quantity, proposed_by, notes, negotiated_at'
        )
        .eq('product_id', productId)
        .order('negotiated_at', { ascending: false }),
      supabase
        .from('sourcing_candidate_suppliers')
        .select(
          'id, product_id, supplier_id, status, response_date, quoted_price, quoted_moq, quoted_lead_days, notes, created_at, supplier:organisations(id, trade_name, legal_name, preferred_comm_channel)'
        )
        .eq('product_id', productId)
        .order('created_at', { ascending: false }),
    ]);

    if (urlsRes.data) setUrls(urlsRes.data as SourcingUrl[]);
    if (commsRes.data)
      setCommunications(commsRes.data as SourcingCommunication[]);
    if (pricesRes.data) setPriceHistory(pricesRes.data as SourcingPriceEntry[]);
    if (candidatesRes.data)
      setCandidates(candidatesRes.data as SourcingCandidateSupplier[]);

    setLoading(false);
  }, [productId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // ---- Mutations ----

  const addUrl = useCallback(
    async (data: { url: string; platform?: string; label?: string }) => {
      if (!productId) return;
      const supabase = createClient();
      const { error } = await supabase.from('sourcing_urls').insert({
        product_id: productId,
        ...data,
      });
      if (error) throw error;
      await fetchAll();
    },
    [productId, fetchAll]
  );

  const removeUrl = useCallback(
    async (urlId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('sourcing_urls')
        .delete()
        .eq('id', urlId);
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  const addCommunication = useCallback(
    async (data: {
      channel: string;
      direction: 'inbound' | 'outbound';
      summary: string;
      contact_name?: string;
      next_action?: string;
      follow_up_date?: string;
      supplier_id?: string;
      communicated_at?: string;
    }) => {
      if (!productId) return;
      const supabase = createClient();
      const { error } = await supabase.from('sourcing_communications').insert({
        product_id: productId,
        ...data,
      });
      if (error) throw error;
      await fetchAll();
    },
    [productId, fetchAll]
  );

  const resolveCommunication = useCallback(
    async (commId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('sourcing_communications')
        .update({ is_resolved: true })
        .eq('id', commId);
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  const addPriceEntry = useCallback(
    async (data: {
      price: number;
      currency?: string;
      quantity?: number;
      proposed_by?: 'supplier' | 'verone';
      notes?: string;
      supplier_id?: string;
    }) => {
      if (!productId) return;
      const supabase = createClient();
      const { error } = await supabase.from('sourcing_price_history').insert({
        product_id: productId,
        ...data,
      });
      if (error) throw error;
      await fetchAll();
    },
    [productId, fetchAll]
  );

  const addCandidateSupplier = useCallback(
    async (data: {
      supplier_id: string;
      quoted_price?: number;
      quoted_moq?: number;
      quoted_lead_days?: number;
      notes?: string;
    }) => {
      if (!productId) return;
      const supabase = createClient();
      const { error } = await supabase
        .from('sourcing_candidate_suppliers')
        .insert({
          product_id: productId,
          ...data,
        });
      if (error) throw error;
      await fetchAll();
    },
    [productId, fetchAll]
  );

  const updateCandidateStatus = useCallback(
    async (candidateId: string, status: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('sourcing_candidate_suppliers')
        .update({ status })
        .eq('id', candidateId);
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  const updateSourcingPipeline = useCallback(
    async (data: {
      sourcing_status?: string;
      sourcing_priority?: string;
      sourcing_tags?: string[];
      target_price?: number;
      sourcing_notes?: string;
    }) => {
      if (!productId) return;
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', productId);
      if (error) throw error;
    },
    [productId]
  );

  return {
    urls,
    communications,
    priceHistory,
    candidates,
    loading,
    refetch: fetchAll,
    // Mutations
    addUrl,
    removeUrl,
    addCommunication,
    resolveCommunication,
    addPriceEntry,
    addCandidateSupplier,
    updateCandidateStatus,
    updateSourcingPipeline,
  };
}
