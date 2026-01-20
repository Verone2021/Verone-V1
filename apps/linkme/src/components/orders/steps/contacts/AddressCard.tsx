'use client';

/**
 * AddressCard - Petite carte adresse sélectionnable
 *
 * Pattern: Cartes compactes comme ContactCard (p-3, grid cols-3)
 * Affiche: Icône, label/ligne1, ville, badge défaut
 *
 * @module AddressCard
 * @since 2026-01-20
 */

import { Card, cn, Badge } from '@verone/ui';
import { MapPin, CheckCircle } from 'lucide-react';

import type { Address } from '@/lib/hooks/use-entity-addresses';

// ============================================================================
// TYPES
// ============================================================================

interface AddressCardProps {
  /** Address data */
  address: Address;
  /** Is this address selected? */
  isSelected: boolean;
  /** Click handler */
  onClick: () => void;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AddressCard({
  address,
  isSelected,
  onClick,
  disabled = false,
}: AddressCardProps) {
  // Build display label
  const displayLabel = address.label || address.addressLine1;
  const displayCity = address.city
    ? `${address.postalCode} ${address.city}`
    : '';

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
            isSelected ? 'bg-green-100' : 'bg-gray-100'
          )}
        >
          <MapPin
            className={cn(
              'h-4 w-4',
              isSelected ? 'text-green-600' : 'text-gray-500'
            )}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {displayLabel}
            </h3>
            {isSelected && (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto" />
            )}
          </div>

          {/* City */}
          {displayCity && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {displayCity}
            </p>
          )}

          {/* Full address on second line if label exists */}
          {address.label && address.addressLine1 && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {address.addressLine1}
            </p>
          )}

          {/* Badges */}
          <div className="flex items-center gap-1 mt-1.5">
            {address.isDefault && (
              <Badge variant="info" size="sm">
                Défaut
              </Badge>
            )}
            {address.addressType === 'billing' && (
              <Badge variant="secondary" size="sm">
                Facturation
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default AddressCard;
