'use client';

/**
 * OrganisationQuickViewModal - Modal consultation/édition rapide d'une organisation
 *
 * Permet de voir et éditer les infos org (identité légale, commercial, adresses)
 * sans quitter la page en cours (ex: page facture).
 *
 * Réutilise les sections d'édition existantes (LegalIdentityEditSection, CommercialEditSection).
 */

import { useCallback } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import type { Organisation } from '@verone/types';
import {
  Building2,
  ExternalLink,
  Loader2,
  MapPin,
  Mail,
  Phone,
  Globe,
} from 'lucide-react';

import { useOrganisation } from '../../hooks/use-organisations';
import { OrganisationLogo } from '../display/OrganisationLogo';
import { LegalIdentityEditSection } from '../sections/LegalIdentityEditSection';
import { CommercialEditSection } from '../sections/CommercialEditSection';

// ============================================
// TYPES
// ============================================

interface OrganisationQuickViewModalProps {
  organisationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================
// ADDRESS DISPLAY (read-only, no edit section exists yet)
// ============================================

function AddressBlock({
  title,
  line1,
  line2,
  city,
  postalCode,
  region,
  country,
}: {
  title: string;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  region?: string | null;
  country?: string | null;
}) {
  const hasAddress = line1 || city || postalCode;
  if (!hasAddress) return null;

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {title}
      </h4>
      <div className="text-sm text-slate-700">
        {line1 && <p>{line1}</p>}
        {line2 && <p>{line2}</p>}
        <p>
          {postalCode} {city}
          {region ? `, ${region}` : ''}
        </p>
        {country && <p>{country}</p>}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function OrganisationQuickViewModal({
  organisationId,
  open,
  onOpenChange,
}: OrganisationQuickViewModalProps) {
  const { organisation, loading, refetch } = useOrganisation(
    organisationId ?? ''
  );

  const handleUpdate = useCallback(
    (_updatedData: Partial<Organisation>) => {
      refetch();
    },
    [refetch]
  );

  const orgType: 'supplier' | 'service_provider' | 'customer' =
    organisation?.type === 'supplier' ? 'supplier' : 'customer';

  const detailPath =
    organisation?.type === 'supplier'
      ? `/contacts-organisations/fournisseurs/${organisationId}`
      : `/contacts-organisations/clients/${organisationId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Fiche Organisation
          </DialogTitle>
        </DialogHeader>

        {loading || !organisation ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header: Logo + Name + Quick info */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <OrganisationLogo
                logoUrl={organisation.logo_url}
                organisationName={organisation.name}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 truncate">
                  {organisation.legal_name}
                </h3>
                {organisation.trade_name &&
                  organisation.trade_name !== organisation.legal_name && (
                    <p className="text-sm text-slate-500">
                      {organisation.trade_name}
                    </p>
                  )}

                {/* Contact info row */}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                  {organisation.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {organisation.email}
                    </span>
                  )}
                  {organisation.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {organisation.phone}
                    </span>
                  )}
                  {organisation.website && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {organisation.website}
                    </span>
                  )}
                </div>

                {/* Link to full page */}
                <a
                  href={detailPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                >
                  Voir la fiche complète
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Legal Identity (editable) */}
            <LegalIdentityEditSection
              organisation={organisation}
              onUpdate={handleUpdate}
            />

            {/* Commercial Info (editable) */}
            <CommercialEditSection
              organisation={organisation}
              onUpdate={handleUpdate}
              organisationType={orgType}
            />

            {/* Addresses (read-only display) */}
            <div className="card-verone p-4 space-y-4">
              <h3 className="text-base font-medium text-black flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Adresses
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AddressBlock
                  title="Facturation"
                  line1={organisation.billing_address_line1}
                  line2={organisation.billing_address_line2}
                  city={organisation.billing_city}
                  postalCode={organisation.billing_postal_code}
                  region={organisation.billing_region}
                  country={organisation.billing_country}
                />
                {organisation.has_different_shipping_address && (
                  <AddressBlock
                    title="Livraison"
                    line1={organisation.shipping_address_line1}
                    line2={organisation.shipping_address_line2}
                    city={organisation.shipping_city}
                    postalCode={organisation.shipping_postal_code}
                    region={organisation.shipping_region}
                    country={organisation.shipping_country}
                  />
                )}
              </div>

              {!organisation.billing_address_line1 &&
                !organisation.shipping_address_line1 && (
                  <p className="text-sm text-slate-400 italic">
                    Aucune adresse renseignée
                  </p>
                )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
