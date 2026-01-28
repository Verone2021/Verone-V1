'use client';

import { useMemo, useState } from 'react';

import { Card, Text, Title } from '@tremor/react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';

import type { RegionStats } from '@/lib/hooks/use-affiliate-network';

// GeoJSON des régions françaises (source: France GeoJSON simplifié)
const FRANCE_REGIONS_URL =
  'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-version-simplifiee.geojson';

// Mapping des noms de régions vers les codes
const REGION_NAME_TO_CODE: Record<string, string> = {
  'Auvergne-Rhône-Alpes': 'ARA',
  'Bourgogne-Franche-Comté': 'BFC',
  Bretagne: 'BRE',
  'Centre-Val de Loire': 'CVL',
  Corse: 'COR',
  'Grand Est': 'GES',
  'Hauts-de-France': 'HDF',
  'Île-de-France': 'IDF',
  Normandie: 'NOR',
  'Nouvelle-Aquitaine': 'NAQ',
  Occitanie: 'OCC',
  'Pays de la Loire': 'PDL',
  "Provence-Alpes-Côte d'Azur": 'PAC',
};

interface FranceMapProps {
  regionData: RegionStats[];
  isLoading?: boolean;
  height?: number;
}

export function FranceMap({
  regionData,
  isLoading,
  height = 400,
}: FranceMapProps) {
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Créer un map pour accès rapide aux données
  const regionDataMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const region of regionData) {
      map.set(region.regionCode, region.count);
    }
    return map;
  }, [regionData]);

  // Calculer le max pour la colorisation
  const maxCount = useMemo(() => {
    if (regionData.length === 0) return 1;
    return Math.max(...regionData.map(r => r.count));
  }, [regionData]);

  // Fonction de couleur basée sur le nombre
  const getColor = (count: number): string => {
    if (count === 0) return '#f3f4f6'; // gray-100
    const intensity = count / maxCount;
    if (intensity < 0.25) return '#dbeafe'; // blue-100
    if (intensity < 0.5) return '#93c5fd'; // blue-300
    if (intensity < 0.75) return '#3b82f6'; // blue-500
    return '#1d4ed8'; // blue-700
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="h-[400px] bg-gray-100 rounded" />
      </Card>
    );
  }

  return (
    <Card>
      <Title className="mb-4">Répartition géographique</Title>

      <div className="relative" style={{ height }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [2.5, 46.5],
            scale: 2800,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup center={[2.5, 46.5]} zoom={1}>
            <Geographies geography={FRANCE_REGIONS_URL}>
              {({
                geographies,
              }: {
                geographies: Array<{
                  rsmKey: string;
                  properties: { nom: string };
                }>;
              }) =>
                geographies.map(
                  (geo: { rsmKey: string; properties: { nom: string } }) => {
                    const regionName = geo.properties.nom;
                    const regionCode = REGION_NAME_TO_CODE[regionName] ?? '';
                    const count = regionDataMap.get(regionCode) ?? 0;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getColor(count)}
                        stroke="#ffffff"
                        strokeWidth={1}
                        style={{
                          default: { outline: 'none' },
                          hover: {
                            fill: '#fbbf24',
                            outline: 'none',
                            cursor: 'pointer',
                          },
                          pressed: { outline: 'none' },
                        }}
                        onMouseEnter={(e: React.MouseEvent) => {
                          setTooltipContent(
                            `${regionName}: ${count} établissement${count > 1 ? 's' : ''}`
                          );
                          setTooltipPosition({
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                        onMouseLeave={() => {
                          setTooltipContent(null);
                        }}
                      />
                    );
                  }
                )
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltipContent && (
          <div
            className="fixed z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg pointer-events-none"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y - 30,
            }}
          >
            {tooltipContent}
          </div>
        )}

        {/* Légende */}
        <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow-sm">
          <Text className="text-xs font-medium mb-2">Légende</Text>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: '#f3f4f6' }}
              />
              <span>0</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: '#dbeafe' }}
              />
              <span>1-2</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: '#3b82f6' }}
              />
              <span>3+</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: '#1d4ed8' }}
              />
              <span>Max</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
