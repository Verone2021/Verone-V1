'use client';

/**
 * OrganisationCard - Petite carte d'organisation sélectionnable
 *
 * Pattern: Cartes compactes comme RestaurantStep (p-3, grid cols-3)
 * Affiche: Icone, raison sociale, SIRET, adresse
 *
 * @module OrganisationCard
 * @since 2026-01-20
 */

import { Card, cn, Badge } from '@verone/ui';
import { Building2, CheckCircle, MapPin, Store } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface BillingOrganisation {
  id: string;
  type: 'restaurant' | 'parent_org' | 'other';
  legalName: string | null;
  tradeName: string | null;
  siret: string | null;
  vatNumber?: string | null;
  addressLine1: string | null;
  addressLine2?: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}

interface OrganisationCardProps {
  /** Organisation data */
  organisation: BillingOrganisation;
  /** Is this organisation selected? */
  isSelected: boolean;
  /** Click handler */
  onClick: () => void;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatSiret(siret: string | null): string {
  if (!siret) return '';
  // Format: XXX XXX XXX XXXXX
  const cleaned = siret.replace(/\s/g, '');
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  return siret;
}

function getTypeBadge(type: 'restaurant' | 'parent_org' | 'other'): {
  label: string;
  className: string;
} | null {
  switch (type) {
    case 'restaurant':
      return { label: 'Restaurant', className: 'bg-blue-100 text-blue-700' };
    case 'parent_org':
      return { label: 'Org. Mère', className: 'bg-purple-100 text-purple-700' };
    case 'other':
      return { label: 'Autre', className: 'bg-gray-100 text-gray-700' };
    default:
      return null;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrganisationCard({
  organisation,
  isSelected,
  onClick,
  disabled = false,
}: OrganisationCardProps) {
  const displayName = organisation.tradeName || organisation.legalName || 'Organisation';
  const badge = getTypeBadge(organisation.type);
  const Icon = organisation.type === 'restaurant' ? Store : Building2;

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md',
        isSelected
          ? 'border-2 border-green-500 bg-green-50/50'
          : 'hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            organisation.type === 'parent_org'
              ? 'bg-purple-100'
              : organisation.type === 'restaurant'
                ? 'bg-blue-100'
                : 'bg-gray-100'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4',
              organisation.type === 'parent_org'
                ? 'text-purple-600'
                : organisation.type === 'restaurant'
                  ? 'text-blue-600'
                  : 'text-gray-500'
            )}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {displayName}
            </h3>
            {isSelected && (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto" />
            )}
          </div>

          {/* Badge */}
          {badge && (
            <div className="mt-1">
              <Badge size="sm" className={badge.className}>
                {badge.label}
              </Badge>
            </div>
          )}

          {/* SIRET */}
          {organisation.siret && (
            <p className="text-xs text-gray-500 mt-1">
              SIRET: {formatSiret(organisation.siret)}
            </p>
          )}

          {/* Address */}
          {(organisation.addressLine1 || organisation.city) && (
            <div className="flex items-start gap-1 mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400 mt-0.5" />
              <div className="text-xs text-gray-400 leading-tight">
                {organisation.addressLine1 && (
                  <div className="truncate">{organisation.addressLine1}</div>
                )}
                <div>
                  {[organisation.postalCode, organisation.city]
                    .filter(Boolean)
                    .join(' ')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default OrganisationCard;
