'use client';

/**
 * ContactGrid - Grille de cartes de contact
 *
 * Affiche les contacts sous forme de grille (1-2-3 colonnes responsive)
 * avec options spéciales (Même que responsable) et bouton "+ Nouveau"
 *
 * @module ContactGrid
 * @since 2026-01-20
 */

import { Card, cn } from '@verone/ui';
import { User, Plus, Check } from 'lucide-react';

import type { OrganisationContact } from '@/lib/hooks/use-organisation-contacts';

import { ContactCard } from './ContactCard';

// ============================================================================
// TYPES
// ============================================================================

interface ContactGridProps {
  /** Liste des contacts disponibles */
  contacts: OrganisationContact[];
  /** ID du contact sélectionné */
  selectedId: string | null;
  /** Callback quand un contact est sélectionné */
  onSelect: (contact: OrganisationContact) => void;
  /** Callback quand l'utilisateur veut créer un nouveau contact */
  onCreateNew: () => void;
  /** Mode création actif (pour highlight) */
  isCreatingNew?: boolean;
  /** Afficher l'option "Même que responsable" */
  showSameAsOption?: boolean;
  /** Callback quand "Même que responsable" est cliqué */
  onSameAsResponsable?: () => void;
  /** Indique si "Même que responsable" est actuellement actif */
  isSameAsResponsableActive?: boolean;
  /** Label optionnel au-dessus de la grille */
  label?: string;
  /** Désactiver toute interaction */
  disabled?: boolean;
}

// ============================================================================
// SUB-COMPONENT: Create New Card
// ============================================================================

interface CreateNewCardProps {
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
}

function CreateNewCard({ onClick, isActive, disabled }: CreateNewCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
        isActive
          ? 'border-2 border-blue-500 bg-blue-50/50'
          : 'hover:border-gray-400',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
        <Plus
          className={cn(
            'h-5 w-5',
            isActive ? 'text-blue-500' : 'text-gray-400'
          )}
        />
        <span
          className={cn(
            'font-medium text-sm',
            isActive ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          Nouveau contact
        </span>
      </div>
    </Card>
  );
}

// ============================================================================
// SUB-COMPONENT: Same As Responsable Card
// ============================================================================

interface SameAsCardProps {
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
}

function SameAsCard({ onClick, isActive, disabled }: SameAsCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md',
        isActive
          ? 'border-2 border-green-500 bg-green-50/50'
          : 'hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isActive ? 'bg-green-100' : 'bg-gray-100'
          )}
        >
          <User
            className={cn('h-4 w-4', isActive ? 'text-green-600' : 'text-gray-500')}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              Même que responsable
            </h3>
            {isActive && (
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Utiliser le contact responsable de commande
          </p>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContactGrid({
  contacts,
  selectedId,
  onSelect,
  onCreateNew,
  isCreatingNew = false,
  showSameAsOption = false,
  onSameAsResponsable,
  isSameAsResponsableActive = false,
  label,
  disabled = false,
}: ContactGridProps) {
  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Option: Same as responsable */}
        {showSameAsOption && onSameAsResponsable && (
          <SameAsCard
            onClick={onSameAsResponsable}
            isActive={isSameAsResponsableActive}
            disabled={disabled}
          />
        )}

        {/* Existing contacts */}
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            isSelected={selectedId === contact.id && !isSameAsResponsableActive}
            onClick={() => onSelect(contact)}
            disabled={disabled}
          />
        ))}

        {/* Create new card */}
        <CreateNewCard
          onClick={onCreateNew}
          isActive={isCreatingNew && !isSameAsResponsableActive}
          disabled={disabled}
        />
      </div>

      {/* Empty state */}
      {contacts.length === 0 && !showSameAsOption && (
        <p className="text-sm text-gray-500 italic text-center py-2">
          Aucun contact existant
        </p>
      )}
    </div>
  );
}

export default ContactGrid;
