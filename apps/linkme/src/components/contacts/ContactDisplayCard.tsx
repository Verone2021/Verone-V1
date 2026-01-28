'use client';

/**
 * ContactDisplayCard - Carte d'affichage de contact (non-sélectionnable)
 *
 * Variante de ContactCard pour affichage uniquement (modal, liste)
 * Affiche badges pour rôles et appartenance (enseigne/restaurant/partagé)
 *
 * @module ContactDisplayCard
 * @since 2026-01-21
 */

import { Card, Badge } from '@verone/ui';
import {
  User as _User,
  Building2 as _Building2,
  Share2,
  Mail,
  Phone,
} from 'lucide-react';

import type { OrganisationContact } from '@/lib/hooks/use-organisation-contacts';

// ============================================================================
// TYPES
// ============================================================================

interface ContactDisplayCardProps {
  /** Contact data */
  contact: OrganisationContact;
  /** Affichage compact (sans détails) */
  compact?: boolean;
  /** Montrer le badge d'appartenance (enseigne/restaurant/partagé) */
  showOwnershipBadge?: boolean;
  /** ID de l'organisation pour déterminer le badge */
  organisationId?: string | null;
  /** ID de l'enseigne pour déterminer le badge */
  enseigneId?: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContactDisplayCard({
  contact,
  compact = false,
  showOwnershipBadge = false,
}: ContactDisplayCardProps) {
  const displayName = `${contact.firstName} ${contact.lastName}`;
  const initials =
    `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();

  // Déterminer les rôles
  const roles: string[] = [];
  if (contact.isPrimaryContact) roles.push('Principal');
  if (contact.isBillingContact) roles.push('Facturation');
  if (contact.isCommercialContact) roles.push('Commercial');
  if (contact.isTechnicalContact) roles.push('Technique');

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
          <span className="text-sm font-medium text-blue-700">{initials}</span>
        </div>

        {/* Informations */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{displayName}</p>

          {/* Fonction/Titre */}
          {contact.title && (
            <p className="text-sm text-gray-500 truncate">{contact.title}</p>
          )}

          {/* Email et téléphone (si pas compact) */}
          {!compact && (
            <div className="mt-2 space-y-1">
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1.5 truncate"
              >
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </a>
              {(Boolean(contact.phone) || Boolean(contact.mobile)) && (
                <a
                  href={`tel:${contact.phone ?? contact.mobile}`}
                  className="text-sm text-gray-600 hover:underline flex items-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{contact.phone ?? contact.mobile}</span>
                </a>
              )}
            </div>
          )}

          {/* Badges rôles */}
          {roles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {roles.map(role => (
                <Badge key={role} variant="secondary" size="sm">
                  {role}
                </Badge>
              ))}
            </div>
          )}

          {/* Badge appartenance (optionnel) */}
          {showOwnershipBadge && (
            <div className="mt-2">
              <Badge
                variant="outline"
                size="sm"
                className="bg-purple-50 text-purple-700 border-purple-200"
              >
                <Share2 className="mr-1 h-3 w-3" />
                Partagé
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ContactDisplayCard;
