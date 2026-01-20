'use client';

/**
 * ContactSelector - Sélecteur de contact existant ou création
 *
 * Affiche les contacts existants sous forme de badges cliquables
 * avec option pour créer un nouveau contact.
 *
 * @module ContactSelector
 * @since 2026-01-20
 */

import { cn, Badge, Button } from '@verone/ui';
import { Check, Plus, User, Building2 } from 'lucide-react';

import type { OrganisationContact } from '@/lib/hooks/use-organisation-contacts';

// ============================================================================
// TYPES
// ============================================================================

interface ContactSelectorProps {
  /** Liste des contacts disponibles */
  contacts: OrganisationContact[];
  /** ID du contact actuellement sélectionné */
  selectedId: string | null;
  /** Callback quand un contact est sélectionné */
  onSelect: (contact: OrganisationContact) => void;
  /** Callback quand l'utilisateur veut créer un nouveau contact */
  onCreateNew: () => void;
  /** Afficher l'option "Même que responsable" */
  showSameAsOption?: boolean;
  /** Callback quand "Même que responsable" est cliqué */
  onSameAsResponsable?: () => void;
  /** Indique si "Même que responsable" est actuellement actif */
  isSameAsResponsableActive?: boolean;
  /** Afficher l'option "Utiliser org mère" (succursale) */
  showParentOrgOption?: boolean;
  /** Callback quand "Utiliser org mère" est cliqué */
  onUseParentOrg?: () => void;
  /** Indique si "Utiliser org mère" est actuellement actif */
  isUseParentOrgActive?: boolean;
  /** Nom de l'org mère (pour affichage) */
  parentOrgName?: string;
  /** Label au-dessus de la sélection */
  label?: string;
  /** Désactiver toute interaction */
  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContactSelector({
  contacts,
  selectedId,
  onSelect,
  onCreateNew,
  showSameAsOption = false,
  onSameAsResponsable,
  isSameAsResponsableActive = false,
  showParentOrgOption = false,
  onUseParentOrg,
  isUseParentOrgActive = false,
  parentOrgName,
  label,
  disabled = false,
}: ContactSelectorProps) {
  // Format contact name for display
  const formatContactName = (contact: OrganisationContact) => {
    const name = `${contact.firstName} ${contact.lastName}`;
    if (contact.title) {
      return `${name} (${contact.title})`;
    }
    return name;
  };

  // Check if any special option is active
  const isAnySpecialOptionActive = isSameAsResponsableActive || isUseParentOrgActive;

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* Special options (same as responsable, use parent org) */}
      {(showSameAsOption || showParentOrgOption) && (
        <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
          {showSameAsOption && (
            <button
              type="button"
              onClick={onSameAsResponsable}
              disabled={disabled}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                isSameAsResponsableActive
                  ? 'bg-green-50 border-green-500 text-green-700 ring-2 ring-green-200'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSameAsResponsableActive && (
                <Check className="h-4 w-4 text-green-600" />
              )}
              <User className="h-4 w-4" />
              <span>Même contact que responsable</span>
            </button>
          )}

          {showParentOrgOption && (
            <button
              type="button"
              onClick={onUseParentOrg}
              disabled={disabled}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                isUseParentOrgActive
                  ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-200'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isUseParentOrgActive && (
                <Check className="h-4 w-4 text-purple-600" />
              )}
              <Building2 className="h-4 w-4" />
              <span>
                Facturer à l&apos;org mère
                {parentOrgName && (
                  <span className="font-medium ml-1">({parentOrgName})</span>
                )}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Existing contacts */}
      {!isAnySpecialOptionActive && contacts.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            Contacts existants
          </span>
          <div className="flex flex-wrap gap-2">
            {contacts.map((contact) => {
              const isSelected = selectedId === contact.id;
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => onSelect(contact)}
                  disabled={disabled}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                    isSelected
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                  <span>{formatContactName(contact)}</span>
                  {/* Role badges */}
                  {contact.isPrimaryContact && (
                    <Badge variant="info" size="sm" className="ml-1">
                      Principal
                    </Badge>
                  )}
                  {contact.isBillingContact && (
                    <Badge variant="secondary" size="sm" className="ml-1">
                      Facturation
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Create new button */}
      {!isAnySpecialOptionActive && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCreateNew}
          disabled={disabled}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau contact
        </Button>
      )}

      {/* Empty state */}
      {contacts.length === 0 && !isAnySpecialOptionActive && (
        <p className="text-sm text-gray-500 italic">
          Aucun contact existant. Créez-en un nouveau.
        </p>
      )}
    </div>
  );
}

export default ContactSelector;
