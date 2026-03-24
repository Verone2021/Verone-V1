'use client';

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

interface LinkedConsultation {
  id: string;
  consultation_id: string;
  quantity: number;
  proposed_price: number | null;
  created_at: string;
  consultation: {
    id: string;
    descriptif: string;
    status: string;
    priority_level: number;
    created_at: string;
    enseigne: { name: string } | null;
    organisation: { legal_name: string; trade_name: string | null } | null;
  };
}

export function useProductConsultations(productId?: string) {
  const [linkedConsultations, setLinkedConsultations] = useState<
    LinkedConsultation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinkedConsultations = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('consultation_products')
        .select(
          `
            id,
            consultation_id,
            quantity,
            proposed_price,
            created_at,
            consultation:client_consultations(
              id,
              descriptif,
              status,
              priority_level,
              created_at,
              enseigne:enseignes(name),
              organisation:organisations(legal_name, trade_name)
            )
          `
        )
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setLinkedConsultations((data || []) as unknown as LinkedConsultation[]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des consultations liées';
      setError(message);
      console.error('Erreur fetchLinkedConsultations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (productId) {
      return fetchLinkedConsultations(productId);
    }
    return Promise.resolve();
  }, [productId, fetchLinkedConsultations]);

  useEffect(() => {
    if (productId) {
      void fetchLinkedConsultations(productId);
    }
  }, [productId, fetchLinkedConsultations]);

  return {
    linkedConsultations,
    loading,
    error,
    refetch,
  };
}
