'use client';

/**
 * OrganisationGrid - Grille de cartes d'organisation
 *
 * Affiche les organisations sous forme de grille (1-2-3 colonnes responsive)
 * avec option "+ Autre organisation" pour saisie manuelle
 *
 * @module OrganisationGrid
 * @since 2026-01-20
 */

import { Card, cn } from '@verone/ui';
import { Plus, Building2 } from 'lucide-react';

import { OrganisationCard, type BillingOrganisation } from './OrganisationCard.legacy';

// ============================================================================
// TYPES
// ============================================================================

interface OrganisationGridProps {
  /** Liste des organisations disponibles */
  organisations: BillingOrganisation[];
  /** ID de l'organisation sélectionnée */
  selectedId: string | null;
  /** Callback quand une organisation est sélectionnée */
  onSelect: (organisation: BillingOrganisation) => void;
  /** Callback quand l'utilisateur veut saisir une autre organisation */
  onSelectOther: () => void;
  /** Mode "autre" actif (pour highlight) */
  isOtherSelected?: boolean;
  /** Label optionnel au-dessus de la grille */
  label?: string;
  /** Désactiver toute interaction */
  disabled?: boolean;
}

// ============================================================================
// SUB-COMPONENT: Other Organisation Card
// ============================================================================

interface OtherOrgCardProps {
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
}

function OtherOrgCard({ onClick, isActive, disabled }: OtherOrgCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
        isActive
          ? 'border-2 border-amber-500 bg-amber-50/50'
          : 'hover:border-gray-400',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isActive ? 'bg-amber-100' : 'bg-gray-100'
          )}
        >
          {isActive ? (
            <Building2 className="h-4 w-4 text-amber-600" />
          ) : (
            <Plus className="h-4 w-4 text-gray-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'font-semibold text-sm leading-tight',
              isActive ? 'text-amber-700' : 'text-gray-700'
            )}
          >
            Autre organisation
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Saisir manuellement les coordonnees
          </p>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrganisationGrid({
  organisations,
  selectedId,
  onSelect,
  onSelectOther,
  isOtherSelected = false,
  label,
  disabled = false,
}: OrganisationGridProps) {
  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Existing organisations */}
        {organisations.map((org) => (
          <OrganisationCard
            key={org.id}
            organisation={org}
            isSelected={selectedId === org.id && !isOtherSelected}
            onClick={() => onSelect(org)}
            disabled={disabled}
          />
        ))}

        {/* Other organisation card */}
        <OtherOrgCard
          onClick={onSelectOther}
          isActive={isOtherSelected}
          disabled={disabled}
        />
      </div>

      {/* Empty state */}
      {organisations.length === 0 && (
        <p className="text-sm text-gray-500 italic text-center py-2">
          Aucune organisation disponible
        </p>
      )}
    </div>
  );
}

export default OrganisationGrid;
