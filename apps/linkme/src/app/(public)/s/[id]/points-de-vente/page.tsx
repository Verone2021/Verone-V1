'use client';

import { useMemo } from 'react';

import { StoreLocatorMap } from '@/components/public-selection';

import { useSelection } from '../layout';

export default function PointsDeVentePage() {
  const { selection, branding, organisations, affiliateInfo } = useSelection();

  // Map organisations to match StoreLocatorMap interface
  const mappedOrganisations = useMemo(() => {
    return organisations.map(org => ({
      id: org.id,
      name: org.trade_name || org.legal_name,
      address: org.shipping_address_line1,
      city: org.shipping_city || org.city,
      postalCode: org.shipping_postal_code || org.postal_code,
      country: org.country,
      phone: null,
      email: null,
      latitude: org.latitude,
      longitude: org.longitude,
    }));
  }, [organisations]);

  if (!selection) return null;

  return (
    <div id="stores" className="scroll-mt-20">
      <StoreLocatorMap
        organisations={mappedOrganisations}
        branding={branding}
        enseigneName={affiliateInfo?.enseigne_name ?? selection.name}
      />
    </div>
  );
}
