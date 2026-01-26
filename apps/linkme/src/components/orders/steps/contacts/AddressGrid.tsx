'use client';

/**
 * AddressGrid - Grille de cartes d'adresses
 *
 * Affiche les adresses sous forme de grille (1-2-3 colonnes responsive)
 * avec option "Adresse restaurant" et bouton "+ Nouvelle adresse"
 *
 * @module AddressGrid
 * @since 2026-01-20
 */

import { Card, cn } from '@verone/ui';
import { Building2, Plus, Check } from 'lucide-react';

import type { Address } from '@/lib/hooks/use-entity-addresses';

import { AddressCard } from './AddressCard';

// ============================================================================
// TYPES
// ============================================================================

interface AddressGridProps {
  /** Liste des adresses disponibles */
  addresses: Address[];
  /** ID de l'adresse sélectionnée (null si "restaurant address" ou "new") */
  selectedId: string | null;
  /** Callback quand une adresse est sélectionnée */
  onSelect: (address: Address) => void;
  /** Callback quand l'utilisateur veut créer une nouvelle adresse */
  onCreateNew: () => void;
  /** Mode création actif (pour highlight) */
  isCreatingNew?: boolean;
  /** Afficher l'option "Adresse du restaurant" */
  showRestaurantAddressOption?: boolean;
  /** Callback quand "Adresse du restaurant" est cliqué */
  onSelectRestaurantAddress?: () => void;
  /** Indique si "Adresse du restaurant" est actuellement active */
  isRestaurantAddressActive?: boolean;
  /** Nom du restaurant (pour affichage) */
  restaurantName?: string;
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
          Nouvelle adresse
        </span>
      </div>
    </Card>
  );
}

// ============================================================================
// SUB-COMPONENT: Restaurant Address Card
// ============================================================================

interface RestaurantAddressCardProps {
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
  restaurantName?: string;
}

function RestaurantAddressCard({
  onClick,
  isActive,
  disabled,
  restaurantName,
}: RestaurantAddressCardProps) {
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
          <Building2
            className={cn(
              'h-4 w-4',
              isActive ? 'text-green-600' : 'text-gray-500'
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              Adresse restaurant
            </h3>
            {isActive && (
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {restaurantName || 'Utiliser adresse du restaurant'}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AddressGrid({
  addresses,
  selectedId,
  onSelect,
  onCreateNew,
  isCreatingNew = false,
  showRestaurantAddressOption = false,
  onSelectRestaurantAddress,
  isRestaurantAddressActive = false,
  restaurantName,
  label,
  disabled = false,
}: AddressGridProps) {
  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Option: Restaurant address (default) */}
        {showRestaurantAddressOption && onSelectRestaurantAddress && (
          <RestaurantAddressCard
            onClick={onSelectRestaurantAddress}
            isActive={isRestaurantAddressActive}
            disabled={disabled}
            restaurantName={restaurantName}
          />
        )}

        {/* Existing addresses */}
        {addresses.map(address => (
          <AddressCard
            key={address.id}
            address={address}
            isSelected={
              selectedId === address.id &&
              !isRestaurantAddressActive &&
              !isCreatingNew
            }
            onClick={() => onSelect(address)}
            disabled={disabled}
          />
        ))}

        {/* Create new card */}
        <CreateNewCard
          onClick={onCreateNew}
          isActive={isCreatingNew && !isRestaurantAddressActive}
          disabled={disabled}
        />
      </div>

      {/* Empty state */}
      {addresses.length === 0 && !showRestaurantAddressOption && (
        <p className="text-sm text-gray-500 italic text-center py-2">
          Aucune adresse enregistrée
        </p>
      )}
    </div>
  );
}

export default AddressGrid;
