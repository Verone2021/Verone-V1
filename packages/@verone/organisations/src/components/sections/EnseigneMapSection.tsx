'use client';

/**
 * EnseigneMapSection - Carte interactive pleine largeur des organisations
 *
 * Layout : carte pleine largeur (600px) + FAB pour ouvrir le modal OrgBrowseModal
 * Features : Supercluster clustering, markers bleu/orange, KPIs, popups
 *
 * @module EnseigneMapSection
 * @since 2026-02-19
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@verone/utils';
import {
  Building2,
  ChevronRight,
  List,
  Mail,
  MapPin,
  Phone,
  X,
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from 'react-map-gl/maplibre';
import Supercluster from 'supercluster';

import 'maplibre-gl/dist/maplibre-gl.css';

import type { MapOrganisation } from '../../hooks/use-enseigne-map-data';
import { OrgBrowseModal } from '../modals/OrgBrowseModal';

// ============================================
// TYPES
// ============================================

interface EnseigneMapSectionProps {
  organisations: MapOrganisation[];
  totalOrganisations: number;
  propresCount: number;
  franchisesCount: number;
  withCoordinatesCount: number;
  loading?: boolean;
  className?: string;
  enseigneName?: string;
  /** Callback when clicking "Voir détails" on an org */
  onViewOrganisation?: (organisationId: string) => void;
}

interface PointProperties {
  cluster: false;
  orgId: string;
  orgIndex: number;
}

interface ClusterProperties {
  cluster: boolean;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: string;
}

// ============================================
// CONSTANTS
// ============================================

const FRANCE_CENTER = { longitude: 2.5, latitude: 46.5 };
const DEFAULT_ZOOM = 5.5;
const MAX_ZOOM = 18;
const MIN_ZOOM = 3;
const ZOOM_BONUS = 3;
const FITBOUNDS_PADDING = 60;

const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

const BLUE = '#3B82F6';
const ORANGE = '#F97316';

// ============================================
// MARKER COMPONENTS
// ============================================

function MarkerPin({
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

function ClusterMarker({
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

function OrgPopup({
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

      {/* Header */}
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

      {/* Address */}
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

      {/* Contact */}
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

      {/* Action */}
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

function KPICards({
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

function MapSkeleton() {
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

// ============================================
// MAIN COMPONENT
// ============================================

export function EnseigneMapSection({
  organisations,
  totalOrganisations,
  propresCount,
  franchisesCount,
  withCoordinatesCount,
  loading = false,
  className,
  enseigneName = "l'enseigne",
  onViewOrganisation,
}: EnseigneMapSectionProps): React.JSX.Element {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: FRANCE_CENTER.longitude,
    latitude: FRANCE_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
  });
  const [selectedOrg, setSelectedOrg] = useState<MapOrganisation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter organisations with valid coordinates for the map
  const validOrganisations = useMemo(
    () =>
      organisations.filter(
        org => org.latitude !== null && org.longitude !== null
      ),
    [organisations]
  );

  // GeoJSON points for Supercluster
  const points = useMemo<GeoJSON.Feature<GeoJSON.Point, PointProperties>[]>(
    () =>
      validOrganisations.map((org, index) => ({
        type: 'Feature' as const,
        properties: {
          cluster: false as const,
          orgId: org.id,
          orgIndex: index,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [org.longitude!, org.latitude!],
        },
      })),
    [validOrganisations]
  );

  // Supercluster instance
  const supercluster = useMemo(() => {
    const sc = new Supercluster<PointProperties, ClusterProperties>({
      radius: 50,
      maxZoom: 16,
    });
    sc.load(points);
    return sc;
  }, [points]);

  // Compute clusters for current viewport
  const clusters = useMemo(() => {
    const bounds = mapRef.current?.getMap()?.getBounds();
    if (!bounds) {
      return supercluster.getClusters(
        [-5, 41, 10, 52],
        Math.floor(viewState.zoom)
      );
    }
    return supercluster.getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      Math.floor(viewState.zoom)
    );
  }, [supercluster, viewState.zoom]);

  // Auto-fit bounds on mount
  useEffect(() => {
    if (validOrganisations.length === 0 || !mapRef.current) return;

    const map = mapRef.current.getMap();
    const bounds = new maplibregl.LngLatBounds();
    validOrganisations.forEach(org => {
      bounds.extend([org.longitude!, org.latitude!]);
    });

    map.fitBounds(bounds, {
      padding: FITBOUNDS_PADDING,
      maxZoom: 12,
      duration: 1000,
    });
  }, [validOrganisations]);

  // Cluster click handler
  const handleClusterClick = useCallback(
    (clusterId: number, longitude: number, latitude: number) => {
      const baseZoom = supercluster.getClusterExpansionZoom(clusterId);
      const expansionZoom = Math.min(baseZoom + ZOOM_BONUS, MAX_ZOOM);
      mapRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: expansionZoom,
        duration: 500,
      });
    },
    [supercluster]
  );

  // Marker click handler
  const handleMarkerClick = useCallback(
    (org: MapOrganisation) => {
      setSelectedOrg(org);
      mapRef.current?.flyTo({
        center: [org.longitude!, org.latitude!],
        zoom: Math.max(viewState.zoom, 13),
        duration: 800,
      });
    },
    [viewState.zoom]
  );

  // FlyTo handler from modal
  const handleFlyToOrganisation = useCallback(
    (org: MapOrganisation) => {
      if (org.latitude !== null && org.longitude !== null) {
        setSelectedOrg(org);
        mapRef.current?.flyTo({
          center: [org.longitude, org.latitude],
          zoom: Math.max(viewState.zoom, 14),
          duration: 800,
        });
      }
    },
    [viewState.zoom]
  );

  if (loading) {
    return <MapSkeleton />;
  }

  // Empty state
  if (validOrganisations.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg overflow-hidden border border-gray-200',
          className
        )}
      >
        <div className="h-[400px] flex flex-col items-center justify-center bg-gray-50">
          <MapPin className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Aucune organisation géolocalisée
          </h3>
          <p className="text-gray-500 text-sm text-center max-w-md">
            {totalOrganisations > 0
              ? `${totalOrganisations} organisation${totalOrganisations > 1 ? 's' : ''} trouvée${totalOrganisations > 1 ? 's' : ''}, mais aucune n'a de coordonnées GPS.`
              : "Aucune organisation n'est rattachée à cette enseigne."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* KPIs */}
      <KPICards
        total={totalOrganisations}
        propres={propresCount}
        franchises={franchisesCount}
        withGPS={withCoordinatesCount}
      />

      {/* Map container */}
      <div
        className="relative rounded-b-lg overflow-hidden border border-gray-200"
        style={{
          height: 'calc(100vh - 320px)',
          minHeight: 400,
          maxHeight: 600,
        }}
      >
        {/* Full-width map */}
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle={MAP_STYLE}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />

          {/* Clusters + individual markers */}
          {clusters.map(cluster => {
            const [longitude, latitude] = cluster.geometry.coordinates;
            const props = cluster.properties;

            if (props.cluster) {
              return (
                <Marker
                  key={`cluster-${props.cluster_id}`}
                  longitude={longitude}
                  latitude={latitude}
                  anchor="center"
                >
                  <ClusterMarker
                    count={props.point_count}
                    onClick={() =>
                      handleClusterClick(props.cluster_id, longitude, latitude)
                    }
                  />
                </Marker>
              );
            }

            const org = validOrganisations[props.orgIndex];
            if (!org) return null;

            const isPropre =
              org.ownership_type === 'propre' ||
              org.ownership_type === 'succursale';

            return (
              <Marker
                key={org.id}
                longitude={longitude}
                latitude={latitude}
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  handleMarkerClick(org);
                }}
              >
                <MarkerPin color={isPropre ? 'blue' : 'orange'} />
              </Marker>
            );
          })}

          {/* Popup */}
          {selectedOrg?.longitude != null && selectedOrg?.latitude != null && (
            <Popup
              longitude={selectedOrg.longitude}
              latitude={selectedOrg.latitude}
              anchor="bottom"
              offset={35}
              onClose={() => setSelectedOrg(null)}
              closeOnClick={false}
              closeButton={false}
            >
              <OrgPopup
                org={selectedOrg}
                onClose={() => setSelectedOrg(null)}
                onViewDetails={onViewOrganisation}
              />
            </Popup>
          )}
        </Map>

        {/* FAB - Open organisations list */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg text-gray-900 text-sm font-medium shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <List className="h-4 w-4" />
          <span>
            {totalOrganisations} organisation
            {totalOrganisations > 1 ? 's' : ''}
          </span>
        </button>
      </div>

      {/* Browse Modal */}
      <OrgBrowseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        organisations={organisations}
        totalOrganisations={totalOrganisations}
        propresCount={propresCount}
        franchisesCount={franchisesCount}
        enseigneName={enseigneName}
        onFlyToOrganisation={handleFlyToOrganisation}
        onViewOrganisation={onViewOrganisation}
      />
    </div>
  );
}
