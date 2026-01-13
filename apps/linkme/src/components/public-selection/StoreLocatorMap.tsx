'use client';

import { useMemo, useState } from 'react';

import { MapPin, Store } from 'lucide-react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

// Europe TopoJSON from Natural Earth (simplified)
const EUROPE_GEO_URL =
  'https://raw.githubusercontent.com/deldersveld/topojson/master/continents/europe.json';

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

export function StoreLocatorMap({
  organisations,
  branding,
  enseigneName,
}: IStoreLocatorMapProps): React.JSX.Element {
  const [hoveredStore, setHoveredStore] = useState<IOrganisation | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedStore, setSelectedStore] = useState<IOrganisation | null>(
    null
  );

  // Filter organisations with valid coordinates
  const validOrganisations = useMemo(
    () =>
      organisations.filter(
        org => org.latitude !== null && org.longitude !== null
      ),
    [organisations]
  );

  // Calculate center based on markers or default to France
  const mapCenter = useMemo((): [number, number] => {
    if (validOrganisations.length === 0) {
      return [2.5, 46.5]; // France center
    }

    const avgLat =
      validOrganisations.reduce((sum, org) => sum + (org.latitude ?? 0), 0) /
      validOrganisations.length;
    const avgLng =
      validOrganisations.reduce((sum, org) => sum + (org.longitude ?? 0), 0) /
      validOrganisations.length;

    return [avgLng, avgLat];
  }, [validOrganisations]);

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
              Les coordonnées GPS des établissements n'ont pas encore été
              renseignées.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="stores-section" className="bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-4"
            style={{ backgroundColor: `${branding.primary_color}15` }}
          >
            <Store
              className="h-6 w-6"
              style={{ color: branding.primary_color }}
            />
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: branding.text_color }}
          >
            Nos points de vente
          </h2>
          <p className="text-gray-600">
            {validOrganisations.length} établissement
            {validOrganisations.length > 1 ? 's' : ''} {enseigneName}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="relative h-[400px]">
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    center: mapCenter,
                    scale: 800,
                  }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <ZoomableGroup
                    center={mapCenter}
                    zoom={1}
                    minZoom={0.5}
                    maxZoom={4}
                  >
                    <Geographies geography={EUROPE_GEO_URL}>
                      {({ geographies }) =>
                        geographies.map(geo => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#f3f4f6"
                            stroke="#e5e7eb"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: 'none' },
                              hover: { fill: '#e5e7eb', outline: 'none' },
                              pressed: { outline: 'none' },
                            }}
                          />
                        ))
                      }
                    </Geographies>

                    {/* Markers */}
                    {validOrganisations.map(org => (
                      <Marker
                        key={org.id}
                        coordinates={[org.longitude!, org.latitude!]}
                        onMouseEnter={e => {
                          setHoveredStore(org);
                          setTooltipPosition({
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                        onMouseLeave={() => setHoveredStore(null)}
                        onClick={() =>
                          setSelectedStore(
                            selectedStore?.id === org.id ? null : org
                          )
                        }
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          r={selectedStore?.id === org.id ? 8 : 6}
                          fill={
                            selectedStore?.id === org.id
                              ? branding.accent_color
                              : branding.primary_color
                          }
                          stroke="#fff"
                          strokeWidth={2}
                          className="transition-all duration-200"
                        />
                      </Marker>
                    ))}
                  </ZoomableGroup>
                </ComposableMap>

                {/* Tooltip on hover */}
                {hoveredStore && (
                  <div
                    className="fixed z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg pointer-events-none max-w-xs"
                    style={{
                      left: tooltipPosition.x + 10,
                      top: tooltipPosition.y - 40,
                    }}
                  >
                    <p className="font-medium">{hoveredStore.name}</p>
                    {hoveredStore.city && (
                      <p className="text-gray-300 text-xs">
                        {hoveredStore.city}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Store List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm max-h-[400px] overflow-y-auto">
              <div className="divide-y divide-gray-50">
                {validOrganisations.map(org => (
                  <button
                    key={org.id}
                    onClick={() =>
                      setSelectedStore(
                        selectedStore?.id === org.id ? null : org
                      )
                    }
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedStore?.id === org.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                          selectedStore?.id === org.id ? '' : ''
                        }`}
                        style={{
                          backgroundColor:
                            selectedStore?.id === org.id
                              ? branding.primary_color
                              : `${branding.primary_color}15`,
                        }}
                      >
                        <MapPin
                          className="h-4 w-4"
                          style={{
                            color:
                              selectedStore?.id === org.id
                                ? '#fff'
                                : branding.primary_color,
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-sm truncate"
                          style={{ color: branding.text_color }}
                        >
                          {org.name}
                        </p>
                        {org.address && (
                          <p className="text-xs text-gray-500 truncate">
                            {org.address}
                          </p>
                        )}
                        {org.city && (
                          <p className="text-xs text-gray-500">
                            {org.postalCode} {org.city}
                            {org.country && org.country !== 'France'
                              ? `, ${org.country}`
                              : ''}
                          </p>
                        )}
                        {selectedStore?.id === org.id && org.phone && (
                          <a
                            href={`tel:${org.phone.replace(/\s/g, '')}`}
                            className="inline-block mt-2 text-xs font-medium hover:underline"
                            style={{ color: branding.primary_color }}
                            onClick={e => e.stopPropagation()}
                          >
                            📞 {org.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
