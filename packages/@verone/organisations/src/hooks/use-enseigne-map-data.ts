'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

/**
 * Organisation avec données géographiques pour affichage sur carte
 */
export interface MapOrganisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  ownership_type: 'propre' | 'franchise' | 'succursale' | null;
  phone: string | null;
  email: string | null;
  shipping_address_line1: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  logo_url: string | null;
  is_active: boolean | null;
}

export interface EnseigneMapData {
  organisations: MapOrganisation[];
  totalOrganisations: number;
  propresCount: number;
  franchisesCount: number;
  withCoordinatesCount: number;
}

/**
 * Hook pour récupérer les organisations d'une enseigne avec données géographiques
 */
export function useEnseigneMapData(enseigneId: string | null) {
  const [data, setData] = useState<EnseigneMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!enseigneId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: organisations, error: orgsError } = await supabase
        .from('organisations')
        .select(
          'id, legal_name, trade_name, city, latitude, longitude, ownership_type, phone, email, shipping_address_line1, shipping_postal_code, shipping_city, logo_url, is_active'
        )
        .eq('enseigne_id', enseigneId)
        .order('legal_name', { ascending: true });

      if (orgsError) throw orgsError;

      const orgs = (organisations ?? []) as MapOrganisation[];
      const propresCount = orgs.filter(
        o => o.ownership_type === 'propre' || o.ownership_type === 'succursale'
      ).length;
      const franchisesCount = orgs.filter(
        o => o.ownership_type === 'franchise'
      ).length;
      const withCoordinatesCount = orgs.filter(
        o => o.latitude !== null && o.longitude !== null
      ).length;

      setData({
        organisations: orgs,
        totalOrganisations: orgs.length,
        propresCount,
        franchisesCount,
        withCoordinatesCount,
      });
    } catch (err) {
      console.error('[useEnseigneMapData] Error:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      );
    } finally {
      setLoading(false);
    }
  }, [enseigneId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
