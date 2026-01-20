'use client';

/**
 * ContactCard - Petite carte de contact sélectionnable
 *
 * Pattern: Cartes compactes comme RestaurantStep (p-3, grid cols-3)
 * Affiche: Avatar, nom, fonction, email
 *
 * @module ContactCard
 * @since 2026-01-20
 */

import { Card, cn, Badge } from '@verone/ui';
import { User, CheckCircle } from 'lucide-react';

import type { OrganisationContact } from '@/lib/hooks/use-organisation-contacts';

// ============================================================================
// TYPES
// ============================================================================

interface ContactCardProps {
  /** Contact data */
  contact: OrganisationContact;
  /** Is this contact selected? */
  isSelected: boolean;
  /** Click handler */
  onClick: () => void;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContactCard({
  contact,
  isSelected,
  onClick,
  disabled = false,
}: ContactCardProps) {
  const displayName = `${contact.firstName} ${contact.lastName}`;

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
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-gray-500" />
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

          {/* Position/Title */}
          {contact.title && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {contact.title}
            </p>
          )}

          {/* Email */}
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {contact.email}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-1 mt-1.5">
            {contact.isPrimaryContact && (
              <Badge variant="info" size="sm">
                Principal
              </Badge>
            )}
            {contact.isBillingContact && (
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

export default ContactCard;
