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

/**
 * Entrée du journal sourcing (BO-SOURCING-P3-001) :
 * exchange = échange fournisseur (canal et sens obligatoires) · note = note
 * interne · status_change = écrit uniquement par apply_product_lifecycle_action.
 */
export type SourcingJournalEntryType = 'exchange' | 'note' | 'status_change';

export interface SourcingCommunication {
  id: string;
  product_id: string;
  supplier_id: string | null;
  entry_type: SourcingJournalEntryType;
  channel: string | null;
  direction: 'inbound' | 'outbound' | null;
  from_status: string | null;
  to_status: string | null;
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

/** Ajout depuis l'écran : échange fournisseur ou note interne. */
export type NewSourcingJournalEntry =
  | {
      entry_type?: 'exchange';
      channel: string;
      direction: 'inbound' | 'outbound';
      summary: string;
      contact_name?: string;
      next_action?: string;
      follow_up_date?: string;
      supplier_id?: string;
      communicated_at?: string;
    }
  | {
      entry_type: 'note';
      summary: string;
      next_action?: string;
      follow_up_date?: string;
    };

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
  /** Frais annoncés par le fournisseur (BO-SOURCING-OFFRES-004). */
  quoted_shipping_ht: number | null;
  quoted_customs_ht: number | null;
  quoted_currency: string;
  /** Les frais valent pour le lot (`per_order`) ou par unité (`per_unit`). */
  shipping_scope: 'per_order' | 'per_unit';
  notes: string | null;
  created_at: string;
  supplier?: {
    id: string;
    trade_name: string | null;
    legal_name: string | null;
    preferred_comm_channel: string | null;
  };
}

/** Champs d'une offre fournisseur saisis à l'écran. */
export interface SourcingOfferInput {
  quoted_price?: number | null;
  quoted_moq?: number | null;
  quoted_lead_days?: number | null;
  quoted_shipping_ht?: number | null;
  quoted_customs_ht?: number | null;
  quoted_currency?: string;
  shipping_scope?: 'per_order' | 'per_unit';
  notes?: string | null;
}

// ============================================================
// Hook
// ============================================================

export interface SourcingPhoto {
  id: string;
  product_id: string;
  public_url: string | null;
  storage_path: string;
  photo_type: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export function useSourcingNotebook(productId: string | null) {
  const [urls, setUrls] = useState<SourcingUrl[]>([]);
  const [communications, setCommunications] = useState<SourcingCommunication[]>(
    []
  );
  const [priceHistory, setPriceHistory] = useState<SourcingPriceEntry[]>([]);
  const [candidates, setCandidates] = useState<SourcingCandidateSupplier[]>([]);
  const [photos, setPhotos] = useState<SourcingPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    const supabase = createClient();

    const [urlsRes, commsRes, pricesRes, candidatesRes, photosRes] =
      await Promise.all([
        supabase
          .from('sourcing_urls')
          .select('id, product_id, url, platform, label, created_at')
          .eq('product_id', productId)
          .order('created_at', { ascending: false }),
        supabase
          .from('sourcing_communications')
          .select(
            'id, product_id, supplier_id, entry_type, channel, direction, from_status, to_status, summary, contact_name, attachments, next_action, follow_up_date, is_resolved, communicated_at, logged_by, created_at'
          )
          .eq('product_id', productId)
          .order('communicated_at', { ascending: false })
          .limit(200),
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
            'id, product_id, supplier_id, status, response_date, quoted_price, quoted_moq, quoted_lead_days, quoted_shipping_ht, quoted_customs_ht, quoted_currency, shipping_scope, notes, created_at, supplier:organisations(id, trade_name, legal_name, preferred_comm_channel)'
          )
          .eq('product_id', productId)
          .order('created_at', { ascending: false }),
        supabase
          .from('sourcing_photos')
          .select(
            'id, product_id, public_url, storage_path, photo_type, caption, sort_order, created_at'
          )
          .eq('product_id', productId)
          .order('sort_order', { ascending: true }),
      ]);

    if (urlsRes.data) setUrls(urlsRes.data as SourcingUrl[]);
    if (commsRes.data)
      setCommunications(commsRes.data as SourcingCommunication[]);
    if (pricesRes.data) setPriceHistory(pricesRes.data as SourcingPriceEntry[]);
    if (candidatesRes.data)
      setCandidates(candidatesRes.data as SourcingCandidateSupplier[]);
    if (photosRes.data) setPhotos(photosRes.data as SourcingPhoto[]);

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
    async (data: NewSourcingJournalEntry) => {
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

  /** Champs d'une offre modifiables depuis l'écran. */
  const addCandidateSupplier = useCallback(
    async (data: SourcingOfferInput & { supplier_id: string }) => {
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

  const updateCandidateOffer = useCallback(
    async (candidateId: string, data: SourcingOfferInput) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('sourcing_candidate_suppliers')
        .update(data)
        .eq('id', candidateId);
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  const updateCandidateStatus = useCallback(
    async (candidateId: string, status: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('sourcing_candidate_suppliers')
        .update({
          status,
          // « Devis reçu » date la réponse si elle ne l'était pas déjà.
          ...(status === 'responded'
            ? { response_date: new Date().toISOString() }
            : {}),
        })
        .eq('id', candidateId);
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  /**
   * Passe plusieurs offres au même statut (« marquer contactés » de l'étape
   * Contact). Une seule écriture, un seul rechargement.
   */
  const updateCandidateStatuses = useCallback(
    async (candidateIds: string[], status: string) => {
      if (candidateIds.length === 0) return;
      const supabase = createClient();
      const { error } = await supabase
        .from('sourcing_candidate_suppliers')
        .update({ status })
        .in('id', candidateIds);
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  // Priorité seule : le statut sourcing passe exclusivement par
  // apply_product_lifecycle_action (useSourcingLifecycle).
  const updatePriority = useCallback(
    async (priority: string) => {
      if (!productId) return;
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({ sourcing_priority: priority })
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
    photos,
    loading,
    refetch: fetchAll,
    // Mutations
    addUrl,
    removeUrl,
    addCommunication,
    resolveCommunication,
    addPriceEntry,
    addCandidateSupplier,
    updateCandidateOffer,
    updateCandidateStatus,
    updateCandidateStatuses,
    updatePriority,
  };
}
