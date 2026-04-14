'use client';

/**
 * EnseigneMapSection - Carte interactive pleine largeur des organisations
 *
 * Layout : carte pleine largeur (600px) + FAB pour ouvrir le modal OrgBrowseModal
 * Features : Supercluster clustering, markers bleu/orange, KPIs, popups
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@verone/utils';
import { List, MapPin } from 'lucide-react';
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
import {
  ClusterMarker,
  KPICards,
  MAP_STYLE,
  MapSkeleton,
  MarkerPin,
  MAX_ZOOM,
  MIN_ZOOM,
  DEFAULT_ZOOM,
  FRANCE_CENTER,
  ZOOM_BONUS,
  FITBOUNDS_PADDING,
  OrgPopup,
  type ClusterProperties,
  type PointProperties,
} from './EnseigneMapComponents';

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
  onViewOrganisation?: (organisationId: string) => void;
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

  const validOrganisations = useMemo(
    () =>
      organisations.filter(
        org => org.latitude !== null && org.longitude !== null
      ),
    [organisations]
  );

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
      <KPICards
        total={totalOrganisations}
        propres={propresCount}
        franchises={franchisesCount}
        withGPS={withCoordinatesCount}
      />

      <div
        className="relative rounded-b-lg overflow-hidden border border-gray-200"
        style={{
          height: 'calc(100vh - 320px)',
          minHeight: 400,
          maxHeight: 600,
        }}
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
