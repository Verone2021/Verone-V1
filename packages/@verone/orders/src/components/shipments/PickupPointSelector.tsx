'use client';

import { useEffect, useState } from 'react';

import { Card } from '@verone/ui';
import { Loader2, MapPin, Clock } from 'lucide-react';

/**
 * Interface TypeScript pour point relais PackLink
 * Source: https://api.packlink.com/v1/dropoffs
 */
export interface PacklinkDropoffPoint {
  id: string;
  commerce_name: string;
  address: string;
  city: string;
  zip: string;
  lat: number;
  long: number;
  phone: string;
  carrier?: string;
  opening_times: {
    opening_times: {
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
      sunday: string;
    };
  };
}

interface PickupPointSelectorProps {
  serviceId: number;
  country: string;
  zipCode: string;
  selectedPointId?: string;
  onSelect: (dropoffPoint: PacklinkDropoffPoint) => void;
  label: string;
}

/**
 * PickupPointSelector - Composant sélection point relais/locker PackLink (Simplifié)
 *
 * Features:
 * - Appel API /api/packlink/dropoffs (vraie API PackLink)
 * - Liste 20 points relais maximum
 * - Sélection point avec highlight
 * - Horaires d'ouverture avec toggle
 * - Pas de Google Maps (billing désactivé temporairement)
 *
 * @example
 * <PickupPointSelector
 *   serviceId={21369}
 *   country="FR"
 *   zipCode="75001"
 *   label="Point de retrait"
 *   onSelect={(point) => console.log(point)}
 * />
 */
export function PickupPointSelector({
  serviceId,
  country,
  zipCode,
  selectedPointId,
  onSelect,
  label,
}: PickupPointSelectorProps) {
  const [dropoffs, setDropoffs] = useState<PacklinkDropoffPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHours, setExpandedHours] = useState<string | null>(null);

  // Fetch dropoffs depuis API
  useEffect(() => {
    if (!serviceId || !country || !zipCode) {
      return;
    }

    setLoading(true);
    setError(null);

    fetch(
      `/api/packlink/dropoffs?service_id=${serviceId}&country=${country}&zip=${zipCode}`
    )
      .then(res => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.dropoffs) {
          setDropoffs(data.dropoffs);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      })
      .catch(err => {
        console.error('[PickupPointSelector] Error:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [serviceId, country, zipCode]);

  // Toggle horaires d'ouverture
  const toggleHours = (pointId: string) => {
    setExpandedHours(expandedHours === pointId ? null : pointId);
  };

  // Formater les horaires d'ouverture
  const formatDay = (day: string) => {
    const days: Record<string, string> = {
      monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche',
    };
    return days[day] || day;
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="font-semibold text-base flex items-center gap-2">
        <MapPin className="w-5 h-5 text-verone-primary" />
        {label}
      </h3>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-verone-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            Chargement des points relais...
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {!loading && !error && dropoffs.length > 0 && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {dropoffs.map((point, index) => (
            <div
              key={point.id}
              className={`p-4 rounded-lg border transition-all ${
                selectedPointId === point.id
                  ? 'border-verone-primary bg-verone-primary/5'
                  : 'border-gray-200 hover:border-verone-primary/50 hover:bg-gray-50'
              }`}
            >
              <button
                onClick={() => onSelect(point)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-verone-primary text-white text-sm font-semibold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {point.commerce_name}
                    </p>
                    {point.carrier && (
                      <p className="text-xs text-verone-primary font-medium">
                        {point.carrier}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {point.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {point.zip} {point.city}
                    </p>
                    {point.phone && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📞 {point.phone}
                      </p>
                    )}
                  </div>
                </div>
              </button>

              {/* Toggle horaires */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleHours(point.id);
                }}
                className="mt-3 flex items-center gap-2 text-xs text-verone-primary hover:underline"
              >
                <Clock className="w-4 h-4" />
                {expandedHours === point.id
                  ? 'Masquer horaires'
                  : 'Voir horaires'}
              </button>

              {/* Horaires d'ouverture */}
              {expandedHours === point.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                  {Object.entries(point.opening_times.opening_times).map(
                    ([day, hours]) => (
                      <div key={day} className="flex justify-between text-xs">
                        <span className="font-medium text-gray-700">
                          {formatDay(day)}
                        </span>
                        <span className="text-muted-foreground">{hours}</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && dropoffs.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Aucun point relais trouvé pour ce service et code postal.
        </div>
      )}
    </Card>
  );
}
