'use client';

/**
 * MapLibreMapView - Carte interactive avec clustering
 *
 * Composant MapLibre GL pour afficher des organisations sur une carte
 * avec zoom, clustering pour zones denses, et popups interactifs.
 *
 * @module MapLibreMapView
 * @since 2026-01-12
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import maplibregl from 'maplibre-gl';
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

interface Organisation {
  id: string;
  trade_name: string | null;
  legal_name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  ownership_type?: 'propre' | 'franchise' | 'succursale' | null;
}

interface MapLibreMapViewProps {
  /** Liste des organisations à afficher */
  organisations: Organisation[];
  /** Hauteur de la carte en pixels */
  height?: number;
  /** Callback au clic sur un marker */
  onMarkerClick?: (org: Organisation) => void;
  /** Callback pour voir les détails d'une organisation */
  onViewDetails?: (organisationId: string) => void;
}

interface ClusterProperties {
  cluster: boolean;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: string;
}

interface PointProperties {
  cluster: false;
  orgId: string;
  orgIndex: number;
}

type GeoJSONPoint = GeoJSON.Feature<
  GeoJSON.Point,
  ClusterProperties | PointProperties
>;

// ============================================
// CONSTANTS
// ============================================

const FRANCE_CENTER = { longitude: 2.5, latitude: 46.5 };
const DEFAULT_ZOOM = 5.5;
const MAX_ZOOM = 18;
const MIN_ZOOM = 3;
const ZOOM_BONUS = 3; // Bonus de zoom pour clic cluster (plus agressif)

// Style Carto Voyager (coloré, gratuit, pas de token)
const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// ============================================
// MARKER COMPONENTS
// ============================================

interface MarkerPinProps {
  color: 'blue' | 'orange';
  size?: number;
}

function MarkerPin({ color, size = 28 }: MarkerPinProps) {
  const fillColor = color === 'blue' ? '#3B82F6' : '#F97316';
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

interface ClusterMarkerProps {
  count: number;
  onClick: () => void;
}

function ClusterMarker({ count, onClick }: ClusterMarkerProps) {
  // Taille et couleur basées sur le nombre de points
  let size = 36;
  let bgColor = '#3B82F6'; // blue-500

  if (count >= 100) {
    size = 52;
    bgColor = '#DC2626'; // red-600
  } else if (count >= 50) {
    size = 48;
    bgColor = '#EA580C'; // orange-600
  } else if (count >= 20) {
    size = 44;
    bgColor = '#D97706'; // amber-600
  } else if (count >= 10) {
    size = 40;
    bgColor = '#059669'; // emerald-600
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
// COMPONENT
// ============================================

export function MapLibreMapView({
  organisations,
  height = 500,
  onMarkerClick,
  onViewDetails,
}: MapLibreMapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: FRANCE_CENTER.longitude,
    latitude: FRANCE_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
  });
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);

  // Filtrer les organisations avec coordonnées valides
  const validOrganisations = useMemo(
    () =>
      organisations.filter(
        org => org.latitude !== null && org.longitude !== null
      ),
    [organisations]
  );

  // Créer les GeoJSON points pour Supercluster
  const points = useMemo<GeoJSON.Feature<GeoJSON.Point, PointProperties>[]>(
    () =>
      validOrganisations.map((org, index) => ({
        type: 'Feature',
        properties: {
          cluster: false as const,
          orgId: org.id,
          orgIndex: index,
        },
        geometry: {
          type: 'Point',
          coordinates: [org.longitude!, org.latitude!],
        },
      })),
    [validOrganisations]
  );

  // Initialiser Supercluster
  const supercluster = useMemo(() => {
    const cluster = new Supercluster<PointProperties, ClusterProperties>({
      radius: 50,
      maxZoom: 16,
    });
    cluster.load(points);
    return cluster;
  }, [points]);

  // Calculer les clusters pour le viewport actuel
  const clusters = useMemo(() => {
    const bounds = mapRef.current?.getMap()?.getBounds();
    if (!bounds) {
      // Bounds par défaut pour la France
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

  // Auto-fit bounds au chargement
  useEffect(() => {
    if (validOrganisations.length > 0 && mapRef.current) {
      const map = mapRef.current.getMap();

      // Créer bounds
      const bounds = new maplibregl.LngLatBounds();
      validOrganisations.forEach(org => {
        bounds.extend([org.longitude!, org.latitude!]);
      });

      // Fit avec padding
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
        duration: 1000,
      });
    }
  }, [validOrganisations]);

  // Handler clic sur cluster - avec ZOOM_BONUS pour zoom plus agressif
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

  // Handler clic sur marker
  const handleMarkerClick = useCallback(
    (org: Organisation) => {
      setSelectedOrg(org);
      onMarkerClick?.(org);
    },
    [onMarkerClick]
  );

  // Si aucune organisation avec coordonnées
  if (validOrganisations.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <div className="text-gray-400 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">
          Aucun établissement avec coordonnées
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Ajoutez des coordonnées GPS à vos organisations pour les voir sur la
          carte
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ height }}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Contrôles de navigation */}
        <NavigationControl position="top-right" />

        {/* Afficher clusters et markers */}
        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const props = cluster.properties;

          // Si c'est un cluster
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

          // Sinon c'est un point individuel
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

        {/* Popup pour l'organisation sélectionnée */}
        {selectedOrg && selectedOrg.longitude && selectedOrg.latitude && (
          <Popup
            longitude={selectedOrg.longitude}
            latitude={selectedOrg.latitude}
            anchor="bottom"
            offset={35}
            onClose={() => setSelectedOrg(null)}
            closeOnClick={false}
          >
            <div className="min-w-[180px] p-1">
              <p className="font-semibold text-gray-900">
                {selectedOrg.trade_name || selectedOrg.legal_name}
              </p>
              {selectedOrg.city && (
                <p className="text-gray-500 text-sm">{selectedOrg.city}</p>
              )}
              <p className="text-xs mt-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-white ${
                    selectedOrg.ownership_type === 'propre' ||
                    selectedOrg.ownership_type === 'succursale'
                      ? 'bg-blue-500'
                      : 'bg-orange-500'
                  }`}
                >
                  {selectedOrg.ownership_type === 'propre' ||
                  selectedOrg.ownership_type === 'succursale'
                    ? 'Restaurant propre'
                    : 'Franchise'}
                </span>
              </p>
              {/* Bouton voir détails */}
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(selectedOrg.id)}
                  className="mt-3 w-full px-3 py-1.5 text-sm font-medium text-white bg-[#5DBEBB] rounded-lg hover:bg-[#4DAEAB] transition-colors"
                >
                  Voir les détails
                </button>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

export default MapLibreMapView;
