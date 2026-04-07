'use client';

import { useState, useEffect, useMemo } from 'react';

import type { Organisation } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

// Re-export Organisation pour backward compatibility
export type { Organisation };

export type {
  OrganisationFilters,
  CreateOrganisationData,
  UpdateOrganisationData,
} from './organisations.types';
export {
  getOrganisationDisplayName,
  getOrganisationCardName,
  useSuppliers,
  useCustomers,
} from './organisations.display';
export { useOrganisation } from './use-organisation-single';

import { ORGANISATION_COLUMNS } from './organisations.constants';
import { buildOrganisationsOps } from './use-organisations-crud';
import type { OrganisationFilters } from './organisations.types';

export function useOrganisations(filters?: OrganisationFilters) {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchOrganisations = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('organisations')
        .select(ORGANISATION_COLUMNS)
        .order('legal_name', { ascending: true });

      if (filters?.type) query = query.eq('type', filters.type);

      if (filters?.is_service_provider !== undefined) {
        if (filters.is_service_provider === true) {
          query = query.eq('is_service_provider', true);
        } else {
          query = query.or(
            'is_service_provider.eq.false,is_service_provider.is.null'
          );
        }
      }

      if (filters?.is_active !== undefined)
        query = query.eq('is_active', filters.is_active);
      if (filters?.country) query = query.eq('country', filters.country);

      if (filters?.search) {
        query = query.or(
          `legal_name.ilike.%${filters.search}%,trade_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      if (
        filters?.type === 'customer' &&
        filters?.customer_type &&
        filters.customer_type !== 'all'
      ) {
        if (filters.customer_type === 'professional') {
          query = query.or(
            'customer_type.is.null,customer_type.eq.professional'
          );
        } else if (filters.customer_type === 'individual') {
          query = query.eq('customer_type', 'individual');
        }
      }

      if (!filters?.include_archived) query = query.is('archived_at', null);
      if (filters?.exclude_with_enseigne) query = query.is('enseigne_id', null);

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      const organisationsWithName = (data ?? []).map(org => ({
        ...org,
        name: org.trade_name ?? org.legal_name,
      }));

      let organisationsWithCounts = organisationsWithName;
      const suppliers = organisationsWithName.filter(
        org => org.type === 'supplier'
      );

      if (suppliers.length > 0) {
        const supplierIds = suppliers.map(s => s.id);
        const { data: productCounts } = await supabase
          .from('products')
          .select('supplier_id')
          .in('supplier_id', supplierIds);

        const countsMap = new Map<string, number>();
        productCounts?.forEach(p => {
          const supplierId = String(p.supplier_id);
          countsMap.set(supplierId, (countsMap.get(supplierId) ?? 0) + 1);
        });

        organisationsWithCounts = organisationsWithName.map(org => {
          if (org.type === 'supplier') {
            return { ...org, _count: { products: countsMap.get(org.id) ?? 0 } };
          }
          return org;
        });
      }

      setOrganisations(organisationsWithCounts as unknown as Organisation[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrganisations().catch((error: unknown) => {
      console.error('[useOrganisations] Fetch failed:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchOrganisations is defined inside component, adding it causes infinite loop
  }, [
    filters?.type,
    filters?.is_active,
    filters?.search,
    filters?.country,
    filters?.include_archived,
    filters?.exclude_with_enseigne,
    filters?.is_service_provider,
    filters?.customer_type,
  ]);

  const ops = buildOrganisationsOps({
    supabase,
    refetch: fetchOrganisations,
    setError,
    getOrganisations: () => organisations,
  });

  return {
    organisations,
    loading,
    error,
    refetch: fetchOrganisations,
    ...ops,
  };
}
