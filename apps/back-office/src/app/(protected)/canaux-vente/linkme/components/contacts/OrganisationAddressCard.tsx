'use client';

/**
 * OrganisationAddressCard - Carte organisation avec adresse
 *
 * Style similaire à RestaurantStep:
 * - Logo (ou initiales)
 * - Nom + Badge type (Propre/Franchise)
 * - Adresse avec icône MapPin
 *
 * @module OrganisationAddressCard
 * @since 2026-01-20
 */

import { MapPin, Check } from 'lucide-react';

import { Card, cn } from '@verone/ui';
import { OrganisationLogo } from '@verone/organisations/components/display/OrganisationLogo';

// ============================================================================
// TYPES
// ============================================================================

interface OrganisationAddressCardProps {
  /** ID de l'organisation (pour tracking) */
  id: string;
  /** Nom affiché (trade_name ou legal_name) */
  name: string;
  /** URL du logo */
  logoUrl?: string | null;
  /** Type de propriété */
  ownershipType?: 'succursale' | 'franchise' | null;
  /** Adresse complète */
  address?: {
    line1?: string | null;
    line2?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  /** Label additionnel (ex: "Enseigne parente") */
  label?: string;
  /** Est sélectionné */
  isSelected?: boolean;
  /** Callback au clic */
  onClick?: () => void;
  /** Désactivé */
  disabled?: boolean;
  /** Compact mode (moins de padding) */
  compact?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function getOwnershipBadge(
  type: string | null | undefined
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

function formatAddress(
  address: OrganisationAddressCardProps['address']
): string | null {
  if (!address) return null;

  const parts: string[] = [];

  if (address.line1) {
    parts.push(address.line1);
  }

  const cityLine = [address.postalCode, address.city].filter(Boolean).join(' ');
  if (cityLine) {
    parts.push(cityLine);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrganisationAddressCard({
  id: _id,
  name,
  logoUrl,
  ownershipType,
  address,
  label,
  isSelected = false,
  onClick,
  disabled = false,
  compact = false,
}: OrganisationAddressCardProps) {
  const badge = getOwnershipBadge(ownershipType);
  const formattedAddress = formatAddress(address);

  return (
    <Card
      className={cn(
        'transition-all',
        compact ? 'p-2.5' : 'p-3',
        onClick && !disabled && 'cursor-pointer hover:shadow-md',
        isSelected
          ? 'border-2 border-green-500 bg-green-50/50'
          : 'hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-start gap-2.5">
        {/* Logo */}
        <OrganisationLogo
          logoUrl={logoUrl}
          organisationName={name}
          size="sm"
          fallback="icon"
          className="flex-shrink-0"
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Label si fourni */}
          {label && (
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
              {label}
            </p>
          )}

          {/* Name + Badge + Check */}
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {name}
            </h3>
            {badge && (
              <span
                className={cn(
                  'flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded',
                  badge.className
                )}
              >
                {badge.label}
              </span>
            )}
            {isSelected && (
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto" />
            )}
          </div>

          {/* Address */}
          {formattedAddress && (
            <div className="flex items-start gap-1 mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400 mt-0.5" />
              <p className="text-xs text-gray-500 leading-tight">
                {formattedAddress}
              </p>
            </div>
          )}

          {/* Country if not FR */}
          {address?.country && address.country !== 'FR' && (
            <p className="text-[10px] text-gray-400 mt-0.5 ml-4">
              {address.country}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// ENSEIGNE PARENT CARD (special variant)
// ============================================================================

interface EnseigneParentCardProps {
  name: string;
  logoUrl?: string | null;
  address?: {
    line1?: string | null;
    postalCode?: string | null;
    city?: string | null;
  } | null;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function EnseigneParentCard({
  name,
  logoUrl,
  address,
  isSelected = false,
  onClick,
  disabled = false,
}: EnseigneParentCardProps) {
  return (
    <OrganisationAddressCard
      id="enseigne-parent"
      name={name}
      logoUrl={logoUrl}
      address={address}
      label="Enseigne parente"
      isSelected={isSelected}
      onClick={onClick}
      disabled={disabled}
    />
  );
}

// ============================================================================
// CREATE NEW ADDRESS CARD
// ============================================================================

interface CreateNewAddressCardProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  label?: string;
}

export function CreateNewAddressCard({
  onClick,
  isActive = false,
  disabled = false,
  label = 'Nouvelle adresse',
}: CreateNewAddressCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
        isActive
          ? 'border-2 border-purple-500 bg-purple-50/50'
          : 'hover:border-gray-400',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isActive ? 'bg-purple-100' : 'bg-gray-100'
          )}
        >
          <span
            className={cn(
              'text-lg font-medium',
              isActive ? 'text-purple-600' : 'text-gray-400'
            )}
          >
            +
          </span>
        </div>
        <span
          className={cn(
            'font-medium text-sm',
            isActive ? 'text-purple-600' : 'text-gray-600'
          )}
        >
          {label}
        </span>
      </div>
    </Card>
  );
}

export default OrganisationAddressCard;
