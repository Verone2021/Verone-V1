'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Organisation } from '@verone/types';

import { ORGANISATION_COLUMNS } from './organisations.constants';
import type {
  CreateOrganisationData,
  UpdateOrganisationData,
} from './organisations.types';

interface CRUDOpsParams {
  supabase: SupabaseClient;
  refetch: () => Promise<void>;
  setError: (e: string | null) => void;
  getOrganisations: () => Organisation[];
}

export function buildOrganisationsOps({
  supabase,
  refetch,
  setError,
  getOrganisations,
}: CRUDOpsParams) {
  const getOrganisationById = async (
    id: string
  ): Promise<Organisation | null> => {
    if (!id || id.trim() === '') return null;

    try {
      const { data, error } = await supabase
        .from('organisations')
        .select(ORGANISATION_COLUMNS)
        .eq('id', id)
        .single();

      if (error?.code === 'PGRST116') return null;
      if (error) throw error;

      if (data) {
        const org = data as unknown as Organisation;
        return { ...org, name: org.trade_name ?? org.legal_name };
      }
      return null;
    } catch (error) {
      const pgError = error as {
        code?: string;
        message?: string | Error;
        details?: string;
      };
      const errorMessage =
        pgError?.message instanceof Error
          ? pgError.message.message
          : (pgError?.message ?? (error instanceof Error ? error.message : ''));

      if (
        (error instanceof Error && error.message.includes('fetch')) ||
        (typeof errorMessage === 'string' &&
          (errorMessage.includes('fetch') ||
            errorMessage.includes('network') ||
            errorMessage.includes('timeout')))
      ) {
        return null;
      }
      if (pgError?.code === 'PGRST116') return null;
      const hasContent = errorMessage ?? pgError?.code ?? pgError?.details;
      if (!hasContent) return null;

      console.error("Erreur lors de la récupération de l'organisation:", {
        message: errorMessage ?? 'Erreur inconnue',
        code: pgError?.code,
        details: error,
      });
      return null;
    }
  };

  const createOrganisation = async (
    data: CreateOrganisationData
  ): Promise<Organisation | null> => {
    try {
      const { data: newOrg, error } = await supabase
        .from('organisations')
        .insert([
          {
            legal_name: data.legal_name,
            trade_name: data.trade_name ?? null,
            has_different_trade_name: data.has_different_trade_name ?? false,
            type: data.type,
            email: data.email ?? null,
            phone: data.phone ?? null,
            country: data.country ?? 'FR',
            is_active: data.is_active ?? true,
            website: data.website ?? null,
            siren: data.siren ?? null,
            siret: data.siret ?? null,
            vat_number: data.vat_number ?? null,
            legal_form: data.legal_form ?? null,
            billing_address_line1: data.billing_address_line1 ?? null,
            billing_address_line2: data.billing_address_line2 ?? null,
            billing_postal_code: data.billing_postal_code ?? null,
            billing_city: data.billing_city ?? null,
            billing_region: data.billing_region ?? null,
            billing_country: data.billing_country ?? 'FR',
            shipping_address_line1: data.shipping_address_line1 ?? null,
            shipping_address_line2: data.shipping_address_line2 ?? null,
            shipping_postal_code: data.shipping_postal_code ?? null,
            shipping_city: data.shipping_city ?? null,
            shipping_region: data.shipping_region ?? null,
            shipping_country: data.shipping_country ?? 'FR',
            has_different_shipping_address:
              data.has_different_shipping_address ?? false,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            customer_type: data.customer_type ?? null,
            prepayment_required: data.prepayment_required ?? false,
            enseigne_id: data.enseigne_id ?? null,
            ownership_type: data.ownership_type ?? null,
            secondary_email: data.secondary_email ?? null,
            notes: data.notes ?? null,
            industry_sector: data.industry_sector ?? null,
            payment_terms: data.payment_terms ?? null,
            supplier_segment: data.supplier_segment ?? null,
          },
        ])
        .select(ORGANISATION_COLUMNS)
        .single();

      if (error) {
        setError(error.message);
        return null;
      }

      await refetch();

      if (newOrg) {
        const org = newOrg as unknown as Organisation;
        return { ...org, name: org.trade_name ?? org.legal_name };
      }
      return null;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la création'
      );
      return null;
    }
  };

  const updateOrganisation = async (
    data: UpdateOrganisationData
  ): Promise<Organisation | null> => {
    try {
      const validData: Database['public']['Tables']['organisations']['Update'] =
        {};

      const allowedFields = [
        'legal_name',
        'trade_name',
        'has_different_trade_name',
        'type',
        'email',
        'country',
        'is_active',
        'siren',
        'siret',
        'vat_number',
        'legal_form',
        'billing_address_line1',
        'billing_address_line2',
        'billing_postal_code',
        'billing_city',
        'billing_region',
        'billing_country',
        'shipping_address_line1',
        'shipping_address_line2',
        'shipping_postal_code',
        'shipping_city',
        'shipping_region',
        'shipping_country',
        'has_different_shipping_address',
        'latitude',
        'longitude',
        'customer_type',
        'prepayment_required',
        'enseigne_id',
        'ownership_type',
        'phone',
        'website',
        'secondary_email',
        'notes',
        'industry_sector',
        'payment_terms',
        'supplier_segment',
      ];

      allowedFields.forEach(field => {
        const key = field as keyof UpdateOrganisationData;
        if (key in data && data[key] !== undefined) {
          (validData as Record<string, unknown>)[key] = data[key];
        }
      });

      const { data: updatedOrg, error } = await supabase
        .from('organisations')
        .update(validData)
        .eq('id', data.id)
        .select(ORGANISATION_COLUMNS)
        .single();

      if (error) {
        setError(error.message);
        return null;
      }

      await refetch();

      if (updatedOrg) {
        const org = updatedOrg as unknown as Organisation;
        return { ...org, name: org.trade_name ?? org.legal_name };
      }
      return null;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      );
      return null;
    }
  };

  const deleteOrganisation = async (id: string): Promise<boolean> => {
    try {
      const { count: linkedUsersCount, error: checkError } = await supabase
        .from('user_app_roles')
        .select('*', { count: 'exact', head: true })
        .eq('organisation_id', id)
        .eq('is_active', true);

      if (checkError) {
        console.warn('Erreur verification users lies:', checkError);
      } else if (linkedUsersCount && linkedUsersCount > 0) {
        setError(
          `Impossible de supprimer : ${linkedUsersCount} utilisateur(s) y sont rattaches. ` +
            `Veuillez d'abord archiver l'organisation ou retirer les utilisateurs.`
        );
        return false;
      }

      const { error } = await supabase
        .from('organisations')
        .delete()
        .eq('id', id);

      if (error) {
        setError(error.message);
        return false;
      }
      await refetch();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la suppression'
      );
      return false;
    }
  };

  const toggleOrganisationStatus = async (id: string): Promise<boolean> => {
    try {
      const org = getOrganisations().find(o => o.id === id);
      if (!org) return false;

      const { error } = await supabase
        .from('organisations')
        .update({ is_active: !org.is_active })
        .eq('id', id);

      if (error) {
        setError(error.message);
        return false;
      }
      await refetch();
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du changement de statut'
      );
      return false;
    }
  };

  const archiveOrganisation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organisations')
        .update({ archived_at: new Date().toISOString(), is_active: false })
        .eq('id', id)
        .is('archived_at', null);

      if (error) {
        setError(error.message);
        return false;
      }
      await refetch();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'archivage"
      );
      return false;
    }
  };

  const unarchiveOrganisation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organisations')
        .update({ archived_at: null, is_active: true })
        .eq('id', id)
        .not('archived_at', 'is', null);

      if (error) {
        setError(error.message);
        return false;
      }
      await refetch();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la restauration'
      );
      return false;
    }
  };

  const hardDeleteOrganisation = async (id: string): Promise<boolean> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any -- Supabase RPC not well typed
      const { data, error } = await (supabase as any).rpc(
        'delete_organisation_safe',
        { p_org_id: id }
      );

      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access -- Supabase error type not well typed
        setError(error.message ?? String(error));
        return false;
      }

      const result = data as {
        success?: boolean;
        error?: string;
        action?: string;
      } | null;

      if (!result?.success) {
        setError(result?.error ?? 'Erreur lors de la suppression');
        return false;
      }

      await refetch();
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la suppression définitive'
      );
      return false;
    }
  };

  return {
    getOrganisationById,
    createOrganisation,
    updateOrganisation,
    deleteOrganisation,
    toggleOrganisationStatus,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
  };
}
