'use client';

/**
 * RestaurantStep - Étape 1 du formulaire de commande
 *
 * Permet de :
 * - Sélectionner un restaurant existant (avec recherche et filtres)
 * - Créer un nouveau restaurant
 *
 * @module RestaurantStep
 * @since 2026-01-20
 */

import { useState, useMemo, useEffect } from 'react';

import { type AddressResult } from '@verone/ui';

import type { EnseigneOrganisation } from '../../../../lib/hooks/use-enseigne-organisations';
import { useEnseigneOrganisations } from '../../../../lib/hooks/use-enseigne-organisations';
import { useUpdateOrganisationOwnershipType } from '../../../../lib/hooks/use-update-organisation-ownership-type';
import { useUserAffiliate } from '../../../../lib/hooks/use-user-selection';
import { ITEMS_PER_PAGE } from './helpers';
import type { RestaurantStepProps, TabFilter } from './types';
import { ExistingRestaurantMode } from './components/ExistingRestaurantMode';
import { ModeToggle } from './components/ModeToggle';
import { NewRestaurantForm } from './components/NewRestaurantForm';

export function RestaurantStep({
  formData,
  errors: _errors,
  onUpdate,
}: RestaurantStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [detectedCountry, setDetectedCountry] = useState<{
    code: string;
    name: string;
  } | null>(null);

  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();

  const { data: organisations, isLoading: orgsLoading } =
    useEnseigneOrganisations(affiliate?.id ?? null);

  const { mutateAsync: updateOwnershipType, isPending: isUpdatingType } =
    useUpdateOrganisationOwnershipType();

  const isLoading = affiliateLoading || orgsLoading;
  const mode = formData.restaurant.mode;

  const filteredOrganisations = useMemo(() => {
    if (!organisations) return [];

    let filtered = organisations;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        org =>
          (org.trade_name ?? '').toLowerCase().includes(query) ||
          (org.legal_name ?? '').toLowerCase().includes(query) ||
          (org.city ?? '').toLowerCase().includes(query)
      );
    }

    if (activeTab !== 'all') {
      filtered = filtered.filter(org => org.ownership_type === activeTab);
    }

    return filtered;
  }, [organisations, searchQuery, activeTab]);

  const tabStats = useMemo(() => {
    if (!organisations) return { all: 0, succursale: 0, franchise: 0 };
    return {
      all: organisations.length,
      succursale: organisations.filter(o => o.ownership_type === 'succursale')
        .length,
      franchise: organisations.filter(o => o.ownership_type === 'franchise')
        .length,
    };
  }, [organisations]);

  const totalPages = Math.ceil(filteredOrganisations.length / ITEMS_PER_PAGE);
  const paginatedOrganisations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrganisations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrganisations, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const handleModeChange = (newMode: 'existing' | 'new') => {
    onUpdate({
      mode: newMode,
      existingId: null,
      existingName: undefined,
      existingCity: undefined,
      existingOwnershipType: null,
      existingCountry: null,
      existingAddressLine1: undefined,
      existingPostalCode: undefined,
    });
  };

  const handleSelectRestaurant = (org: EnseigneOrganisation) => {
    onUpdate({
      mode: 'existing',
      existingId: org.id,
      existingName: org.trade_name ?? org.legal_name,
      existingCity: org.city ?? undefined,
      existingOwnershipType: org.ownership_type as
        | 'succursale'
        | 'franchise'
        | null,
      existingCountry: org.country,
      existingAddressLine1:
        org.shipping_address_line1 ?? org.address_line1 ?? undefined,
      existingPostalCode:
        org.shipping_postal_code ?? org.postal_code ?? undefined,
    });
  };

  const handleNewRestaurantChange = (field: string, value: string) => {
    const currentData = formData.restaurant.newRestaurant;
    const ownershipType =
      field === 'ownershipType'
        ? (value as 'succursale' | 'franchise')
        : (currentData?.ownershipType ?? 'succursale');

    onUpdate({
      newRestaurant: {
        tradeName: currentData?.tradeName ?? '',
        city: currentData?.city ?? '',
        postalCode: currentData?.postalCode ?? '',
        address: currentData?.address ?? '',
        country: currentData?.country ?? 'FR',
        latitude: currentData?.latitude ?? null,
        longitude: currentData?.longitude ?? null,
        ownershipType,
        [field]: value,
      },
    });
  };

  const handleAddressSelect = (address: AddressResult) => {
    const currentData = formData.restaurant.newRestaurant;

    setDetectedCountry({
      code: address.countryCode,
      name: address.country,
    });

    onUpdate({
      newRestaurant: {
        tradeName: currentData?.tradeName ?? '',
        ownershipType: currentData?.ownershipType ?? 'succursale',
        address: address.streetAddress,
        postalCode: address.postalCode,
        city: address.city,
        country: address.countryCode,
        latitude: address.latitude,
        longitude: address.longitude,
      },
    });
  };

  return (
    <div className="space-y-6">
      <ModeToggle mode={mode} onModeChange={handleModeChange} />

      {mode === 'existing' && (
        <ExistingRestaurantMode
          formData={formData}
          isLoading={isLoading}
          isUpdatingType={isUpdatingType}
          paginatedOrganisations={paginatedOrganisations}
          filteredOrganisations={filteredOrganisations}
          totalPages={totalPages}
          currentPage={currentPage}
          tabStats={tabStats}
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onTabChange={setActiveTab}
          onPageChange={setCurrentPage}
          onSelectRestaurant={handleSelectRestaurant}
          onUpdateOwnershipType={params => updateOwnershipType(params)}
          onUpdate={onUpdate}
        />
      )}

      {mode === 'new' && (
        <NewRestaurantForm
          formData={formData}
          detectedCountry={detectedCountry}
          onFieldChange={handleNewRestaurantChange}
          onAddressSelect={handleAddressSelect}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

export default RestaurantStep;
