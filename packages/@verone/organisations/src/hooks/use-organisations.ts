'use client';

import { useState, useEffect, useCallback } from 'react';

import type { Database, Organisation, OrganisationInsert } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

// Re-export Organisation pour backward compatibility
export type { Organisation };

export interface OrganisationFilters {
  type?: 'supplier' | 'customer' | 'partner' | 'internal';
  customer_type?: 'professional' | 'individual' | 'all';
  is_active?: boolean;
  /** Filtre prestataire (true) vs fournisseur (false) pour type=supplier */
  is_service_provider?: boolean;
  search?: string;
  country?: string;
  include_archived?: boolean;
  /** Exclure les organisations qui appartiennent à une enseigne (enseigne_id IS NOT NULL) */
  exclude_with_enseigne?: boolean;
}

// Type pour création d'organisation (basé sur Supabase Insert)
export type CreateOrganisationData = OrganisationInsert;

// Type pour mise à jour d'organisation
export type UpdateOrganisationData = Partial<OrganisationInsert> & {
  id: string;
};

export function useOrganisations(filters?: OrganisationFilters) {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fonction pour récupérer une organisation par ID avec ses adresses
  const getOrganisationById = async (
    id: string
  ): Promise<Organisation | null> => {
    // Validation stricte de l'ID (doit être UUID valide ou non-vide)
    if (!id || id.trim() === '') return null;

    try {
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', id)
        .single();

      // Erreur Supabase "no rows" (PGRST116) - organisation non trouvée, pas une vraie erreur
      if (error?.code === 'PGRST116') {
        return null;
      }

      if (error) {
        throw error;
      }

      // ✅ Ajouter le champ 'name' calculé
      if (data) {
        const orgWithName: Organisation = {
          ...data,
          name: data.trade_name || data.legal_name,
        };
        return orgWithName;
      }

      return null;
    } catch (error) {
      // Cast pour accéder aux propriétés
      const pgError = error as {
        code?: string;
        message?: string | Error;
        details?: string;
      };
      const errorMessage =
        pgError?.message instanceof Error
          ? pgError.message.message
          : pgError?.message || (error instanceof Error ? error.message : '');

      // Silencieusement ignorer les erreurs réseau (Failed to fetch, network, timeout)
      if (
        (error instanceof Error && error.message.includes('fetch')) ||
        (typeof errorMessage === 'string' &&
          (errorMessage.includes('fetch') ||
            errorMessage.includes('network') ||
            errorMessage.includes('timeout')))
      ) {
        return null;
      }

      // Silencieusement ignorer les erreurs Supabase "no rows" (PGRST116)
      if (pgError?.code === 'PGRST116') {
        return null;
      }

      // Silencieusement ignorer les erreurs vides/malformées (pas d'info utile)
      const hasContent = errorMessage || pgError?.code || pgError?.details;
      if (!hasContent) {
        return null;
      }

      // Logger uniquement les erreurs significatives (non-réseau, non-expected)
      console.error("Erreur lors de la récupération de l'organisation:", {
        message: errorMessage || 'Erreur inconnue',
        code: pgError?.code,
        details: error,
      });
      return null;
    }
  };

  const fetchOrganisations = async () => {
    setLoading(true);
    setError(null);

    try {
      // Requête simplifiée avec tous les champs disponibles
      let query = supabase
        .from('organisations')
        .select('*')
        .order('legal_name', { ascending: true }); // ✅ CORRIGÉ - name → legal_name

      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      // Filtre is_service_provider (prestataire vs fournisseur)
      if (filters?.is_service_provider !== undefined) {
        if (filters.is_service_provider === true) {
          // Prestataires: is_service_provider = true
          query = query.eq('is_service_provider', true);
        } else {
          // Fournisseurs: is_service_provider = false OU NULL
          query = query.or(
            'is_service_provider.eq.false,is_service_provider.is.null'
          );
        }
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.country) {
        query = query.eq('country', filters.country);
      }

      if (filters?.search) {
        // ✅ CORRIGÉ - recherche sur legal_name OU trade_name OU email
        query = query.or(
          `legal_name.ilike.%${filters.search}%,trade_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      // Filtre customer_type pour les clients uniquement
      if (
        filters?.type === 'customer' &&
        filters?.customer_type &&
        filters.customer_type !== 'all'
      ) {
        if (filters.customer_type === 'professional') {
          // Professionnel = customer_type IS NULL OR customer_type = 'professional'
          query = query.or(
            'customer_type.is.null,customer_type.eq.professional'
          );
        } else if (filters.customer_type === 'individual') {
          // Particulier = customer_type = 'individual' uniquement
          query = query.eq('customer_type', 'individual');
        }
      }

      // Exclude archived by default unless explicitly requested
      if (!filters?.include_archived) {
        query = query.is('archived_at', null);
      }

      // Exclure les organisations qui appartiennent à une enseigne (pour sélecteur sourcing)
      if (filters?.exclude_with_enseigne) {
        query = query.is('enseigne_id', null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      // ✅ Ajouter le champ 'name' calculé pour chaque organisation
      const organisationsWithName = (data || []).map(org => ({
        ...org,
        name: org.trade_name || org.legal_name,
      }));

      // Add product counts for suppliers (optimized - single query)
      let organisationsWithCounts = organisationsWithName;

      // Si on a des fournisseurs, on compte tous les produits en une seule requête groupée
      const suppliers = organisationsWithName.filter(
        org => org.type === 'supplier'
      );
      if (suppliers.length > 0) {
        const supplierIds = suppliers.map(s => s.id);

        // Requête groupée pour compter les produits par supplier_id
        const { data: productCounts } = await supabase
          .from('products')
          .select('supplier_id')
          .in('supplier_id', supplierIds);

        // Créer un Map de comptage
        const countsMap = new Map<string, number>();
        productCounts?.forEach(p => {
          const supplierId = String(p.supplier_id);
          const count = countsMap.get(supplierId) ?? 0;
          countsMap.set(supplierId, count + 1);
        });

        // Merger les comptes avec les organisations
        organisationsWithCounts = organisationsWithName.map(org => {
          if (org.type === 'supplier') {
            return {
              ...org,
              _count: {
                products: countsMap.get(org.id) ?? 0,
              },
            };
          }
          return org;
        });
      }

      setOrganisations(organisationsWithCounts);
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
  }, [
    filters?.type,
    filters?.is_active,
    filters?.search,
    filters?.country,
    filters?.include_archived,
    filters?.exclude_with_enseigne,
  ]);

  const createOrganisation = async (
    data: CreateOrganisationData
  ): Promise<Organisation | null> => {
    try {
      const { data: newOrg, error } = await supabase
        .from('organisations')
        .insert([
          {
            // ✅ Colonnes de base (REQUIRED)
            legal_name: data.legal_name, // ✅ CORRIGÉ - name → legal_name
            trade_name: data.trade_name || null, // ✅ NOUVEAU - nom commercial
            has_different_trade_name: data.has_different_trade_name ?? false, // ✅ NOUVEAU
            type: data.type,
            email: data.email || null,
            phone: data.phone || null,
            country: data.country || 'FR',
            is_active: data.is_active ?? true,

            // ✅ Identifiants légaux
            siren: data.siren || null, // ✅ NOUVEAU - SIREN (9 chiffres)
            siret: data.siret || null,
            vat_number: data.vat_number || null,
            legal_form: data.legal_form || null,

            // ✅ Adresses de facturation (existantes en BD)
            billing_address_line1: data.billing_address_line1 || null,
            billing_address_line2: data.billing_address_line2 || null,
            billing_postal_code: data.billing_postal_code || null,
            billing_city: data.billing_city || null,
            billing_region: data.billing_region || null,
            billing_country: data.billing_country || 'FR',

            // ✅ Adresses de livraison (existantes en BD)
            shipping_address_line1: data.shipping_address_line1 || null,
            shipping_address_line2: data.shipping_address_line2 || null,
            shipping_postal_code: data.shipping_postal_code || null,
            shipping_city: data.shipping_city || null,
            shipping_region: data.shipping_region || null,
            shipping_country: data.shipping_country || 'FR',
            has_different_shipping_address:
              data.has_different_shipping_address ?? false,

            // ✅ Classification client (existantes en BD)
            customer_type: data.customer_type || null,
            prepayment_required: data.prepayment_required ?? false,

            // ❌ RETIRÉES - Colonnes pour individual_customers uniquement :
            // first_name, mobile_phone, date_of_birth, nationality,
            // preferred_language, communication_preference, marketing_consent
          },
        ])
        .select()
        .single();

      if (error) {
        setError(error.message);
        return null;
      }

      await fetchOrganisations();

      // ✅ Ajouter le champ 'name' calculé
      if (newOrg) {
        const orgWithName: Organisation = {
          ...newOrg,
          name: newOrg.trade_name || newOrg.legal_name,
        };
        return orgWithName;
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
      // Filtrer uniquement les colonnes valides existantes en BD
      const validData: Database['public']['Tables']['organisations']['Update'] =
        {};

      // Colonnes de base autorisées
      const allowedFields = [
        'legal_name',
        'trade_name',
        'has_different_trade_name', // ✅ CORRIGÉ - name → legal_name + nouveaux champs
        'type',
        'email',
        'country',
        'is_active',
        'siren',
        'siret',
        'vat_number',
        'legal_form', // ✅ AJOUTÉ - siren
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
        'customer_type',
        'prepayment_required',
      ];

      // Copier uniquement les champs autorisés
      allowedFields.forEach(field => {
        const key = field as keyof UpdateOrganisationData;
        if (key in data && data[key] !== undefined) {
          // Type assertion needed because UpdateOrganisationData uses broader types
          // than Supabase's generated types (e.g., string vs literal union)
          (validData as Record<string, unknown>)[key] = data[key];
        }
      });

      const { data: updatedOrg, error } = await supabase
        .from('organisations')
        .update(validData)
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return null;
      }

      await fetchOrganisations();

      // ✅ Ajouter le champ 'name' calculé
      if (updatedOrg) {
        const orgWithName: Organisation = {
          ...updatedOrg,
          name: updatedOrg.trade_name || updatedOrg.legal_name,
        };
        return orgWithName;
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
      // PROTECTION: Verifier si des utilisateurs sont lies a cette organisation
      const { count: linkedUsersCount, error: checkError } = await supabase
        .from('user_app_roles')
        .select('*', { count: 'exact', head: true })
        .eq('organisation_id', id)
        .eq('is_active', true);

      if (checkError) {
        console.warn('Erreur verification users lies:', checkError);
        // Continue si erreur de verification (graceful)
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

      await fetchOrganisations();
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
      const org = organisations.find(o => o.id === id);
      if (!org) return false;

      const { error } = await supabase
        .from('organisations')
        .update({ is_active: !org.is_active })
        .eq('id', id);

      if (error) {
        setError(error.message);
        return false;
      }

      await fetchOrganisations();
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
        .update({
          archived_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', id)
        .is('archived_at', null); // Only archive if not already archived

      if (error) {
        setError(error.message);
        return false;
      }

      await fetchOrganisations();
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
        .update({
          archived_at: null,
          is_active: true,
        })
        .eq('id', id)
        .not('archived_at', 'is', null); // Only unarchive if currently archived

      if (error) {
        setError(error.message);
        return false;
      }

      await fetchOrganisations();
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
      // Use RPC to safely delete/archive organisation
      // This handles unlinking transactions and disabling rules
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
        setError(result?.error || 'Erreur lors de la suppression');
        return false;
      }

      await fetchOrganisations();
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
    organisations,
    loading,
    error,
    refetch: fetchOrganisations,
    createOrganisation,
    updateOrganisation,
    deleteOrganisation,
    toggleOrganisationStatus,
    archiveOrganisation,
    unarchiveOrganisation,
    hardDeleteOrganisation,
    getOrganisationById,
  };
}

/**
 * Helper function: Retourne le nom d'affichage préféré d'une organisation
 * Si l'organisation a un nom commercial différent, retourne trade_name
 * Sinon, retourne legal_name (dénomination sociale)
 */
export function getOrganisationDisplayName(
  organisation: Organisation | null | undefined
): string {
  if (!organisation) return '';

  if (organisation.has_different_trade_name && organisation.trade_name) {
    return organisation.trade_name;
  }

  return organisation.legal_name;
}

export function useSuppliers(filters?: Omit<OrganisationFilters, 'type'>) {
  return useOrganisations({ ...filters, type: 'supplier' });
}

export function useCustomers(filters?: Omit<OrganisationFilters, 'type'>) {
  return useOrganisations({ ...filters, type: 'customer' });
}

export function useOrganisation(id: string) {
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const supabase = createClient();

  // Fonction pour forcer le rafraîchissement des données
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
          .select('*, enseigne:enseignes(name)')
          .eq('id', id)
          .single();

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        // ✅ Ajouter le champ 'name' calculé
        const orgWithName: Organisation = {
          ...data,
          name: data.trade_name ?? data.legal_name,
        };

        // Add product counts if supplier
        if (data.type === 'supplier') {
          // Compter les produits individuels directement par supplier_id
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
  }, [id, refreshKey]);

  return { organisation, loading, error, refetch };
}
