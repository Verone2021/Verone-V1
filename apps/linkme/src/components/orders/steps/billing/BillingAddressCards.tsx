'use client';

/**
 * BillingAddressCards - Cartes de sélection d'adresse de facturation
 *
 * @module BillingAddressCards
 * @since 2026-04-14
 */

import { Card, Badge, cn } from '@verone/ui';
import { MapPin, Building2 } from 'lucide-react';

// ============================================================================
// RESTAURANT ADDRESS CARD
// ============================================================================

export interface RestaurantAddressCardProps {
  onClick: () => void;
  isActive: boolean;
  restaurantName: string | null;
  legalName?: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
  city?: string | null;
  siret?: string | null;
  isIncomplete?: boolean;
}

export function RestaurantAddressCard({
  onClick,
  isActive,
  restaurantName,
  legalName,
  addressLine1,
  postalCode,
  city,
  siret,
  isIncomplete,
}: RestaurantAddressCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all',
        isActive
          ? 'border-2 border-blue-400 bg-blue-50/30 shadow-md'
          : 'hover:border-blue-300 hover:bg-blue-50/20 hover:shadow-sm'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isActive ? 'bg-blue-100' : 'bg-gray-100'
          )}
        >
          <Building2
            className={cn(
              'h-4 w-4',
              isActive ? 'text-blue-600' : 'text-gray-500'
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              Adresse restaurant
            </h3>
            {isIncomplete && (
              <Badge
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-300 bg-amber-50 flex-shrink-0"
              >
                Incomplet
              </Badge>
            )}
          </div>
          <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">
            {legalName ?? restaurantName ?? 'Restaurant'}
          </p>
          {addressLine1 && (
            <p className="text-xs text-gray-500 truncate">{addressLine1}</p>
          )}
          {(postalCode ?? city) && (
            <p className="text-xs text-gray-500 truncate">
              {[postalCode, city].filter(Boolean).join(' ')}
            </p>
          )}
          {siret && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              SIRET: {siret}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// PARENT ADDRESS CARD
// ============================================================================

export interface ParentAddressCardProps {
  onClick: () => void;
  isActive: boolean;
  parentName: string | null;
  legalName?: string | null;
  addressLine1: string | null;
  postalCode?: string | null;
  city: string | null;
  siret?: string | null;
  isIncomplete?: boolean;
}

export function ParentAddressCard({
  onClick,
  isActive,
  parentName,
  legalName,
  addressLine1,
  postalCode,
  city,
  siret,
  isIncomplete,
}: ParentAddressCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all',
        isActive
          ? 'border-2 border-purple-400 bg-purple-50/30 shadow-md'
          : 'hover:border-purple-300 hover:bg-purple-50/20 hover:shadow-sm'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isActive ? 'bg-purple-100' : 'bg-gray-100'
          )}
        >
          <Building2
            className={cn(
              'h-4 w-4',
              isActive ? 'text-purple-600' : 'text-gray-500'
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              Maison mere
            </h3>
            <Badge
              variant="outline"
              size="sm"
              className="text-purple-600 border-purple-300 bg-purple-50 flex-shrink-0"
            >
              Siege
            </Badge>
            {isIncomplete && (
              <Badge
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-300 bg-amber-50 flex-shrink-0"
              >
                Incomplet
              </Badge>
            )}
          </div>
          <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">
            {legalName ?? parentName ?? 'Organisation mere'}
          </p>
          {addressLine1 && (
            <p className="text-xs text-gray-500 truncate">{addressLine1}</p>
          )}
          {(postalCode ?? city) && (
            <p className="text-xs text-gray-500 truncate">
              {[postalCode, city].filter(Boolean).join(' ')}
            </p>
          )}
          {siret && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              SIRET: {siret}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// NEW ADDRESS CARD
// ============================================================================

export interface NewAddressCardProps {
  onClick: () => void;
  isActive: boolean;
}

export function NewAddressCard({ onClick, isActive }: NewAddressCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
        isActive
          ? 'border-2 border-blue-500 bg-blue-50/50'
          : 'hover:border-gray-400'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
        <MapPin
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
