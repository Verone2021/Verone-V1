'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

import {
  changeAffiliateStatus,
  createAffiliate,
  deleteAffiliate,
  updateAffiliate,
} from './affiliate-mutations';
import type {
  Affiliate,
  AffiliateType,
  AffiliateWithOrg,
  Enseigne,
  FormData,
  Organisation,
} from './types';

export function useAffiliates() {
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [enseignes, setEnseignes] = useState<Enseigne[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [enseigneFilter, setEnseigneFilter] = useState<string>('all');
  const [organisationFilter, setOrganisationFilter] = useState<string>('all');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState<FormData>({
    entity_type: 'organisation',
    entity_id: '',
    display_name: '',
    slug: '',
    affiliate_type: 'enseigne' as AffiliateType,
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [entitySearch, setEntitySearch] = useState('');

  const fetchAffiliates = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('linkme_affiliates')
        .select(
          `
          *,
          organisations:organisation_id(legal_name, trade_name)
        `
        )
        .order('created_at', { ascending: false })
        .returns<AffiliateWithOrg[]>();

      if (error) throw error;

      const affiliatesWithNames = (data ?? []).map(
        (a: AffiliateWithOrg): Affiliate => {
          const { organisations, ...affiliateData } = a;
          return {
            ...affiliateData,
            organisation_name:
              organisations?.trade_name ?? organisations?.legal_name ?? null,
            enseigne_name: null,
          };
        }
      );

      setAffiliates(affiliatesWithNames);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les affiliés',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  async function fetchOrganisations() {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('organisations')
        .select('id, legal_name, trade_name, logo_url')
        .eq('is_active', true)
        .order('legal_name');

      if (error) throw error;
      setOrganisations(data ?? []);
    } catch (error) {
      console.error('Error fetching organisations:', error);
    }
  }

  async function fetchEnseignes() {
    const supabase = createClient();
    try {
      // Note: la table enseignes n'existe pas encore dans les types générés
      // La fonctionnalité Enseignes LinkMe utilise les organisations avec is_enseigne_parent=true
      // TODO: Migrer vers organisations filtrées ou créer table enseignes dédiée
      const { data, error } = await supabase
        .from('organisations')
        .select('id, legal_name, trade_name, logo_url')
        .eq('is_active', true)
        .order('legal_name');

      if (error) throw error;
      const mappedData = (data ?? []).map(org => ({
        id: org.id,
        name: org.trade_name ?? org.legal_name,
        logo_url: org.logo_url,
      }));
      setEnseignes(mappedData);
    } catch (error) {
      console.error('Error fetching enseignes:', error);
    }
  }

  useEffect(() => {
    void fetchAffiliates().catch(error => {
      console.error('[Affiliates] Fetch failed:', error);
    });
    void fetchOrganisations().catch(error => {
      console.error('[Affiliates] Fetch organisations failed:', error);
    });
    void fetchEnseignes().catch(error => {
      console.error('[Affiliates] Fetch enseignes failed:', error);
    });
  }, [fetchAffiliates]);

  const availableOrganisations = useMemo(() => {
    const linkedOrgIds = new Set(
      affiliates.map(a => a.organisation_id).filter(Boolean)
    );
    return organisations.filter(org => !linkedOrgIds.has(org.id));
  }, [organisations, affiliates]);

  const availableEnseignes = useMemo(() => {
    const linkedEnsIds = new Set(
      affiliates.map(a => a.enseigne_id).filter(Boolean)
    );
    return enseignes.filter(ens => !linkedEnsIds.has(ens.id));
  }, [enseignes, affiliates]);

  const filteredEntities = useMemo(() => {
    const searchLower = entitySearch.toLowerCase();
    if (formData.entity_type === 'organisation') {
      return availableOrganisations.filter(
        org =>
          org.legal_name.toLowerCase().includes(searchLower) ||
          org.trade_name?.toLowerCase().includes(searchLower)
      );
    } else {
      return availableEnseignes.filter(ens =>
        ens.name.toLowerCase().includes(searchLower)
      );
    }
  }, [
    formData.entity_type,
    entitySearch,
    availableOrganisations,
    availableEnseignes,
  ]);

  const filteredAffiliates = useMemo(
    () =>
      affiliates.filter(affiliate => {
        const matchesSearch =
          affiliate.display_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          affiliate.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType =
          typeFilter === 'all' || affiliate.affiliate_type === typeFilter;
        const matchesStatus =
          statusFilter === 'all' || affiliate.status === statusFilter;
        const matchesEnseigne =
          enseigneFilter === 'all' || affiliate.enseigne_id === enseigneFilter;
        const matchesOrganisation =
          organisationFilter === 'all' ||
          affiliate.organisation_id === organisationFilter;
        return (
          matchesSearch &&
          matchesType &&
          matchesStatus &&
          matchesEnseigne &&
          matchesOrganisation
        );
      }),
    [
      affiliates,
      searchTerm,
      typeFilter,
      statusFilter,
      enseigneFilter,
      organisationFilter,
    ]
  );

  function resetForm() {
    setFormData({
      entity_type: 'organisation',
      entity_id: '',
      display_name: '',
      slug: '',
      affiliate_type: 'enseigne',
      bio: '',
    });
    setEntitySearch('');
  }

  function handleEntitySelect(entityId: string) {
    if (formData.entity_type === 'organisation') {
      const org = organisations.find(o => o.id === entityId);
      if (org) {
        const displayName = org.trade_name ?? org.legal_name;
        const slug = displayName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        setFormData(prev => ({
          ...prev,
          entity_id: entityId,
          display_name: displayName,
          slug: slug,
        }));
      }
    } else {
      const ens = enseignes.find(e => e.id === entityId);
      if (ens) {
        const displayName = ens.name;
        const slug = displayName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        setFormData(prev => ({
          ...prev,
          entity_id: entityId,
          display_name: displayName,
          slug: slug,
          affiliate_type: 'enseigne',
        }));
      }
    }
  }

  function openEditModal(affiliate: Affiliate) {
    setSelectedAffiliate(affiliate);
    setFormData({
      entity_type: affiliate.enseigne_id ? 'enseigne' : 'organisation',
      entity_id: affiliate.enseigne_id ?? affiliate.organisation_id ?? '',
      display_name: affiliate.display_name,
      slug: affiliate.slug,
      affiliate_type: (affiliate.affiliate_type ?? 'enseigne') as AffiliateType,
      bio: affiliate.bio ?? '',
    });
    setIsEditModalOpen(true);
  }

  const deps = { toast, fetchAffiliates };

  async function handleCreateAffiliate() {
    await createAffiliate(formData, deps, setSaving, () => {
      setIsCreateModalOpen(false);
      resetForm();
    });
  }

  async function handleUpdateAffiliate() {
    if (!selectedAffiliate) return;
    await updateAffiliate(
      selectedAffiliate.id,
      formData,
      deps,
      setSaving,
      () => {
        setIsEditModalOpen(false);
        setSelectedAffiliate(null);
        resetForm();
      }
    );
  }

  async function handleStatusChange(
    affiliateId: string,
    newStatus: 'active' | 'suspended'
  ) {
    await changeAffiliateStatus(affiliateId, newStatus, deps);
  }

  async function handleDeleteAffiliate(affiliateId: string) {
    await deleteAffiliate(affiliateId, deps);
  }

  return {
    organisations,
    enseignes,
    loading,
    filteredAffiliates,
    availableOrganisations,
    availableEnseignes,
    filteredEntities,
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    enseigneFilter,
    setEnseigneFilter,
    organisationFilter,
    setOrganisationFilter,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedAffiliate,
    formData,
    setFormData,
    saving,
    entitySearch,
    setEntitySearch,
    resetForm,
    handleEntitySelect,
    openEditModal,
    handleCreateAffiliate,
    handleUpdateAffiliate,
    handleStatusChange,
    handleDeleteAffiliate,
  };
}
