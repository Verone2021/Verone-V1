'use client';

/**
 * EnseigneGeographySection - Distribution géographique
 *
 * Affiche :
 * - Répartition par ville (badges colorés)
 * - Barres horizontales optionnelles pour le CA
 *
 * @module EnseigneGeographySection
 */

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { MapPin } from 'lucide-react';

import type { CityDistribution } from '../../hooks/use-enseigne-stats';

interface EnseigneGeographySectionProps {
  citiesDistribution: CityDistribution[];
  loading?: boolean;
  className?: string;
}

/**
 * Couleurs pour les badges (rotation)
 */
const BADGE_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-cyan-100 text-cyan-800',
  'bg-indigo-100 text-indigo-800',
  'bg-teal-100 text-teal-800',
];

/**
 * Formater un montant en euros compact
 */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} M€`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)} k€`;
  }
  return `${value.toLocaleString('fr-FR')} €`;
}

/**
 * Skeleton pour loading
 */
function GeographySkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="w-48 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="w-24 h-8 bg-gray-200 rounded-full animate-pulse"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Section répartition géographique
 * Design simple avec badges colorés
 */
export function EnseigneGeographySection({
  citiesDistribution,
  loading = false,
  className,
}: EnseigneGeographySectionProps) {
  if (loading) {
    return <GeographySkeleton />;
  }

  if (!citiesDistribution || citiesDistribution.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <MapPin className="h-5 w-5 mr-2 text-gray-500" />
            Répartition géographique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            Aucune donnée géographique disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculer le max pour les barres de progression
  const maxRevenue = Math.max(...citiesDistribution.map(c => c.revenue));

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base">
          <MapPin className="h-5 w-5 mr-2 text-gray-500" />
          Répartition géographique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Badges pour les villes */}
        <div className="flex flex-wrap gap-2">
          {citiesDistribution.map((city, index) => (
            <Badge
              key={city.city}
              variant="secondary"
              className={cn(
                'px-3 py-1 text-sm',
                BADGE_COLORS[index % BADGE_COLORS.length]
              )}
            >
              {city.city} ({city.count})
            </Badge>
          ))}
        </div>

        {/* Barres de progression par CA */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-gray-500 font-medium">CA par ville</p>
          {citiesDistribution.slice(0, 6).map((city, index) => {
            const percentage =
              maxRevenue > 0 ? (city.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={city.city} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium truncate max-w-[200px]">
                    {city.city}
                  </span>
                  <span className="text-gray-500 ml-2 flex-shrink-0">
                    {formatCurrency(city.revenue)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      index === 0
                        ? 'bg-blue-500'
                        : index === 1
                          ? 'bg-green-500'
                          : index === 2
                            ? 'bg-purple-500'
                            : index === 3
                              ? 'bg-amber-500'
                              : 'bg-gray-400'
                    )}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
          {citiesDistribution.length > 6 && (
            <p className="text-xs text-gray-400 text-center pt-1">
              + {citiesDistribution.length - 6} autre(s) ville(s)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
