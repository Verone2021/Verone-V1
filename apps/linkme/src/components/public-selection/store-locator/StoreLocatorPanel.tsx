'use client';

/**
 * StoreLocatorPanel - Panneau latéral gauche avec liste et recherche
 *
 * @module StoreLocatorPanel
 * @since 2026-04-14
 */

import Image from 'next/image';

import { MapPin, Search, Store, X } from 'lucide-react';

import type { IBranding, IOrganisation } from './types';
export type { IBranding, IOrganisation };

// ============================================================================
// STORE LIST ITEM
// ============================================================================

interface StoreListItemProps {
  org: IOrganisation;
  branding: IBranding;
  isSelected: boolean;
  onClick: () => void;
}

function StoreListItem({
  org,
  branding,
  isSelected,
  onClick,
}: StoreListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left transition-colors border-b border-white/10 ${
        isSelected ? 'bg-white/20' : 'hover:bg-white/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 h-9 w-9 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
          {branding.logo_url ? (
            <Image
              src={branding.logo_url}
              alt={org.name}
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          ) : (
            <Store className="h-4 w-4 text-white/70" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-white truncate">{org.name}</p>
          <p className="text-xs text-white/60 truncate">
            {org.postalCode} {org.city}
            {org.country && org.country !== 'France' && org.country !== 'FR'
              ? `, ${org.country}`
              : ''}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// STORE POPUP
// ============================================================================

export interface StorePopupOrg extends IOrganisation {
  latitude: number;
  longitude: number;
}

interface StorePopupProps {
  org: StorePopupOrg;
  branding: IBranding;
  onClose: () => void;
}

export function StorePopup({ org, branding, onClose }: StorePopupProps) {
  return (
    <div className="relative max-w-[260px] bg-white rounded-lg shadow-md p-3 space-y-2">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Fermer"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-center gap-2.5 pr-6">
        <div className="flex-shrink-0 h-9 w-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          {branding.logo_url ? (
            <Image
              src={branding.logo_url}
              alt={org.name}
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          ) : (
            <Store className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
          {org.name}
        </h3>
      </div>

      {(org.address ?? org.city) && (
        <div className="flex items-start gap-2 text-gray-600 text-xs">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <div>
            {org.address && <div>{org.address}</div>}
            {org.city && (
              <div>
                {org.postalCode} {org.city}
                {org.country && org.country !== 'France' && org.country !== 'FR'
                  ? `, ${org.country}`
                  : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {org.phone && (
        <a
          href={`tel:${org.phone.replace(/\s/g, '')}`}
          className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
          style={{ color: branding.primary_color }}
        >
          <span>📞</span> {org.phone}
        </a>
      )}
    </div>
  );
}

// ============================================================================
// PANEL COMPONENT
// ============================================================================

interface StoreLocatorPanelProps {
  organisations: IOrganisation[];
  selectedOrgId: string | undefined;
  searchQuery: string;
  enseigneName: string;
  branding: IBranding;
  panelWidth: number;
  onSearchChange: (q: string) => void;
  onItemClick: (org: IOrganisation) => void;
  onClose: () => void;
}

export function StoreLocatorPanel({
  organisations,
  selectedOrgId,
  searchQuery,
  enseigneName,
  branding,
  panelWidth,
  onSearchChange,
  onItemClick,
  onClose,
}: StoreLocatorPanelProps) {
  return (
    <div
      className="absolute top-4 left-4 bottom-4 z-10 flex flex-col rounded-xl overflow-hidden shadow-2xl"
      style={{
        width: panelWidth,
        backgroundColor: `${branding.primary_color}E6`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-white">Points de vente</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer le panneau"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-white/70 text-sm mb-3">
          {organisations.length} établissement
          {organisations.length > 1 ? 's' : ''} {enseigneName}
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Rechercher une ville, un nom..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-white placeholder-white/40 border border-white/20 bg-white/10 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/50 hover:text-white"
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {organisations.length === 0 ? (
          <div className="p-4 text-center text-white/50 text-sm">
            Aucun résultat pour &quot;{searchQuery}&quot;
          </div>
        ) : (
          organisations.map(org => (
            <StoreListItem
              key={org.id}
              org={org}
              branding={branding}
              isSelected={selectedOrgId === org.id}
              onClick={() => onItemClick(org)}
            />
          ))
        )}
      </div>
    </div>
  );
}
