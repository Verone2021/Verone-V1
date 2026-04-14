'use client';

/**
 * Sub-components for EnseigneMapSection
 * - MarkerPin, ClusterMarker, OrgPopup, KPICards, MapSkeleton
 */

import { cn } from '@verone/utils';
import { Building2, ChevronRight, Mail, MapPin, Phone, X } from 'lucide-react';

import type { MapOrganisation } from '../../hooks/use-enseigne-map-data';

// ============================================
// CONSTANTS
// ============================================

export const BLUE = '#3B82F6';
export const ORANGE = '#F97316';
export const FRANCE_CENTER = { longitude: 2.5, latitude: 46.5 };
export const DEFAULT_ZOOM = 5.5;
export const MAX_ZOOM = 18;
export const MIN_ZOOM = 3;
export const ZOOM_BONUS = 3;
export const FITBOUNDS_PADDING = 60;
export const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// ============================================
// TYPES
// ============================================

export interface PointProperties {
  cluster: false;
  orgId: string;
  orgIndex: number;
}

export interface ClusterProperties {
  cluster: boolean;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: string;
}

// ============================================
// MARKER COMPONENTS
// ============================================

export function MarkerPin({
  color,
  size = 28,
}: {
  color: 'blue' | 'orange';
  size?: number;
}) {
  const fillColor = color === 'blue' ? BLUE : ORANGE;
  const strokeColor = color === 'blue' ? '#1D4ED8' : '#EA580C';

  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: 'pointer' }}
    >
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 20 12 20s12-11.75 12-20c0-6.627-5.373-12-12-12z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      <circle cx="12" cy="11" r="4" fill="white" />
    </svg>
  );
}

export function ClusterMarker({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  let size = 36;
  let bgColor = BLUE;

  if (count >= 100) {
    size = 52;
    bgColor = '#DC2626';
  } else if (count >= 50) {
    size = 48;
    bgColor = '#EA580C';
  } else if (count >= 20) {
    size = 44;
    bgColor = '#D97706';
  } else if (count >= 10) {
    size = 40;
    bgColor = '#059669';
  }

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center rounded-full text-white font-bold shadow-lg cursor-pointer transition-transform hover:scale-110"
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        border: '3px solid white',
        fontSize: count >= 100 ? 14 : 12,
      }}
    >
      {count}
    </div>
  );
}

// ============================================
// MAP POPUP
// ============================================

export function OrgPopup({
  org,
  onClose,
  onViewDetails,
}: {
  org: MapOrganisation;
  onClose: () => void;
  onViewDetails?: (id: string) => void;
}) {
  const displayName = org.trade_name ?? org.legal_name;
  const isPropre =
    org.ownership_type === 'propre' || org.ownership_type === 'succursale';

  return (
    <div className="relative max-w-[300px] bg-white rounded-lg shadow-md p-4 space-y-3">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 pr-6">
        <div
          className={cn(
            'flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
            isPropre ? 'bg-blue-100' : 'bg-orange-100'
          )}
        >
          <Building2
            className={cn(
              'h-5 w-5',
              isPropre ? 'text-blue-600' : 'text-orange-600'
            )}
          />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
            {displayName}
          </h3>
          <span
            className={cn(
              'inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
              isPropre
                ? 'bg-blue-100 text-blue-700'
                : 'bg-orange-100 text-orange-700'
            )}
          >
            {isPropre ? 'Propre' : 'Franchise'}
          </span>
        </div>
      </div>

      {(org.shipping_address_line1 ?? org.shipping_city ?? org.city) && (
        <div className="flex items-start gap-2 text-gray-600 text-sm">
          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
          <div>
            {org.shipping_address_line1 && (
              <div>{org.shipping_address_line1}</div>
            )}
            {(org.shipping_postal_code ?? org.shipping_city) && (
              <div>
                {org.shipping_postal_code} {org.shipping_city ?? org.city}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {org.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            <span>{org.phone}</span>
          </div>
        )}
        {org.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            <span className="truncate">{org.email}</span>
          </div>
        )}
      </div>

      {onViewDetails && (
        <button
          onClick={() => onViewDetails(org.id)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Voir détails
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// KPI CARDS
// ============================================

export function KPICards({
  total,
  propres,
  franchises,
  withGPS,
}: {
  total: number;
  propres: number;
  franchises: number;
  withGPS: number;
}) {
  const propresPercent = total > 0 ? Math.round((propres / total) * 100) : 0;
  const franchisesPercent =
    total > 0 ? Math.round((franchises / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-t-lg border border-gray-200 border-b-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-gray-900">{total}</span>
        <span className="text-xs text-gray-500">organisations</span>
      </div>
      <div className="w-px h-4 bg-gray-300" />
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
        <span className="text-xs text-gray-600">Propres {propresPercent}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
        <span className="text-xs text-gray-600">
          Franchises {franchisesPercent}%
        </span>
      </div>
      {withGPS < total && (
        <>
          <div className="w-px h-4 bg-gray-300" />
          <span className="text-xs text-gray-400">
            {total - withGPS} sans GPS
          </span>
        </>
      )}
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

export function MapSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <div className="h-[400px] bg-gray-100 animate-pulse flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Chargement de la carte...</p>
        </div>
      </div>
    </div>
  );
}
