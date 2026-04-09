'use client';

import { useState, useEffect, useCallback } from 'react';

import type { Organisation } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

const SINGLE_ORG_COLUMNS = `
  id, legal_name, trade_name, has_different_trade_name, type, email, phone, country,
  is_active, is_enseigne_parent, is_service_provider, enseigne_id, ownership_type,
  address_line1, address_line2, city, postal_code, region, latitude, longitude,
  billing_address_line1, billing_address_line2, billing_city, billing_postal_code, billing_region, billing_country,
  shipping_address_line1, shipping_address_line2, shipping_city, shipping_postal_code, shipping_region, shipping_country,
  has_different_shipping_address, customer_type, prepayment_required, payment_terms, payment_terms_type, payment_terms_notes,
  siren, siret, vat_number, legal_form, logo_url, notes, currency, default_vat_rate, default_channel_id,
  delivery_time_days, minimum_order_amount, preferred_supplier, rating, supplier_segment, certification_labels,
  industry_sector, linkme_code, secondary_email, website, source, source_type, source_affiliate_id,
  show_on_linkme_globe, approval_status, approved_at, approved_by,
  archived_at, created_at, created_by, updated_at,
  enseigne:enseignes(name)
`;

export function useOrganisation(id: string) {
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const supabase = createClient();

  const refetch = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchOrganisation = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('organisations')
          .select(SINGLE_ORG_COLUMNS)
          .eq('id', id)
          .single();

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        const orgWithName = {
          ...data,
          name: data.trade_name ?? data.legal_name,
        } as unknown as Organisation;

        // Add product counts if supplier
        if (data.type === 'supplier') {
          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('supplier_id', data.id);

          orgWithName._count = {
            products: productsCount ?? 0,
          };
        }

        setOrganisation(orgWithName);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    void fetchOrganisation().catch((error: unknown) => {
      console.error('[useOrganisationById] Fetch failed:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client is stable singleton
  }, [id, refreshKey]);

  return { organisation, loading, error, refetch };
}
