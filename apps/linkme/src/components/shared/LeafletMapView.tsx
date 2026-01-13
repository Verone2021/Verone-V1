'use client';

/**
 * LeafletMapView - Carte interactive avec clustering
 *
 * Composant réutilisable pour afficher des organisations sur une carte
 * Leaflet avec zoom, clustering pour zones denses, et popups.
 *
 * @module LeafletMapView
 * @since 2026-01-12
 */

import { useEffect } from 'react';

import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

import 'leaflet/dist/leaflet.css';

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
  // 'succursale' est traité comme 'propre' pour l'affichage
  ownership_type?: 'propre' | 'franchise' | 'succursale' | null;
}

interface LeafletMapViewProps {
  /** Liste des organisations à afficher */
  organisations: Organisation[];
  /** Hauteur de la carte en pixels */
  height?: number;
  /** Centre de la carte [lat, lng] */
  center?: [number, number];
  /** Niveau de zoom initial (1-18) */
  zoom?: number;
  /** Callback au clic sur un marker */
  onMarkerClick?: (org: Organisation) => void;
  /** Couleur pour les établissements propres */
  colorPropre?: string;
  /** Couleur pour les franchises */
  colorFranchise?: string;
}

// ============================================
// FIX LEAFLET DEFAULT ICON
// ============================================

// Fix pour le problème d'icônes par défaut de Leaflet avec Webpack/Next.js
const fixLeafletIcon = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// ============================================
// CUSTOM MARKER ICONS
// ============================================

const createMarkerIcon = (color: 'blue' | 'orange' | 'green' | 'red') => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const ICONS = {
  propre: createMarkerIcon('blue'),
  franchise: createMarkerIcon('orange'),
  default: createMarkerIcon('green'),
};

// ============================================
// MAP BOUNDS AUTO-FIT
// ============================================

function FitBounds({ organisations }: { organisations: Organisation[] }) {
  const map = useMap();

  useEffect(() => {
    const validOrgs = organisations.filter(
      o => o.latitude !== null && o.longitude !== null
    );

    if (validOrgs.length > 0) {
      const bounds = L.latLngBounds(
        validOrgs.map(o => [o.latitude!, o.longitude!] as [number, number])
      );
      // Ajouter un peu de padding
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [map, organisations]);

  return null;
}

// ============================================
// COMPONENT
// ============================================

export function LeafletMapView({
  organisations,
  height = 500,
  center = [46.5, 2.5], // France center
  zoom = 6,
  onMarkerClick,
}: LeafletMapViewProps) {
  // Fix Leaflet icons on mount
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  // Filtrer les organisations avec coordonnées valides
  const validOrganisations = organisations.filter(
    org => org.latitude !== null && org.longitude !== null
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
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      scrollWheelZoom
      className="rounded-lg z-0"
    >
      {/* Tiles OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-fit bounds to markers */}
      <FitBounds organisations={validOrganisations} />

      {/* Markers avec clustering */}
      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        maxClusterRadius={60}
        spiderfyOnMaxZoom
        disableClusteringAtZoom={16}
      >
        {validOrganisations.map(org => {
          // 'succursale' est affiché comme 'propre' (même couleur)
          const icon =
            org.ownership_type === 'propre' ||
            org.ownership_type === 'succursale'
              ? ICONS.propre
              : org.ownership_type === 'franchise'
                ? ICONS.franchise
                : ICONS.default;

          return (
            <Marker
              key={org.id}
              position={[org.latitude!, org.longitude!]}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick?.(org),
              }}
            >
              <Popup>
                <div className="min-w-[150px]">
                  <p className="font-semibold text-[#183559]">
                    {org.trade_name || org.legal_name}
                  </p>
                  {org.city && (
                    <p className="text-gray-500 text-sm">{org.city}</p>
                  )}
                  <p className="text-xs mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-white ${
                        org.ownership_type === 'propre' ||
                        org.ownership_type === 'succursale'
                          ? 'bg-[#5DBEBB]'
                          : 'bg-orange-500'
                      }`}
                    >
                      {org.ownership_type === 'propre' ||
                      org.ownership_type === 'succursale'
                        ? 'Propre'
                        : 'Franchise'}
                    </span>
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}

export default LeafletMapView;
