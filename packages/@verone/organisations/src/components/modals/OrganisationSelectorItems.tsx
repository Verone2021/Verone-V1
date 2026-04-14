'use client';

/**
 * Sub-components for OrganisationSelectorModal
 * - OrganisationSkeleton: loading placeholder
 * - AvailableOrganisationItem: left column item
 * - SelectedOrganisationItem: right column item
 */

import { ButtonV2 } from '@verone/ui';
import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { Building2, Plus, X, Star, Loader2, MapPin } from 'lucide-react';

import { OrganisationLogo } from '../display/OrganisationLogo';

// ============================================================================
// TYPES
// ============================================================================

export interface OrganisationListItem {
  id: string;
  legal_name: string;
  trade_name: string | null;
  is_active: boolean | null;
  city: string | null;
  country: string | null;
  enseigne_id: string | null;
  is_enseigne_parent: boolean;
  type: string;
  logo_url: string | null;
}

export interface SelectedOrganisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  is_active: boolean | null;
  city: string | null;
  country: string | null;
  is_enseigne_parent: boolean;
  logo_url: string | null;
}

// ============================================================================
// SKELETON
// ============================================================================

export function OrganisationSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="space-y-2">
          <div className="w-32 h-4 bg-gray-200 rounded" />
          <div className="w-20 h-3 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="w-8 h-8 bg-gray-200 rounded" />
    </div>
  );
}

// ============================================================================
// AVAILABLE ITEM (left column)
// ============================================================================

export function AvailableOrganisationItem({
  organisation,
  onAdd,
  loading,
}: {
  organisation: OrganisationListItem;
  onAdd: () => void;
  loading: boolean;
}) {
  const displayName = organisation.trade_name ?? organisation.legal_name;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border border-gray-200',
        'hover:border-gray-300 hover:bg-gray-50 transition-all duration-200',
        'group cursor-pointer'
      )}
      onClick={onAdd}
    >
      <div className="flex items-center gap-3 min-w-0">
        <OrganisationLogo
          logoUrl={organisation.logo_url}
          organisationName={organisation.legal_name}
          size="sm"
          fallback="initials"
          className="flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {displayName}
          </p>
          {organisation.city && (
            <p className="text-xs text-gray-500 flex items-center">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {organisation.city}
                {organisation.country && `, ${organisation.country}`}
              </span>
            </p>
          )}
        </div>
      </div>

      <ButtonV2
        variant="ghost"
        size="sm"
        disabled={loading}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => {
          e.stopPropagation();
          onAdd();
        }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </ButtonV2>
    </div>
  );
}

// ============================================================================
// SELECTED ITEM (right column)
// ============================================================================

export function SelectedOrganisationItem({
  organisation,
  isParent,
  onRemove,
  onSetParent,
  canSetParent,
  loading,
}: {
  organisation: SelectedOrganisation;
  isParent: boolean;
  onRemove: () => void;
  onSetParent: () => void;
  canSetParent: boolean;
  loading: boolean;
}) {
  const displayName = organisation.trade_name ?? organisation.legal_name;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-all duration-200',
        isParent
          ? 'bg-amber-50 border-amber-200 shadow-sm'
          : 'bg-white border-gray-200 hover:border-gray-300'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <OrganisationLogo
          logoUrl={organisation.logo_url}
          organisationName={organisation.legal_name}
          size="sm"
          fallback="initials"
          className="flex-shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            {isParent && (
              <Badge variant="warning" className="text-xs flex-shrink-0">
                Mere
              </Badge>
            )}
          </div>
          {organisation.city && (
            <p className="text-xs text-gray-500 flex items-center">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {organisation.city}
                {organisation.country && `, ${organisation.country}`}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1 flex-shrink-0">
        {!isParent && canSetParent && (
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={onSetParent}
            disabled={loading}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            title="Definir comme societe mere"
          >
            <Star className="h-4 w-4" />
          </ButtonV2>
        )}

        <ButtonV2
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={loading}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </ButtonV2>
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATES
// ============================================================================

export function AvailableEmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="py-12 text-center">
      <Building2 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">
        {hasSearch
          ? 'Aucune organisation trouvee'
          : 'Toutes les organisations sont assignees'}
      </p>
    </div>
  );
}
