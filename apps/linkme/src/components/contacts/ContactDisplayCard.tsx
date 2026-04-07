'use client';

/**
 * ContactDisplayCard - Carte compacte d'affichage de contact
 *
 * Affiche un contact avec badges de rôle colorés + badge "Utilisateur"
 * pour différencier les contacts liés à un compte utilisateur.
 *
 * @module ContactDisplayCard
 * @since 2026-01-21
 */

import { Badge } from '@verone/ui';
import { Mail, Phone, UserCheck } from 'lucide-react';

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
    <div className="rounded-lg border bg-white p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${avatarColors.bg}`}
        >
          <span className={`text-xs font-semibold ${avatarColors.text}`}>
            {initials}
          </span>
        </div>

        {/* Informations */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium break-words">{displayName}</p>
            {contact.isUser && (
              <Badge
                variant="outline"
                size="sm"
                className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-0.5 shrink-0"
              >
                <UserCheck className="h-3 w-3" />
                Utilisateur
              </Badge>
            )}
          </div>

          {/* Fonction/Titre */}
          {contact.title && (
            <p className="text-xs text-gray-500 truncate">{contact.title}</p>
          )}

          {/* Email et téléphone (si pas compact) */}
          {!compact && (
            <div className="mt-1.5 space-y-0.5">
              <a
                href={`mailto:${contact.email}`}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
              >
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </a>
              {(Boolean(contact.phone) || Boolean(contact.mobile)) && (
                <a
                  href={`tel:${contact.phone ?? contact.mobile}`}
                  className="text-xs text-gray-600 hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <span>{contact.phone ?? contact.mobile}</span>
                </a>
              )}
            </div>
          )}

          {/* Badges roles */}
          {(contact.isPrimaryContact ||
            contact.isBillingContact ||
            contact.isTechnicalContact) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {contact.isPrimaryContact && (
                <Badge
                  variant="outline"
                  size="sm"
                  className="bg-green-100 text-green-700 border-green-200 text-[10px]"
                >
                  Responsable
                </Badge>
              )}
              {contact.isBillingContact && (
                <Badge
                  variant="outline"
                  size="sm"
                  className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]"
                >
                  Facturation
                </Badge>
              )}
              {contact.isTechnicalContact && (
                <Badge
                  variant="outline"
                  size="sm"
                  className="bg-violet-100 text-violet-700 border-violet-200 text-[10px]"
                >
                  Technique
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
