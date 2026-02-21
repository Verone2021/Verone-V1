'use client';

/**
 * ContactCardBO - Carte contact pour le back-office
 *
 * Affiche un contact avec ses badges de rôles:
 * - Facturation (bleu)
 * - Responsable (vert)
 * - Commercial (orange)
 * - Technique (violet)
 *
 * @module ContactCardBO
 * @since 2026-01-20
 */

import { User, Check, Mail, Phone } from 'lucide-react';

import { Card, cn } from '@verone/ui';

import type { ContactBO } from '../../hooks/linkme/use-organisation-contacts-bo';

// ============================================================================
// TYPES
// ============================================================================

interface ContactCardBOProps {
  contact: ContactBO;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  showBadges?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

interface RoleBadge {
  label: string;
  className: string;
}

function getRoleBadges(contact: ContactBO): RoleBadge[] {
  const badges: RoleBadge[] = [];

  if (contact.isBillingContact) {
    badges.push({
      label: 'Facturation',
      className: 'bg-blue-100 text-blue-700',
    });
  }

  if (contact.isPrimaryContact) {
    badges.push({
      label: 'Responsable',
      className: 'bg-green-100 text-green-700',
    });
  }

  if (contact.isCommercialContact) {
    badges.push({
      label: 'Commercial',
      className: 'bg-orange-100 text-orange-700',
    });
  }

  if (contact.isTechnicalContact) {
    badges.push({
      label: 'Technique',
      className: 'bg-violet-100 text-violet-700',
    });
  }

  return badges;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContactCardBO({
  contact,
  isSelected = false,
  onClick,
  disabled = false,
  showBadges = true,
}: ContactCardBOProps) {
  const badges = showBadges ? getRoleBadges(contact) : [];
  const fullName = `${contact.firstName} ${contact.lastName}`;

  return (
    <Card
      className={cn(
        'p-3 transition-all',
        onClick && !disabled && 'cursor-pointer hover:shadow-md',
        isSelected
          ? 'border-2 border-purple-500 bg-purple-50/50'
          : 'hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
            isSelected ? 'bg-purple-100' : 'bg-gray-100'
          )}
        >
          <User
            className={cn(
              'h-4 w-4',
              isSelected ? 'text-purple-600' : 'text-gray-500'
            )}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Name + Check */}
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {fullName}
            </h3>
            {isSelected && (
              <Check className="h-4 w-4 text-purple-500 flex-shrink-0 ml-auto" />
            )}
          </div>

          {/* Title */}
          {contact.title && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {contact.title}
            </p>
          )}

          {/* Email & Phone */}
          <div className="flex items-center gap-3 mt-1">
            {contact.email && (
              <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
          </div>

          {contact.phone && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{contact.phone}</span>
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {badges.map(badge => (
                <span
                  key={badge.label}
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] font-medium rounded',
                    badge.className
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// CREATE NEW CARD
// ============================================================================

interface CreateNewContactCardProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export function CreateNewContactCard({
  onClick,
  isActive = false,
  disabled = false,
}: CreateNewContactCardProps) {
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
          Nouveau contact
        </span>
      </div>
    </Card>
  );
}

export default ContactCardBO;
