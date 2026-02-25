'use client';

/**
 * ContactDisplayCard - Carte d'affichage de contact
 *
 * Affiche un contact avec badges de rôle colorés alignés sur le workflow commandes :
 * - Principal (turquoise) = responsable_contact_id dans les commandes
 * - Facturation (vert) = billing_contact_id dans les commandes
 *
 * Commercial et Technique sont masqués (non pertinents dans le workflow).
 *
 * @module ContactDisplayCard
 * @since 2026-01-21
 */

import { Badge } from '@verone/ui';
import { Mail, Phone } from 'lucide-react';

import type { OrganisationContact } from '@/lib/hooks/use-organisation-contacts';

// ============================================================================
// TYPES
// ============================================================================

interface ContactDisplayCardProps {
  /** Contact data */
  contact: OrganisationContact;
  /** Affichage compact (sans détails) */
  compact?: boolean;
  /** ID de l'enseigne pour couleur avatar */
  enseigneId?: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Couleur avatar selon contexte (enseigne = turquoise, org = bleu) */
function getAvatarColors(enseigneId: string | null | undefined): {
  bg: string;
  text: string;
} {
  if (enseigneId) {
    return { bg: 'bg-linkme-turquoise/10', text: 'text-linkme-turquoise' };
  }
  return { bg: 'bg-blue-100', text: 'text-blue-700' };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContactDisplayCard({
  contact,
  compact = false,
  enseigneId,
}: ContactDisplayCardProps) {
  const displayName = `${contact.firstName} ${contact.lastName}`;
  const initials =
    `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();
  const avatarColors = getAvatarColors(enseigneId);

  return (
    <div className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${avatarColors.bg}`}
        >
          <span className={`text-sm font-semibold ${avatarColors.text}`}>
            {initials}
          </span>
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

          {/* Badges rôles — uniquement Principal et Facturation */}
          {(contact.isPrimaryContact || contact.isBillingContact) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {contact.isPrimaryContact && (
                <Badge
                  variant="outline"
                  size="sm"
                  className="bg-linkme-turquoise/10 text-linkme-turquoise border-linkme-turquoise/30"
                >
                  Principal
                </Badge>
              )}
              {contact.isBillingContact && (
                <Badge
                  variant="outline"
                  size="sm"
                  className="bg-green-100 text-green-700 border-green-200"
                >
                  Facturation
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContactDisplayCard;
