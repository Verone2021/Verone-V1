'use client';

/**
 * RestaurantSelectorModal — Wrapper backwards-compat pour LinkMe
 *
 * Ce fichier est un thin wrapper autour de OrganisationAddressPickerModal
 * (package @verone/organisations). Il maintient l'API d'origine (trigger inline,
 * isLoading, error) pour ne pas casser RestaurantStep et les usages LinkMe.
 *
 * - showMapView=true  : vue carte activée pour LinkMe (restaurants géolocalisés)
 * - showOwnershipFilter=true : tabs Tous/Propres/Franchises visibles
 *
 * @module RestaurantSelectorModal
 * @since 2026-04-17 (refactoré depuis 526 lignes vers wrapper)
 */

import { useState } from 'react';

import {
  OrganisationAddressPickerModal,
  type OrganisationListItem,
} from '@verone/organisations/components/modals';

import type { EnseigneOrganisation } from '../../lib/hooks/use-enseigne-organisations';

// =====================================================================
// TYPES
// =====================================================================

interface RestaurantSelectorModalProps {
  organisations: EnseigneOrganisation[];
  selectedId: string | null;
  onSelect: (org: EnseigneOrganisation) => void;
  isLoading: boolean;
  error?: string | null;
}

// =====================================================================
// ADAPTER
// =====================================================================

function toListItem(org: EnseigneOrganisation): OrganisationListItem {
  return {
    id: org.id,
    legal_name: org.legal_name,
    trade_name: org.trade_name,
    address_line1: org.address_line1,
    city: org.city,
    postal_code: org.postal_code,
    shipping_address_line1: org.shipping_address_line1,
    logo_url: org.logo_url,
    ownership_type: org.ownership_type,
    latitude: org.latitude,
    longitude: org.longitude,
  };
}

// =====================================================================
// COMPOSANT
// =====================================================================

export function RestaurantSelectorModal({
  organisations,
  selectedId,
  onSelect,
  isLoading,
  error,
}: RestaurantSelectorModalProps) {
  const [open, setOpen] = useState(false);

  const listItems = organisations.map(toListItem);

  const handleSelect = (item: OrganisationListItem) => {
    const original = organisations.find(o => o.id === item.id);
    if (original) onSelect(original);
  };

  return (
    <OrganisationAddressPickerModal
      open={open}
      onOpenChange={setOpen}
      organisations={listItems}
      selectedId={selectedId}
      onSelect={handleSelect}
      isLoading={isLoading}
      error={error}
      title="Sélectionner un restaurant"
      showMapView
      showOwnershipFilter
    />
  );
}
