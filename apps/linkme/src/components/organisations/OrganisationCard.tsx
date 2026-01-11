'use client';

/**
 * OrganisationCard
 *
 * Carte compacte affichant une organisation avec :
 * - Nom, adresse de livraison (2 lignes)
 * - CA et commissions totales (compact)
 * - Boutons CRUD : Voir, Modifier, Archiver (icônes)
 *
 * @module OrganisationCard
 * @since 2026-01-10
 */

import { OrganisationLogo } from '@verone/organisations/components/display/OrganisationLogo';
import { Card } from '@verone/ui';
import { MapPin, Euro, Coins, Eye, Pencil, Archive } from 'lucide-react';

import type { EnseigneOrganisation } from '../../lib/hooks/use-enseigne-organisations';
import type { OrganisationStats } from '../../lib/hooks/use-organisation-stats';

// =====================================================================
// TYPES
// =====================================================================

interface OrganisationCardProps {
  organisation: EnseigneOrganisation;
  stats?: OrganisationStats;
  onView: (org: EnseigneOrganisation) => void;
  onEdit: (org: EnseigneOrganisation) => void;
  onArchive: (org: EnseigneOrganisation) => void;
  isLoading?: boolean;
}

interface AddressLines {
  line1: string | null;
  line2: string | null;
}

// =====================================================================
// HELPERS
// =====================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getOwnershipBadge(
  type: string | null
): { label: string; className: string } | null {
  switch (type) {
    case 'succursale':
      return { label: 'Propre', className: 'bg-blue-100 text-blue-700' };
    case 'franchise':
      return { label: 'Franchise', className: 'bg-amber-100 text-amber-700' };
    default:
      return null;
  }
}

function getAddressLines(org: EnseigneOrganisation): AddressLines {
  // Priorité à l'adresse de livraison
  if (org.shipping_address_line1 || org.shipping_city) {
    return {
      line1: org.shipping_address_line1 || null,
      line2:
        [org.shipping_postal_code, org.shipping_city]
          .filter(Boolean)
          .join(' ') || null,
    };
  }
  // Sinon adresse principale
  if (org.city) {
    return {
      line1: null,
      line2: [org.postal_code, org.city].filter(Boolean).join(' ') || null,
    };
  }
  return { line1: null, line2: null };
}

// =====================================================================
// COMPONENT
// =====================================================================

export function OrganisationCard({
  organisation,
  stats,
  onView,
  onEdit,
  onArchive,
  isLoading = false,
}: OrganisationCardProps) {
  const displayName = organisation.trade_name || organisation.legal_name;
  const address = getAddressLines(organisation);
  const hasAddress = address.line1 || address.line2;
  const ownershipBadge = getOwnershipBadge(organisation.ownership_type);

  const totalCA = stats?.totalRevenueHT ?? 0;
  const totalCommissions = stats?.totalCommissionsHT ?? 0;

  return (
    <Card variant="interactive" className="p-3 flex flex-col h-full">
      {/* Header avec logo, nom et adresse */}
      <div className="flex items-start gap-2.5 mb-2">
        <OrganisationLogo
          logoUrl={organisation.logo_url}
          organisationName={displayName}
          size="sm"
          fallback="icon"
          className="flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {displayName}
            </h3>
            {ownershipBadge && (
              <span
                className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${ownershipBadge.className}`}
              >
                {ownershipBadge.label}
              </span>
            )}
          </div>
          {/* Adresse sur 2 lignes */}
          {hasAddress && (
            <div className="flex items-start gap-1 mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400 mt-0.5" />
              <div className="text-xs text-gray-500 leading-tight">
                {address.line1 && <div>{address.line1}</div>}
                {address.line2 && <div>{address.line2}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats CA et Commissions - Compact */}
      <div className="flex items-center gap-3 mt-auto mb-2 text-xs">
        <div className="flex items-center gap-1">
          <Euro className="h-3 w-3 text-gray-400" />
          <span className="text-gray-500">CA</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(totalCA)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Coins className="h-3 w-3 text-green-500" />
          <span className="text-green-600">Com.</span>
          <span className="font-semibold text-green-700">
            {formatCurrency(totalCommissions)}
          </span>
        </div>
      </div>

      {/* Actions CRUD - Icônes compactes */}
      <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-gray-100">
        <button
          onClick={() => onView(organisation)}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-linkme-turquoise hover:bg-linkme-turquoise/10 rounded transition-colors disabled:opacity-50"
          title="Voir les détails"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEdit(organisation)}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
          title="Modifier"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onArchive(organisation)}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors disabled:opacity-50"
          title="Archiver"
        >
          <Archive className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

export default OrganisationCard;
