'use client';

import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  AlertTriangle,
  Clock,
  Loader2,
  MapPin,
  Package,
  Truck,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

interface PacklinkService {
  id: number;
  name: string;
  carrier_name: string;
  price: {
    total_price: number;
    currency: string;
  };
  transit_hours: string;
  delivery_to_parcelshop: boolean;
  first_estimated_delivery_date: string;
  dropoff: boolean;
}

interface PackageInput {
  weight: number;
  width: number;
  height: number;
  length: number;
}

interface PacklinkServiceSelectorProps {
  destinationZip: string;
  destinationCountry?: string;
  defaultPackages?: PackageInput[];
  onServiceSelect: (service: {
    serviceId: number;
    carrierName: string;
    serviceName: string;
    price: number;
    transitHours: string;
    estimatedDelivery: string;
  }) => void;
}

// ── Component ──────────────────────────────────────────────────

export function PacklinkServiceSelector({
  destinationZip,
  destinationCountry = 'FR',
  defaultPackages,
  onServiceSelect,
}: PacklinkServiceSelectorProps) {
  const [packages, setPackages] = useState<PackageInput[]>(
    defaultPackages ?? [{ weight: 5, width: 30, height: 30, length: 30 }]
  );
  const [services, setServices] = useState<PacklinkService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null
  );

  const fetchServices = useCallback(async () => {
    if (!destinationZip) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/packlink/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toCountry: destinationCountry,
          toZip: destinationZip,
          packages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = (await response.json()) as {
        services: PacklinkService[];
      };
      setServices(data.services ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur de connexion Packlink'
      );
    }

    setLoading(false);
  }, [destinationZip, destinationCountry, packages]);

  // Auto-fetch on mount if destination is set
  useEffect(() => {
    if (destinationZip) {
      void fetchServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePackageChange = (
    index: number,
    field: keyof PackageInput,
    value: string
  ) => {
    setPackages(prev =>
      prev.map((pkg, i) =>
        i === index ? { ...pkg, [field]: parseFloat(value) || 0 } : pkg
      )
    );
  };

  const handleSelectService = (service: PacklinkService) => {
    setSelectedServiceId(service.id);
    onServiceSelect({
      serviceId: service.id,
      carrierName: service.carrier_name,
      serviceName: service.name,
      price: service.price.total_price,
      transitHours: service.transit_hours,
      estimatedDelivery: service.first_estimated_delivery_date,
    });
  };

  const formatTransitTime = (hours: string): string => {
    const h = parseInt(hours, 10);
    if (h <= 24) return '1 jour';
    if (h <= 48) return '2 jours';
    return `${Math.ceil(h / 24)} jours`;
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-blue-50/50">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-blue-600" />
        <span className="font-semibold text-sm">Packlink PRO</span>
        <Badge className="bg-blue-100 text-blue-700 text-xs">
          Multi-transporteurs
        </Badge>
      </div>

      {/* Package dimensions */}
      <div>
        <Label className="text-xs text-muted-foreground">
          Dimensions du colis (cm) et poids (kg)
        </Label>
        {packages.map((pkg, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 mt-2">
            <div>
              <Label className="text-xs">Longueur</Label>
              <Input
                type="number"
                min="1"
                value={pkg.length || ''}
                onChange={e =>
                  handlePackageChange(index, 'length', e.target.value)
                }
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Largeur</Label>
              <Input
                type="number"
                min="1"
                value={pkg.width || ''}
                onChange={e =>
                  handlePackageChange(index, 'width', e.target.value)
                }
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Hauteur</Label>
              <Input
                type="number"
                min="1"
                value={pkg.height || ''}
                onChange={e =>
                  handlePackageChange(index, 'height', e.target.value)
                }
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Poids (kg)</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={pkg.weight || ''}
                onChange={e =>
                  handlePackageChange(index, 'weight', e.target.value)
                }
                className="h-8"
              />
            </div>
          </div>
        ))}
        <ButtonV2
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => {
            void fetchServices();
          }}
        >
          <Package className="h-3.5 w-3.5 mr-1" />
          Rechercher les tarifs
        </ButtonV2>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Recherche des meilleurs tarifs...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Services list */}
      {!loading && services.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {services.length} services disponibles
          </Label>
          <div className="max-h-[300px] overflow-y-auto space-y-1.5">
            {services.map(service => {
              const isSelected = selectedServiceId === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleSelectService(service)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {service.carrier_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {service.name}
                      </span>
                    </div>
                    <span className="font-bold text-sm">
                      {service.price.total_price.toFixed(2)} EUR
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTransitTime(service.transit_hours)}
                    </span>
                    {service.delivery_to_parcelshop && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Point relais
                      </span>
                    )}
                    {!service.delivery_to_parcelshop && (
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Domicile
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* No services */}
      {!loading && !error && services.length === 0 && destinationZip && (
        <p className="text-xs text-muted-foreground">
          Cliquez sur &quot;Rechercher les tarifs&quot; pour voir les
          transporteurs disponibles
        </p>
      )}
    </div>
  );
}
