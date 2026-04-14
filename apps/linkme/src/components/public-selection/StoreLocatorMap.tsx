'use client';

/**
 * StoreLocatorMap - Carte immersive MapLibre GL pour page publique LinkMe
 *
 * @module StoreLocatorMap
 * @since 2026-02-04
 * @updated 2026-04-14 - Refactoring: extraction sous-composants
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MapPin, Store } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from 'react-map-gl/maplibre';
import Supercluster from 'supercluster';

import 'maplibre-gl/dist/maplibre-gl.css';

import { MarkerPin, ClusterMarker } from './store-locator/StoreLocatorMarkers';
import {
  StoreLocatorPanel,
  StorePopup,
  type StorePopupOrg,
} from './store-locator/StoreLocatorPanel';

import type { IBranding, IOrganisation } from './store-locator/types';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// CONSTANTS
// ============================================================================

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
const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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

  const validOrganisations = useMemo(
    () =>
      organisations.filter(
        org => org.latitude !== null && org.longitude !== null
      ),
    [organisations]
  );

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

  const points = useMemo<GeoJSON.Feature<GeoJSON.Point, PointProperties>[]>(
    () =>
      validOrganisations.map((org, index) => ({
        type: 'Feature' as const,
        properties: { cluster: false as const, orgId: org.id, orgIndex: index },
        geometry: {
          type: 'Point' as const,
          coordinates: [org.longitude!, org.latitude!],
        },
      })),
    [validOrganisations]
  );

  const supercluster = useMemo(() => {
    const sc = new Supercluster<PointProperties, ClusterProperties>({
      radius: 50,
      maxZoom: 16,
    });
    sc.load(points);
    return sc;
  }, [points]);

  const clusters = useMemo(() => {
    const bounds = mapRef.current?.getMap()?.getBounds();
    if (!bounds)
      return supercluster.getClusters(
        [-5, 41, 10, 52],
        Math.floor(viewState.zoom)
      );
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

  useEffect(() => {
    if (validOrganisations.length === 0 || !mapRef.current) return;
    const map = mapRef.current.getMap();
    const bounds = new maplibregl.LngLatBounds();
    validOrganisations.forEach(org =>
      bounds.extend([org.longitude!, org.latitude!])
    );
    map.fitBounds(bounds, {
      padding: FITBOUNDS_PADDING,
      maxZoom: 12,
      duration: 1000,
    });
  }, [validOrganisations]);

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
              org={selectedOrg as StorePopupOrg}
              branding={branding}
              onClose={() => setSelectedOrg(null)}
            />
          </Popup>
        )}
      </Map>

      {isPanelOpen && (
        <StoreLocatorPanel
          organisations={filteredOrganisations}
          selectedOrgId={selectedOrg?.id}
          searchQuery={searchQuery}
          enseigneName={enseigneName}
          branding={branding}
          panelWidth={PANEL_WIDTH}
          onSearchChange={setSearchQuery}
          onItemClick={handleListItemClick}
          onClose={() => setIsPanelOpen(false)}
        />
      )}

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
