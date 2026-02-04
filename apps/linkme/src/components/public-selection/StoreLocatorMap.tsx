'use client';

/**
 * StoreLocatorMap - Carte immersive MapLibre GL pour page publique LinkMe
 *
 * Layout : carte pleine largeur + panneau overlay gauche (recherche + liste)
 * Features : Supercluster clustering, flyTo, popups inline, fitBounds auto
 *
 * @module StoreLocatorMap
 * @since 2026-02-04
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MapPin, Search, Store, X } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import Image from 'next/image';
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from 'react-map-gl/maplibre';
import Supercluster from 'supercluster';

import 'maplibre-gl/dist/maplibre-gl.css';

// ============================================
// TYPES
// ============================================

interface IBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url: string | null;
}

interface IOrganisation {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface IStoreLocatorMapProps {
  organisations: IOrganisation[];
  branding: IBranding;
  enseigneName: string;
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
const PANEL_WIDTH = 380;
const FITBOUNDS_PADDING = {
  top: 60,
  bottom: 60,
  left: PANEL_WIDTH + 40,
  right: 60,
};

// Carto Voyager (gratuit, pas de token)
const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// ============================================
// MARKER COMPONENTS
// ============================================

interface MarkerPinProps {
  color: string;
  size?: number;
}

function MarkerPin({ color, size = 28 }: MarkerPinProps) {
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
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="11" r="4" fill="white" />
    </svg>
  );
}

interface ClusterMarkerProps {
  count: number;
  color: string;
  onClick: () => void;
}

function ClusterMarker({ count, color, onClick }: ClusterMarkerProps) {
  let size = 36;
  if (count >= 100) size = 52;
  else if (count >= 50) size = 48;
  else if (count >= 20) size = 44;
  else if (count >= 10) size = 40;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center rounded-full text-white font-bold shadow-lg cursor-pointer transition-transform hover:scale-110"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        border: '3px solid white',
        fontSize: count >= 100 ? 14 : 12,
      }}
    >
      {count}
    </div>
  );
}

// ============================================
// STORE LIST ITEM
// ============================================

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
            {org.country && org.country !== 'France' ? `, ${org.country}` : ''}
          </p>
        </div>
      </div>
    </button>
  );
}

// ============================================
// INLINE POPUP (simplified for public page)
// ============================================

interface StorePopupProps {
  org: IOrganisation;
  branding: IBranding;
  onClose: () => void;
}

function StorePopup({ org, branding, onClose }: StorePopupProps) {
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
                {org.country && org.country !== 'France'
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

// ============================================
// MAIN COMPONENT
// ============================================

export function StoreLocatorMap({
  organisations,
  branding,
  enseigneName,
}: IStoreLocatorMapProps): React.JSX.Element {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: FRANCE_CENTER.longitude,
    latitude: FRANCE_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
  });
  const [selectedOrg, setSelectedOrg] = useState<IOrganisation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Filter organisations with valid coordinates
  const validOrganisations = useMemo(
    () =>
      organisations.filter(
        org => org.latitude !== null && org.longitude !== null
      ),
    [organisations]
  );

  // Filter by search query
  const filteredOrganisations = useMemo(() => {
    if (!searchQuery.trim()) return validOrganisations;
    const q = searchQuery.toLowerCase().trim();
    return validOrganisations.filter(
      org =>
        org.name.toLowerCase().includes(q) ||
        (org.city?.toLowerCase().includes(q) ?? false) ||
        (org.postalCode?.toLowerCase().includes(q) ?? false) ||
        (org.address?.toLowerCase().includes(q) ?? false)
    );
  }, [validOrganisations, searchQuery]);

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
    (org: IOrganisation) => {
      setSelectedOrg(org);
      mapRef.current?.flyTo({
        center: [org.longitude!, org.latitude!],
        zoom: Math.max(viewState.zoom, 13),
        duration: 800,
      });
    },
    [viewState.zoom]
  );

  // List item click -> flyTo + popup
  const handleListItemClick = useCallback(
    (org: IOrganisation) => {
      setSelectedOrg(org);
      mapRef.current?.flyTo({
        center: [org.longitude!, org.latitude!],
        zoom: Math.max(viewState.zoom, 14),
        duration: 800,
      });
    },
    [viewState.zoom]
  );

  // Empty state
  if (validOrganisations.length === 0) {
    return (
      <section id="stores-section" className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Aucun point de vente configuré
            </h3>
            <p className="text-gray-500 text-sm">
              Les coordonnées GPS des établissements n&apos;ont pas encore été
              renseignées.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="stores-section"
      className="relative w-full"
      style={{ height: 'clamp(600px, calc(100vh - 80px), 900px)' }}
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
                  color={branding.primary_color}
                  onClick={() =>
                    handleClusterClick(props.cluster_id, longitude, latitude)
                  }
                />
              </Marker>
            );
          }

          const org = validOrganisations[props.orgIndex];
          if (!org) return null;

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
              <MarkerPin color={branding.primary_color} />
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
            <StorePopup
              org={selectedOrg}
              branding={branding}
              onClose={() => setSelectedOrg(null)}
            />
          </Popup>
        )}
      </Map>

      {/* Overlay panel - left side */}
      {isPanelOpen && (
        <div
          className="absolute top-4 left-4 bottom-4 z-10 flex flex-col rounded-xl overflow-hidden shadow-2xl"
          style={{
            width: PANEL_WIDTH,
            backgroundColor: `${branding.primary_color}E6`,
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Panel header */}
          <div className="p-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-white">Points de vente</h2>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Fermer le panneau"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-white/70 text-sm mb-3">
              {filteredOrganisations.length} établissement
              {filteredOrganisations.length > 1 ? 's' : ''} {enseigneName}
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                placeholder="Rechercher une ville, un nom..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-white placeholder-white/40 border border-white/20 bg-white/10 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/50 hover:text-white"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Store list */}
          <div className="flex-1 overflow-y-auto">
            {filteredOrganisations.length === 0 ? (
              <div className="p-4 text-center text-white/50 text-sm">
                Aucun résultat pour &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredOrganisations.map(org => (
                <StoreListItem
                  key={org.id}
                  org={org}
                  branding={branding}
                  isSelected={selectedOrg?.id === org.id}
                  onClick={() => handleListItemClick(org)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Toggle button when panel is closed */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: branding.primary_color }}
        >
          <Store className="h-4 w-4" />
          <span>
            {validOrganisations.length} point
            {validOrganisations.length > 1 ? 's' : ''} de vente
          </span>
        </button>
      )}
    </section>
  );
}
