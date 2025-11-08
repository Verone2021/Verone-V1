'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';

export type CustomerType = 'professional' | 'individual';

export interface UnifiedCustomer {
  id: string;
  type: CustomerType;
  displayName: string;
  email: string | null;

  // Données spécifiques selon le type
  // Pour professional (organisations)
  name?: string;
  siret?: string | null;
  vat_number?: string | null;
  billing_address_line1?: string | null;
  billing_city?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  shipping_address_line1?: string | null;
  shipping_city?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  has_different_shipping_address?: boolean | null;

  // Pour individual
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  region?: string | null;
  country?: string | null;
  billing_address_line1_individual?: string | null;
  billing_city_individual?: string | null;
  billing_postal_code_individual?: string | null;
  billing_country_individual?: string | null;
  has_different_billing_address?: boolean | null;
}

export interface CustomerFilters {
  customerType?: CustomerType | 'all';
  search?: string;
  is_active?: boolean;
}

export function useCustomers(filters?: CustomerFilters) {
  const [customers, setCustomers] = useState<UnifiedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);

    // 🔧 FIX: Reset customers array immediately when starting fetch
    setCustomers([]);

    try {
      let allCustomers: UnifiedCustomer[] = [];

      // 🔧 FIX: Make type filtering exclusive and explicit
      const customerType = filters?.customerType;

      // Récupérer les clients professionnels (organisations)
      if (
        !customerType ||
        customerType === 'all' ||
        customerType === 'professional'
      ) {
        let orgQuery = supabase
          .from('organisations')
          .select('*')
          .eq('type', 'customer')
          .eq('is_active', filters?.is_active ?? true)
          .is('archived_at', null)
          .order('legal_name', { ascending: true });

        // Filtre de recherche pour organisations (legal_name + trade_name + email)
        if (filters?.search) {
          orgQuery = orgQuery.or(
            `legal_name.ilike.%${filters.search}%,trade_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
          );
        }

        const { data: orgData, error: orgError } = await orgQuery;

        if (orgError) {
          console.error('Erreur organisations:', orgError);
          throw orgError;
        }

        // Transformer les organisations en UnifiedCustomer
        const professionalCustomers: UnifiedCustomer[] = (orgData || []).map(
          org => ({
            id: org.id,
            type: 'professional' as CustomerType,
            displayName: getOrganisationDisplayName(org),
            email: org.email,
            name: getOrganisationDisplayName(org),
            siret: org.siret,
            vat_number: org.vat_number,
            billing_address_line1: org.billing_address_line1,
            billing_city: org.billing_city,
            billing_postal_code: org.billing_postal_code,
            billing_country: org.billing_country,
            shipping_address_line1: org.shipping_address_line1,
            shipping_city: org.shipping_city,
            shipping_postal_code: org.shipping_postal_code,
            shipping_country: org.shipping_country,
            has_different_shipping_address: org.has_different_shipping_address,
          })
        );

        allCustomers = [...allCustomers, ...professionalCustomers];
        console.log(
          `🏢 Organisations chargées: ${professionalCustomers.length}`
        );
      }

      // Récupérer les clients particuliers (individual_customers)
      if (
        !customerType ||
        customerType === 'all' ||
        customerType === 'individual'
      ) {
        let individualQuery = supabase
          .from('individual_customers')
          .select('*')
          .eq('is_active', filters?.is_active ?? true)
          .order('last_name', { ascending: true });

        // Filtre de recherche pour particuliers
        if (filters?.search) {
          individualQuery = individualQuery.or(
            `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
          );
        }

        const { data: individualData, error: individualError } =
          await individualQuery;

        if (individualError) {
          console.error('Erreur individual_customers:', individualError);
          throw individualError;
        }

        // Transformer les particuliers en UnifiedCustomer
        const individualCustomers: UnifiedCustomer[] = (
          individualData || []
        ).map(individual => ({
          id: individual.id,
          type: 'individual' as CustomerType,
          displayName:
            `${individual.first_name || ''} ${individual.last_name || ''}`.trim() ||
            'Client particulier',
          email: individual.email,
          first_name: individual.first_name,
          last_name: individual.last_name,
          phone: individual.phone,
          address_line1: individual.address_line1,
          address_line2: individual.address_line2,
          city: individual.city,
          postal_code: individual.postal_code,
          region: individual.region,
          country: individual.country,
          billing_address_line1_individual: individual.billing_address_line1,
          billing_city_individual: individual.billing_city,
          billing_postal_code_individual: individual.billing_postal_code,
          billing_country_individual: individual.billing_country,
          has_different_billing_address:
            individual.has_different_billing_address,
        }));

        allCustomers = [...allCustomers, ...individualCustomers];
        console.log(`👤 Particuliers chargés: ${individualCustomers.length}`);
      }

      // Trier par nom d'affichage
      allCustomers.sort((a, b) => a.displayName.localeCompare(b.displayName));

      console.log(
        `✅ Total clients chargés: ${allCustomers.length} (type: ${customerType || 'all'})`
      );
      setCustomers(allCustomers);
    } catch (err) {
      console.error('Erreur fetchCustomers:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      `🔄 useCustomers: customerType=${filters?.customerType}, search=${filters?.search}`
    );
    fetchCustomers();
  }, [filters?.customerType, filters?.search, filters?.is_active]);

  const getCustomerById = async (
    id: string,
    type: CustomerType
  ): Promise<UnifiedCustomer | null> => {
    try {
      if (type === 'professional') {
        const { data, error } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', id)
          .eq('type', 'customer')
          .single();

        if (error) throw error;

        return {
          id: data.id,
          type: 'professional',
          displayName: getOrganisationDisplayName(data),
          email: data.email,
          name: getOrganisationDisplayName(data),
          siret: data.siret,
          vat_number: data.vat_number,
          billing_address_line1: data.billing_address_line1,
          billing_city: data.billing_city,
          billing_postal_code: data.billing_postal_code,
          billing_country: data.billing_country,
          shipping_address_line1: data.shipping_address_line1,
          shipping_city: data.shipping_city,
          shipping_postal_code: data.shipping_postal_code,
          shipping_country: data.shipping_country,
          has_different_shipping_address: data.has_different_shipping_address,
        };
      } else {
        const { data, error } = await supabase
          .from('individual_customers')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        return {
          id: data.id,
          type: 'individual',
          displayName:
            `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          address_line1: data.address_line1,
          address_line2: data.address_line2,
          city: data.city,
          postal_code: data.postal_code,
          region: data.region,
          country: data.country,
          billing_address_line1_individual: data.billing_address_line1,
          billing_city_individual: data.billing_city,
          billing_postal_code_individual: data.billing_postal_code,
          billing_country_individual: data.billing_country,
          has_different_billing_address: data.has_different_billing_address,
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du client:', error);
      return null;
    }
  };

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    getCustomerById,
  };
}
