'use client';

/**
 * OrgBrowseModal - Modal de navigation des organisations d'une enseigne
 *
 * Layout 2 colonnes :
 * - Gauche : Liste scrollable avec recherche et badges propre/franchise
 * - Droite : Détails de l'organisation sélectionnée
 *
 * Actions : "Voir sur la carte" (flyTo) et "Voir les détails" (navigation)
 *
 * @module OrgBrowseModal
 * @since 2026-02-19
 */

import { useMemo, useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Building2,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Search,
  X,
} from 'lucide-react';

import type { MapOrganisation } from '../../hooks/use-enseigne-map-data';

// ============================================
// TYPES
// ============================================

interface OrgBrowseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisations: MapOrganisation[];
  totalOrganisations: number;
  propresCount: number;
  franchisesCount: number;
  enseigneName: string;
  /** Called when user clicks "Voir sur la carte" - receives org to flyTo */
  onFlyToOrganisation?: (org: MapOrganisation) => void;
  /** Called when user clicks "Voir les détails" - navigates to org page */
  onViewOrganisation?: (organisationId: string) => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function OrgBrowseModal({
  open,
  onOpenChange,
  organisations,
  totalOrganisations,
  propresCount,
  franchisesCount,
  enseigneName,
  onFlyToOrganisation,
  onViewOrganisation,
}: OrgBrowseModalProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<MapOrganisation | null>(null);

  // Filter by search query
  const filteredOrganisations = useMemo(() => {
    if (!searchQuery.trim()) return organisations;
    const q = searchQuery.toLowerCase().trim();
    return organisations.filter(
      org =>
        (org.trade_name?.toLowerCase().includes(q) ?? false) ||
        org.legal_name.toLowerCase().includes(q) ||
        (org.city?.toLowerCase().includes(q) ?? false) ||
        (org.shipping_city?.toLowerCase().includes(q) ?? false) ||
        (org.shipping_postal_code?.toLowerCase().includes(q) ?? false)
    );
  }, [organisations, searchQuery]);

  // Reset state when modal opens
  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setSearchQuery('');
      setSelectedOrg(null);
    }
    onOpenChange(value);
  };

  const propresPercent =
    totalOrganisations > 0
      ? Math.round((propresCount / totalOrganisations) * 100)
      : 0;
  const franchisesPercent =
    totalOrganisations > 0
      ? Math.round((franchisesCount / totalOrganisations) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Organisations de {enseigneName}
            <span className="text-sm font-normal text-gray-500">
              ({totalOrganisations})
            </span>
          </DialogTitle>

          {/* KPIs */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">
                Propres {propresPercent}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="text-xs text-gray-600">
                Franchises {franchisesPercent}%
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Search bar */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, ville, code postal..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg text-sm text-gray-900 placeholder-gray-400 border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600"
                aria-label="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left: Organisation list */}
          <div className="w-[320px] flex-shrink-0 border-r border-gray-200 overflow-y-auto">
            {filteredOrganisations.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                Aucun résultat pour &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredOrganisations.map(org => {
                const displayName = org.trade_name ?? org.legal_name;
                const isPropre =
                  org.ownership_type === 'propre' ||
                  org.ownership_type === 'succursale';
                const hasCoordinates =
                  org.latitude !== null && org.longitude !== null;
                const isSelected = selectedOrg?.id === org.id;

                return (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={cn(
                      'w-full p-3 text-left transition-colors border-b border-gray-100',
                      isSelected
                        ? 'bg-blue-50 border-l-2 border-l-blue-500'
                        : 'hover:bg-gray-50',
                      !hasCoordinates && 'opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div
                          className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center',
                            isPropre ? 'bg-blue-100' : 'bg-orange-100'
                          )}
                        >
                          <Building2
                            className={cn(
                              'h-4 w-4',
                              isPropre ? 'text-blue-600' : 'text-orange-600'
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {displayName}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 truncate">
                            {org.shipping_postal_code ?? ''}{' '}
                            {org.shipping_city ?? org.city ?? ''}
                          </p>
                          <span
                            className={cn(
                              'inline-block flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium',
                              isPropre
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-orange-100 text-orange-700'
                            )}
                          >
                            {isPropre ? 'Propre' : 'Franchise'}
                          </span>
                        </div>
                      </div>
                      {!hasCoordinates && (
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          Pas de GPS
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Organisation details */}
          <div className="flex-1 overflow-y-auto">
            {!selectedOrg ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Building2 className="h-12 w-12 mb-3" />
                <p className="text-sm">
                  Sélectionnez une organisation pour voir ses détails
                </p>
              </div>
            ) : (
              <OrgDetailPanel
                org={selectedOrg}
                onFlyTo={
                  onFlyToOrganisation
                    ? () => {
                        onFlyToOrganisation(selectedOrg);
                        handleOpenChange(false);
                      }
                    : undefined
                }
                onViewDetails={
                  onViewOrganisation
                    ? () => {
                        onViewOrganisation(selectedOrg.id);
                      }
                    : undefined
                }
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DETAIL PANEL
// ============================================

function OrgDetailPanel({
  org,
  onFlyTo,
  onViewDetails,
}: {
  org: MapOrganisation;
  onFlyTo?: () => void;
  onViewDetails?: () => void;
}) {
  const displayName = org.trade_name ?? org.legal_name;
  const isPropre =
    org.ownership_type === 'propre' || org.ownership_type === 'succursale';
  const hasCoordinates = org.latitude !== null && org.longitude !== null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center',
            isPropre ? 'bg-blue-100' : 'bg-orange-100'
          )}
        >
          <Building2
            className={cn(
              'h-6 w-6',
              isPropre ? 'text-blue-600' : 'text-orange-600'
            )}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
          {org.trade_name && org.legal_name !== org.trade_name && (
            <p className="text-sm text-gray-500">{org.legal_name}</p>
          )}
          <span
            className={cn(
              'inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
              isPropre
                ? 'bg-blue-100 text-blue-700'
                : 'bg-orange-100 text-orange-700'
            )}
          >
            {isPropre ? 'Propre / Succursale' : 'Franchise'}
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div className="space-y-4">
        {/* Address */}
        {(org.shipping_address_line1 ?? org.shipping_city ?? org.city) && (
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                Adresse
              </p>
              {org.shipping_address_line1 && (
                <p className="text-sm text-gray-900">
                  {org.shipping_address_line1}
                </p>
              )}
              {(org.shipping_postal_code ?? org.shipping_city) && (
                <p className="text-sm text-gray-900">
                  {org.shipping_postal_code} {org.shipping_city ?? org.city}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Phone */}
        {org.phone && (
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                Téléphone
              </p>
              <p className="text-sm text-gray-900">{org.phone}</p>
            </div>
          </div>
        )}

        {/* Email */}
        {org.email && (
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                Email
              </p>
              <p className="text-sm text-gray-900">{org.email}</p>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-start gap-3">
          <div className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
              Statut
            </p>
            <span
              className={cn(
                'inline-block px-2 py-0.5 rounded text-xs font-medium',
                org.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {org.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
        {onFlyTo && hasCoordinates && (
          <button
            onClick={onFlyTo}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Voir sur la carte
          </button>
        )}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Voir les détails
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
